import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// Contacts = Aggregated Viewers from access_logs
// Now queries directly by owner_email (no files table dependency)
// Contact ID = base64 encoded email (for URL safety)

// Engagement calculation helper - MUST match ViewersTab and Individual Contact exactly
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Query access_logs directly by owner_email (no files table needed!)
    // Note: engagement_score and intent_signal removed - always recalculated
    let query = supabaseAdmin
      .from('access_logs')
      .select(`
        id,
        file_id,
        file_name,
        file_type,
        link_type,
        viewer_name,
        viewer_email,
        total_duration_seconds,
        pages_time_data,
        completion_percentage,
        max_page_reached,
        total_pages,
        accessed_at,
        is_downloaded,
        downloaded,
        is_return_visit,
        country,
        city,
        device_type,
        browser
      `)
      .eq('owner_email', userEmail)
      .not('viewer_email', 'is', null)
      .neq('viewer_email', '');

    // Apply date filters
    if (startDate) {
      query = query.gte('accessed_at', startDate);
    }
    if (endDate) {
      query = query.lte('accessed_at', endDate);
    }

    const { data: accessLogs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching access logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch viewer data' }, { status: 500 });
    }

    if (!accessLogs || accessLogs.length === 0) {
      return NextResponse.json({ contacts: [] });
    }

    // Step 1: Group logs by viewer_email, then by file_id
    // This matches how Individual Contact page calculates engagement
    const viewerFilesMap = new Map<string, Map<string, {
      file_id: string;
      link_type: string;
      total_clicks: number;
      is_return_visitor: boolean;
      total_duration_seconds: number;
      max_completion_percentage: number;
      max_page_reached: number;
      total_pages: number;
      downloaded: boolean;
    }>>();

    // Contact-level aggregations
    const contactDataMap = new Map<string, {
      email: string;
      name: string;
      company: string | null;
      total_views: number;
      total_time_seconds: number;
      first_seen_at: string;
      last_seen_at: string;
      has_downloaded: boolean;
      country: string | null;
      city: string | null;
      device_type: string | null;
      browser: string | null;
    }>();

    for (const log of accessLogs) {
      const email = log.viewer_email!;
      const fileId = log.file_id;

      // Initialize viewer's file map if needed
      if (!viewerFilesMap.has(email)) {
        viewerFilesMap.set(email, new Map());
      }

      // Initialize contact data if needed
      if (!contactDataMap.has(email)) {
        const domain = email.split('@')[1];
        let company: string | null = null;
        if (domain) {
          const domainName = domain.split('.')[0].toLowerCase();
          const personalDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'aol', 'protonmail', 'naver', 'daum', 'hanmail'];
          if (!personalDomains.includes(domainName)) {
            company = domainName.charAt(0).toUpperCase() + domainName.slice(1);
          }
        }

        contactDataMap.set(email, {
          email,
          name: log.viewer_name || 'Anonymous',
          company,
          total_views: 0,
          total_time_seconds: 0,
          first_seen_at: log.accessed_at,
          last_seen_at: log.accessed_at,
          has_downloaded: false,
          country: log.country,
          city: log.city,
          device_type: log.device_type,
          browser: log.browser,
        });
      }

      const contactData = contactDataMap.get(email)!;
      const viewerFiles = viewerFilesMap.get(email)!;

      // Update contact-level stats
      contactData.total_views++;
      contactData.total_time_seconds += getActualDuration(log);
      if (log.is_downloaded || log.downloaded) contactData.has_downloaded = true;

      if (log.viewer_name && log.viewer_name !== 'Anonymous' && contactData.name === 'Anonymous') {
        contactData.name = log.viewer_name;
      }

      if (new Date(log.accessed_at) < new Date(contactData.first_seen_at)) {
        contactData.first_seen_at = log.accessed_at;
      }
      if (new Date(log.accessed_at) > new Date(contactData.last_seen_at)) {
        contactData.last_seen_at = log.accessed_at;
        contactData.country = log.country;
        contactData.city = log.city;
        contactData.device_type = log.device_type;
        contactData.browser = log.browser;
      }

      // Aggregate per-file stats for this viewer
      if (viewerFiles.has(fileId)) {
        const fileStats = viewerFiles.get(fileId)!;
        fileStats.total_clicks++;
        fileStats.is_return_visitor = true;
        fileStats.total_duration_seconds += getActualDuration(log);

        if ((log.completion_percentage || 0) > fileStats.max_completion_percentage) {
          fileStats.max_completion_percentage = log.completion_percentage || 0;
        }
        if ((log.max_page_reached || 0) > fileStats.max_page_reached) {
          fileStats.max_page_reached = log.max_page_reached || 0;
        }
        if (log.total_pages && log.total_pages > 0) {
          fileStats.total_pages = log.total_pages;
        }
        if (log.is_downloaded || log.downloaded) {
          fileStats.downloaded = true;
        }
      } else {
        viewerFiles.set(fileId, {
          file_id: fileId,
          link_type: log.link_type || 'file',
          total_clicks: 1,
          is_return_visitor: false,
          total_duration_seconds: getActualDuration(log),
          max_completion_percentage: log.completion_percentage || 0,
          max_page_reached: log.max_page_reached || 0,
          total_pages: log.total_pages || 0,
          downloaded: log.is_downloaded || log.downloaded || false,
        });
      }
    }

    // Step 2: Calculate engagement per file, then average for each contact
    let contacts = Array.from(contactDataMap.entries()).map(([email, data]) => {
      const viewerFiles = viewerFilesMap.get(email)!;

      // Calculate engagement for each file this contact viewed
      const fileEngagements: number[] = [];
      viewerFiles.forEach(fileStats => {
        const isTrackSite = fileStats.link_type === 'url';
        const engagement = calculateEngagement(
          isTrackSite,
          fileStats.total_clicks,
          fileStats.is_return_visitor,
          fileStats.total_duration_seconds,
          fileStats.max_completion_percentage,
          fileStats.downloaded,
          fileStats.max_page_reached,
          fileStats.total_pages
        );
        fileEngagements.push(engagement);
      });

      // Average engagement across all files
      const avgEngagement = fileEngagements.length > 0
        ? Math.round(fileEngagements.reduce((a, b) => a + b, 0) / fileEngagements.length)
        : 0;

      const isHotLead = avgEngagement >= 70 ||
        (avgEngagement >= 60 && data.has_downloaded) ||
        (avgEngagement >= 50 && data.total_views >= 3);

      return {
        id: Buffer.from(email).toString('base64'),
        email: data.email,
        name: data.name,
        company: data.company,
        total_views: data.total_views,
        avg_engagement: avgEngagement,
        is_hot_lead: isHotLead,
        first_seen_at: data.first_seen_at,
        last_seen_at: data.last_seen_at,
        total_time_seconds: data.total_time_seconds,
        files_viewed: Array.from(viewerFilesMap.get(email)!.keys()),
        has_downloaded: data.has_downloaded,
        country: data.country,
        city: data.city,
        device_type: data.device_type,
        browser: data.browser,
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      contacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        (c.company && c.company.toLowerCase().includes(searchLower))
      );
    }

    // Apply type filter
    if (filter === 'hot') {
      contacts = contacts.filter(c => c.is_hot_lead);
    } else if (filter === 'downloaded') {
      contacts = contacts.filter(c => c.has_downloaded);
    } else if (filter === 'returning') {
      contacts = contacts.filter(c => c.total_views > 1);
    }

    // Sort by last seen (most recent first)
    contacts.sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime());

    return NextResponse.json({ contacts });

  } catch (error) {
    console.error('Contacts fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
