import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// Contact ID = base64 encoded email
// Now queries directly by owner_email (no files table dependency)

// Engagement calculation helper - MUST match ViewersTab exactly
function calculateEngagement(
  isTrackSite: boolean,
  totalClicks: number,
  isReturnVisitor: boolean,
  totalDurationSeconds: number,
  maxCompletionPercentage: number,
  downloaded: boolean,
  maxPageReached: number,
  totalPages: number
): number {
  if (isTrackSite) {
    // Track Site Individual Score Formula: Return (60%) + Frequency (40%)
    const returnScore = isReturnVisitor ? 100 : 0;
    const frequencyScore = Math.min(100, totalClicks * 33);
    return Math.round((returnScore * 0.60) + (frequencyScore * 0.40));
  } else {
    // File Individual Score Formula: Time(25%) + Completion(25%) + Download(20%) + Return(15%) + Depth(15%)

    // Time score (0-100 based on total duration)
    const duration = totalDurationSeconds;
    let timeScore: number;
    if (duration <= 0) timeScore = 0;
    else if (duration < 30) timeScore = Math.round((duration / 30) * 25);
    else if (duration < 60) timeScore = 25 + Math.round(((duration - 30) / 30) * 15);
    else if (duration < 120) timeScore = 40 + Math.round(((duration - 60) / 60) * 20);
    else if (duration < 300) timeScore = 60 + Math.round(((duration - 120) / 180) * 20);
    else if (duration < 600) timeScore = 80 + Math.round(((duration - 300) / 300) * 20);
    else timeScore = 100;

    // Completion score (direct percentage)
    const completionScore = maxCompletionPercentage;

    // Download score (binary)
    const downloadScore = downloaded ? 100 : 0;

    // Return score (binary)
    const returnScore = isReturnVisitor ? 100 : 0;

    // Depth score (pages reached / total pages)
    // Only use page-based depth for multi-page documents (totalPages > 1)
    // For videos/images/single-page files, use completion as depth proxy
    let depthScore = 0;
    if (totalPages && totalPages > 1 && maxPageReached > 0) {
      depthScore = Math.round((maxPageReached / totalPages) * 100);
    } else {
      depthScore = maxCompletionPercentage;
    }

    // Weighted sum
    return Math.round(
      (timeScore * 0.25) +
      (completionScore * 0.25) +
      (downloadScore * 0.20) +
      (returnScore * 0.15) +
      (depthScore * 0.15)
    );
  }
}

