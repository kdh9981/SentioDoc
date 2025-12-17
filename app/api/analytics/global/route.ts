import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTierLimits } from '@/lib/tierLimits';

// Helper: Get actual duration from access log
function getActualDuration(log: any): number {
  if (log.total_duration_seconds && log.total_duration_seconds > 0) {
    return log.total_duration_seconds;
  }
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

    // Get user's tier
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('tier')
      .eq('email', userEmail)
      .single();

    const tier = userData?.tier || 'free';
    const tierLimits = getTierLimits(tier);

    // Parse date range from query params
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const daysParam = searchParams.get('days');

    let filterStartDate: Date;
    let filterEndDate: Date = new Date();
    filterEndDate.setHours(23, 59, 59, 999);

    if (startDateParam && endDateParam) {
      filterStartDate = new Date(startDateParam);
      filterEndDate = new Date(endDateParam);
      const maxHistoryDate = new Date();
      maxHistoryDate.setDate(maxHistoryDate.getDate() - tierLimits.analyticsHistoryDays);
      if (filterStartDate < maxHistoryDate) {
        filterStartDate = maxHistoryDate;
      }
    } else if (daysParam) {
      const days = parseInt(daysParam, 10);
      filterStartDate = new Date();
      filterStartDate.setDate(filterStartDate.getDate() - (days - 1));
      filterStartDate.setHours(0, 0, 0, 0);
    } else {
      filterStartDate = new Date();
      filterStartDate.setDate(filterStartDate.getDate() - 29);
      filterStartDate.setHours(0, 0, 0, 0);
    }

    // Get user's file IDs, types, and link type (file vs url)
    const { data: userFiles, error: filesError } = await supabaseAdmin
      .from('files')
      .select('id, name, mime_type, type')
      .eq('user_email', userEmail)
      .is('deleted_at', null);

    const fileIds = userFiles?.map(f => f.id) || [];
    // Include linkType ('file' or 'url') in the map
    const fileMap = new Map(userFiles?.map(f => [f.id, {
      name: f.name,
      fileType: f.mime_type,
      linkType: f.type || 'file'  // 'file' or 'url'
    }]) || []);

    if (fileIds.length === 0) {
      return NextResponse.json({
        recentActivity: [],
        stats: { totalViews: 0, uniqueViewers: 0, topCountry: 'N/A', countryRanking: [] }
      });
    }

    // USE select('*') like the working file detail API
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('access_logs')
      .select('*')
      .in('file_id', fileIds)
      .gte('accessed_at', filterStartDate.toISOString())
      .lte('accessed_at', filterEndDate.toISOString())
      .order('accessed_at', { ascending: false });

    if (logsError) {
      console.error('Global analytics logs error:', logsError);
      return NextResponse.json({
        recentActivity: [],
        stats: { totalViews: 0, uniqueViewers: 0, topCountry: 'N/A', countryRanking: [] },
        error: logsError.message
      });
    }

    // Transform logs to activity format - matching DashboardAnalytics interface
    const recentActivity = (logs || []).map(log => {
      const fileInfo = fileMap.get(log.file_id);

      // Detect QR scan from utm_medium or access_method
      const isQrScan = log.access_method === 'qr_scan' ||
                       log.utm_medium?.toLowerCase() === 'qr' ||
                       log.utm_medium?.toLowerCase() === 'qr_code' ||
                       log.utm_medium?.toLowerCase() === 'qrcode';

      return {
        // Required by DashboardAnalytics ActivityLog interface
        viewerName: log.viewer_name || null,
        viewerEmail: log.viewer_email || null,
        ipAddress: log.ip_address || null,
        sessionId: log.session_id || null,
        accessedAt: log.accessed_at,
        fileName: fileInfo?.name || 'Unknown',
        fileType: fileInfo?.fileType || null,
        fileId: log.file_id,
        // NEW: Link type for differentiating files vs track sites
        linkType: fileInfo?.linkType || 'file',
        // Optional fields
        country: log.country || null,
        city: log.city || null,
        region: log.region || null,
        deviceType: log.device_type || null,
        browser: log.browser || null,
        os: log.os || null,
        language: log.language || null,
        engagementScore: log.engagement_score || 0,
        intentSignal: log.intent_signal || null,
        totalDurationSeconds: getActualDuration(log),
        completionPercentage: log.completion_percentage || 0,
        isReturnVisit: log.is_return_visit || false,
        trafficSource: log.traffic_source || null,
        utmSource: log.utm_source || null,
        utmMedium: log.utm_medium || null,
        utmCampaign: log.utm_campaign || null,
        isDownloaded: log.is_downloaded || log.downloaded || false,
        downloadCount: log.download_count || 0,
        isQrScan: isQrScan,
        accessMethod: log.access_method || null,
      };
    });

    // Calculate stats from the actual logs
    const totalViews = logs?.length || 0;
    const uniqueEmails = new Set(logs?.filter(l => l.viewer_email).map(l => l.viewer_email));
    const uniqueIPs = new Set(logs?.filter(l => !l.viewer_email && l.ip_address).map(l => l.ip_address));
    const uniqueViewers = uniqueEmails.size + uniqueIPs.size;

    // Country ranking
    let countryRanking: Array<{ country: string; count: number }> = [];
    if (logs && logs.length > 0) {
      const countryCount = new Map<string, number>();
      logs.forEach(log => {
        const country = log.country;
        if (country && country !== 'Unknown' && country !== null) {
          countryCount.set(country, (countryCount.get(country) || 0) + 1);
        }
      });
      countryRanking = Array.from(countryCount.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    const topCountry = countryRanking[0]?.country || 'N/A';

    return NextResponse.json({
      recentActivity,
      stats: {
        totalViews,
        uniqueViewers,
        topCountry,
        countryRanking,
      },
      tier,
      historyDays: tierLimits.analyticsHistoryDays,
    });
  } catch (error) {
    console.error('Global analytics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