// Helper: Get actual duration from access log
// Primary: total_duration_seconds (most precise - wall clock time)
// Fallback: sum of pages_time_data (when session end failed to send)
function getActualDuration(log: any): number {
  // Primary source: total_duration_seconds
  if (log.total_duration_seconds && log.total_duration_seconds > 0) {
    return log.total_duration_seconds;
  }

  // Fallback: sum pages_time_data if available
  if (log.pages_time_data && typeof log.pages_time_data === 'object') {
    const times = Object.values(log.pages_time_data as Record<string, number>);
    if (times.length > 0) {
      return Math.round(times.reduce((sum: number, t: any) => sum + (Number(t) || 0), 0));
    }
  }

  return 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: encodedId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;

    // Decode the contact email from base64
    let viewerEmail: string;
    try {
      viewerEmail = Buffer.from(encodedId, 'base64').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    // Validate email is not empty
    if (!viewerEmail || !viewerEmail.trim()) {
      return NextResponse.json({ error: 'Invalid contact - no email' }, { status: 400 });
    }

    // Get date filters from query params
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query with optional date filtering
    let query = supabaseAdmin
      .from('access_logs')
      .select('*')
      .eq('owner_email', userEmail)
      .eq('viewer_email', viewerEmail);

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('accessed_at', startDate);
    }
    if (endDate) {
      query = query.lte('accessed_at', endDate);
    }

    const { data: accessLogs, error: logsError } = await query.order('accessed_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching access logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch viewer data' }, { status: 500 });
    }

    if (!accessLogs || accessLogs.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Aggregate contact data
    const latestLog = accessLogs[0];
    const firstLog = accessLogs[accessLogs.length - 1];

    // Parse company from email
    const domain = viewerEmail.split('@')[1];
    let company: string | null = null;
    if (domain) {
      const domainName = domain.split('.')[0].toLowerCase();
      const personalDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'aol', 'protonmail', 'naver', 'daum', 'hanmail'];
      if (!personalDomains.includes(domainName)) {
        company = domainName.charAt(0).toUpperCase() + domainName.slice(1);
      }
    }

    // Get best name from all visits
    const names = accessLogs.map(log => log.viewer_name).filter(n => n && n !== 'Anonymous');
    const contactName = names.length > 0 ? names[0] : 'Anonymous';

    // Count colleagues from same company (query by owner_email)
    let sameCompanyViewers = 0;
    if (company) {
      const { data: colleagueEmails } = await supabaseAdmin
        .from('access_logs')
        .select('viewer_email')
        .eq('owner_email', userEmail)
        .not('viewer_email', 'is', null)
        .ilike('viewer_email', `%@${domain}`);

      if (colleagueEmails) {
        const uniqueColleagues = new Set(colleagueEmails.map(c => c.viewer_email));
        uniqueColleagues.delete(viewerEmail);
        sameCompanyViewers = uniqueColleagues.size;
      }
    }

    // ==========================================
    // AGGREGATE VIEW HISTORY BY FILE_ID
    // Same logic as ViewersTab aggregates by viewer
    // ==========================================
    const fileMap = new Map<string, {
      file_id: string;
      file_name: string;
      file_type: string;
      link_type: string;
      total_clicks: number;
      is_return_visitor: boolean;
      total_duration_seconds: number;
      max_completion_percentage: number;
      max_page_reached: number;
      total_pages: number;
      downloaded: boolean;
      first_accessed_at: string;
      last_accessed_at: string;
      traffic_source: string;
      country: string;
      city: string;
      device_type: string;
      browser: string;
      os: string;
      link_deleted: boolean;
    }>();

    for (const log of accessLogs) {
      const fileId = log.file_id;

      if (fileMap.has(fileId)) {
        // Update existing file entry
        const file = fileMap.get(fileId)!;
        file.total_clicks += 1;
        file.is_return_visitor = true;
        file.total_duration_seconds += getActualDuration(log);

        // Max completion
        if ((log.completion_percentage || 0) > file.max_completion_percentage) {
          file.max_completion_percentage = log.completion_percentage || 0;
        }

        // Max page reached
        if ((log.max_page_reached || 0) > file.max_page_reached) {
          file.max_page_reached = log.max_page_reached || 0;
        }

        // Total pages (take latest non-zero)
        if (log.total_pages && log.total_pages > 0) {
          file.total_pages = log.total_pages;
        }

        // Downloaded ever
        if (log.is_downloaded || log.downloaded) {
          file.downloaded = true;
        }

        // Update last accessed
        if (new Date(log.accessed_at) > new Date(file.last_accessed_at)) {
          file.last_accessed_at = log.accessed_at;
          file.traffic_source = log.traffic_source || 'direct';
          file.country = log.country || '';
          file.city = log.city || '';
          file.device_type = log.device_type || '';
          file.browser = log.browser || '';
          file.os = log.os || '';
        }

        // Update first accessed
        if (new Date(log.accessed_at) < new Date(file.first_accessed_at)) {
          file.first_accessed_at = log.accessed_at;
        }
      } else {
        // Create new file entry
        fileMap.set(fileId, {
          file_id: fileId,
          file_name: log.file_name || '[Unknown]',
          file_type: log.file_type || 'file',
          link_type: log.link_type || 'file',
          total_clicks: 1,
          is_return_visitor: false,
          total_duration_seconds: getActualDuration(log),
          max_completion_percentage: log.completion_percentage || 0,
          max_page_reached: log.max_page_reached || 0,
          total_pages: log.total_pages || 0,
          downloaded: log.is_downloaded || log.downloaded || false,
          first_accessed_at: log.accessed_at,
          last_accessed_at: log.accessed_at,
          traffic_source: log.traffic_source || 'direct',
          country: log.country || '',
          city: log.city || '',
          device_type: log.device_type || '',
          browser: log.browser || '',
          os: log.os || '',
          link_deleted: log.link_deleted || false,
        });
      }
    }

    // Build view history with RECALCULATED engagement (matching ViewersTab exactly)
    const viewHistory = Array.from(fileMap.values()).map(file => {
      const isTrackSite = file.link_type === 'url';

      const engagementScore = calculateEngagement(
        isTrackSite,
        file.total_clicks,
        file.is_return_visitor,
        file.total_duration_seconds,
        file.max_completion_percentage,
        file.downloaded,
        file.max_page_reached,
        file.total_pages
      );

      return {
        id: file.file_id,
        file_id: file.file_id,
        file_name: file.file_name,
        file_type: file.file_type,
        link_type: file.link_type,
        accessed_at: file.last_accessed_at,
        first_accessed_at: file.first_accessed_at,
        engagement_score: engagementScore,
        total_clicks: file.total_clicks,
        total_duration_seconds: file.total_duration_seconds,
        completion_percentage: file.max_completion_percentage,
        downloaded: file.downloaded,
        is_return_visit: file.is_return_visitor,
        traffic_source: file.traffic_source,
        country: file.country,
        city: file.city,
        device_type: file.device_type,
        browser: file.browser,
        os: file.os,
        link_deleted: file.link_deleted,
      };
    });

    // Sort by last accessed (most recent first)
    viewHistory.sort((a, b) => new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime());

    // Calculate overall contact stats from aggregated file data
    const totalViews = accessLogs.length;
    const totalTimeSeconds = viewHistory.reduce((sum, v) => sum + v.total_duration_seconds, 0);
    const hasDownloaded = viewHistory.some(v => v.downloaded);
    const filesViewed = viewHistory.map(v => v.file_id);

    // Average engagement from recalculated scores
    const avgEngagement = viewHistory.length > 0
      ? Math.round(viewHistory.reduce((sum, v) => sum + v.engagement_score, 0) / viewHistory.length)
      : 0;

    // Average completion
    const avgCompletion = viewHistory.length > 0
      ? Math.round(viewHistory.reduce((sum, v) => sum + v.completion_percentage, 0) / viewHistory.length)
      : 0;

    // Determine if hot lead
    const isHotLead = avgEngagement >= 70 ||
      (avgEngagement >= 60 && hasDownloaded) ||
      (avgEngagement >= 50 && totalViews >= 3);

    // Find peak activity times
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    accessLogs.forEach(log => {
      const date = new Date(log.accessed_at);
      const hour = date.getHours();
      const day = date.getDay();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Format the response
    const contact = {
      id: encodedId,
      email: viewerEmail,
      name: contactName,
      company: company,
      total_views: totalViews,
      avg_engagement: avgEngagement,
      is_hot_lead: isHotLead,
      first_seen_at: firstLog.accessed_at,
      last_seen_at: latestLog.accessed_at,
      total_time_seconds: totalTimeSeconds,
      files_viewed: filesViewed,
      has_downloaded: hasDownloaded,
      country: latestLog.country,
      city: latestLog.city,
      device_type: latestLog.device_type,
      browser: latestLog.browser,
      os: latestLog.os,
      completion_rate: avgCompletion,
      sameCompanyViewers: sameCompanyViewers,
      peakHour: peakHour ? `${peakHour}:00` : null,
      peakDay: peakDay ? dayNames[parseInt(peakDay)] : null,
      tags: [],
    };

    // Fetch notes for this contact
    let notes: any[] = [];
    try {
      const { data: notesData } = await supabaseAdmin
        .from('contact_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_email', viewerEmail)
        .order('created_at', { ascending: false });
      notes = notesData || [];
    } catch (notesErr) {
      console.error('Error fetching notes:', notesErr);
      // Continue without notes if table doesn't exist
    }

    // Also return raw access logs for location-based analytics (WorldMap, hourly data)
    // Map to include only needed fields to reduce payload
    const accessLogsForAnalytics = accessLogs.map(log => ({
      id: log.id,
      accessed_at: log.accessed_at,
      country: log.country || null,
      city: log.city || null,
      device_type: log.device_type || null,
      browser: log.browser || null,
      os: log.os || null,
      traffic_source: log.traffic_source || null,
      utm_campaign: log.utm_campaign || null,
      is_qr_scan: log.is_qr_scan || false,
    }));

    return NextResponse.json({
      contact,
      viewHistory,
      accessLogs: accessLogsForAnalytics,
      notes,
    });

  } catch (error) {
    console.error('Contact fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH - Not supported for aggregated contacts
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({
    error: 'Contact updates not supported in aggregation mode'
  }, { status: 501 });
}

// DELETE - Not supported for aggregated contacts
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({
    error: 'Cannot delete aggregated contacts'
  }, { status: 501 });
}
