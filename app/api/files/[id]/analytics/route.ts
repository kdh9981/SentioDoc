import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTierLimits } from '@/lib/tierLimits';
import {
  calculateContentHealthScore,
  calculatePageDropOff,
  calculatePageHeatmap,
  calculateBestTimeToShare,
  calculateViralityScore,
  calculateTrafficBreakdown,
  calculateDeviceBreakdown,
  calculateGeographyBreakdown,
  calculateReturnRate,
} from '@/lib/analytics';

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

// Helper: Calculate aggregated viewer score (SAME as Dashboard metrics API)
function calculateAggregatedViewerScore(viewerLogs: any[], isTrackSite: boolean = false): number {
  if (viewerLogs.length === 0) return 0;

  if (isTrackSite) {
    // Track Site: Return (60%) + Frequency (40%)
    const isReturn = viewerLogs.length > 1;
    const returnScore = isReturn ? 100 : 0;
    const frequencyScore = Math.min(100, viewerLogs.length * 33);
    return Math.round((returnScore * 0.60) + (frequencyScore * 0.40));
  }

  // File: Time(25%) + Completion(25%) + Download(20%) + Return(15%) + Depth(15%)
  let totalDuration = 0;
  let maxCompletion = 0;
  let downloaded = false;
  const isReturn = viewerLogs.length > 1;

  viewerLogs.forEach(log => {
    totalDuration += getActualDuration(log);
    if ((log.completion_percentage || 0) > maxCompletion) {
      maxCompletion = log.completion_percentage || 0;
    }
    if (log.downloaded || log.is_downloaded || log.download_count > 0) {
      downloaded = true;
    }
  });

  // Time score
  let timeScore: number;
  if (totalDuration <= 0) timeScore = 0;
  else if (totalDuration < 30) timeScore = Math.round((totalDuration / 30) * 25);
  else if (totalDuration < 60) timeScore = 25 + Math.round(((totalDuration - 30) / 30) * 15);
  else if (totalDuration < 120) timeScore = 40 + Math.round(((totalDuration - 60) / 60) * 20);
  else if (totalDuration < 300) timeScore = 60 + Math.round(((totalDuration - 120) / 180) * 20);
  else if (totalDuration < 600) timeScore = 80 + Math.round(((totalDuration - 300) / 300) * 20);
  else timeScore = 100;

  const completionScore = maxCompletion;
  const downloadScore = downloaded ? 100 : 0;
  const returnScore = isReturn ? 100 : 0;
  const depthScore = maxCompletion; // Use completion as proxy for depth

  return Math.round(
    (timeScore * 0.25) +
    (completionScore * 0.25) +
    (downloadScore * 0.20) +
    (returnScore * 0.15) +
    (depthScore * 0.15)
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;
    const { id: fileId } = await params;

    // Get time filter from query params
    const { searchParams } = new URL(request.url);
    const periodFilter = searchParams.get('period') || '30d';

    // Verify user owns this file
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (!file || file.user_email !== userEmail) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isTrackSite = file.type === 'url';

    // Get user's tier
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('tier')
      .eq('email', userEmail)
      .single();

    const tier = userData?.tier || 'free';
    const tierLimits = getTierLimits(tier);

    // Calculate date filter based on tier limit AND user-selected period
    const tierMaxDate = new Date();
    tierMaxDate.setDate(tierMaxDate.getDate() - tierLimits.analyticsHistoryDays);

    // Calculate user-selected period date
    let periodDate: Date | null = null;
    switch (periodFilter) {
      case '7d':
        periodDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '14d':
        periodDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        periodDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        periodDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        periodDate = null;
    }

    // Use the more restrictive date (tier limit or user selection)
    let historyDate = tierMaxDate;
    if (periodDate && periodDate > tierMaxDate) {
      historyDate = periodDate;
    }

    // Fetch logs with filtering
    let query = supabaseAdmin
      .from('access_logs')
      .select('*')
      .eq('file_id', fileId)
      .order('accessed_at', { ascending: false })
      .limit(500);

    if (periodFilter !== 'all' || tierLimits.analyticsHistoryDays < 365) {
      query = query.gte('accessed_at', historyDate.toISOString());
    }

    const { data: accessLogs, error } = await query;

    if (error) {
      console.error('Analytics error:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // If no views yet, return empty state
    if (!accessLogs || accessLogs.length === 0) {
      return NextResponse.json({
        totalViews: 0,
        uniqueViewers: 0,
        avgEngagement: 0,
        contentHealthScore: 0,
        hotLeads: 0,
        warmLeads: 0,
        coldLeads: 0,
        logs: [],
        tier,
        historyDays: tierLimits.analyticsHistoryDays,
        message: 'No views yet'
      });
    }

    // =============================================
    // BASIC COUNTS
    // =============================================
    const totalViews = accessLogs.length;

    // Group by unique viewer
    const viewerLogsMap = new Map<string, any[]>();
    accessLogs.forEach(log => {
      const identifier = log.viewer_email || log.ip_address || log.session_id || log.id;
      if (!viewerLogsMap.has(identifier)) {
        viewerLogsMap.set(identifier, []);
      }
      viewerLogsMap.get(identifier)!.push(log);
    });

    const uniqueViewers = viewerLogsMap.size;

    // =============================================
    // HOT/WARM/COLD LEADS (using aggregated score)
    // =============================================
    let hotLeads = 0;
    let warmLeads = 0;
    let coldLeads = 0;

    viewerLogsMap.forEach((viewerLogs) => {
      const score = calculateAggregatedViewerScore(viewerLogs, isTrackSite);
      if (score >= 70) hotLeads++;
      else if (score >= 40) warmLeads++;
      else coldLeads++;
    });

    // =============================================
    // ENGAGEMENT SCORE (Volume-gated for link level)
    // =============================================
    let avgEngagement: number;
    if (isTrackSite) {
      // Track Site volume-gated formula
      const volumeScore = Math.min(100, 20 * Math.log10(totalViews + 1));
      const volumeMultiplier = Math.min(1, totalViews / 500);

      const uniqueClickers = uniqueViewers;
      const reachRatio = (uniqueClickers / totalViews) * 100;
      const reachBonus = reachRatio * 0.20 * volumeMultiplier;

      const returnClickers = accessLogs.filter(l => l.is_return_visit).length;
      const returnRatio = uniqueClickers > 0 ? (returnClickers / uniqueClickers) * 100 : 0;
      const returnBonus = returnRatio * 0.20 * volumeMultiplier;

      avgEngagement = Math.round(Math.min(100, volumeScore + reachBonus + returnBonus));
    } else {
      // File volume-gated formula
      const volumeScore = Math.min(100, 20 * Math.log10(totalViews + 1));
      const volumeMultiplier = Math.min(1, totalViews / 500);
      const avgIndividualScore = accessLogs.reduce((sum, l) => sum + (l.engagement_score || 0), 0) / totalViews;
      const behavioralBonus = avgIndividualScore * 0.60 * volumeMultiplier;
      avgEngagement = Math.round(Math.min(100, volumeScore + behavioralBonus));
    }

    // =============================================
    // RATES
    // =============================================
    const completedViewers = accessLogs.filter(l =>
      l.completion_percentage && l.completion_percentage >= 90
    ).length;
    const completionRate = (completedViewers / totalViews) * 100;

    // Return rate (unique viewers with 2+ sessions)
    let returnViewerCount = 0;
    viewerLogsMap.forEach((viewerLogs) => {
      if (viewerLogs.length > 1) returnViewerCount++;
    });
    const returnRate = uniqueViewers > 0 ? (returnViewerCount / uniqueViewers) * 100 : 0;

    const downloadedViewers = accessLogs.filter(l => l.downloaded || l.is_downloaded).length;
    const actionRate = (downloadedViewers / totalViews) * 100;

    // =============================================
    // CONTENT HEALTH SCORE
    // =============================================
    const contentHealthScore = calculateContentHealthScore({
      avgEngagement,
      completionRate,
      returnRate,
      actionRate
    });

    // =============================================
    // AVERAGE TIME SPENT (only logs with duration)
    // =============================================
    const logsWithDuration = accessLogs.filter(l => getActualDuration(l) > 0);
    const avgTimeSpent = logsWithDuration.length > 0
      ? Math.round(logsWithDuration.reduce((sum, l) => sum + getActualDuration(l), 0) / logsWithDuration.length)
      : 0;

    // =============================================
    // PAGE ANALYTICS (for documents with pages)
    // =============================================
    let pageDropOff: any[] = [];
    let pageHeatmap: any[] = [];

    const totalPages = file.total_pages || accessLogs[0]?.total_pages;
    if (totalPages && totalPages > 1) {
      const exitPages = accessLogs.map(l => l.exit_page).filter(Boolean);
      pageDropOff = calculatePageDropOff(exitPages, totalViews, totalPages);

      const pagesTimeDataArray = accessLogs
        .map(l => l.pages_time_data)
        .filter(Boolean);
      if (pagesTimeDataArray.length > 0) {
        pageHeatmap = calculatePageHeatmap(pagesTimeDataArray, totalPages);
      }
    }

    // =============================================
    // BEST TIME TO SHARE (Starter+ only)
    // =============================================
    let bestTimeToShare = null;
    if (tier === 'starter' || tier === 'pro') {
      const accessedAtTimes = accessLogs.map(l => l.accessed_at);
      bestTimeToShare = calculateBestTimeToShare(accessedAtTimes);
    }

    // =============================================
    // VIRALITY SCORE (Starter+ only)
    // =============================================
    let virality = null;
    if (tier === 'starter' || tier === 'pro') {
      const viewerEmails = accessLogs.map(l => l.viewer_email);
      virality = calculateViralityScore(viewerEmails);
    }

    // =============================================
    // TRAFFIC BREAKDOWN (Starter+ only)
    // =============================================
    let trafficBreakdown: any[] = [];
    if (tier === 'starter' || tier === 'pro') {
      const referrerSources = accessLogs.map(l => l.referrer_source || 'direct');
      trafficBreakdown = calculateTrafficBreakdown(referrerSources);
    }

    // =============================================
    // DEVICE BREAKDOWN (Starter+ only)
    // =============================================
    let deviceBreakdown: any[] = [];
    if (tier === 'starter' || tier === 'pro') {
      const deviceTypes = accessLogs.map(l => l.device_type || 'unknown');
      deviceBreakdown = calculateDeviceBreakdown(deviceTypes);
    }

    // =============================================
    // GEOGRAPHY BREAKDOWN (Pro only)
    // =============================================
    let geographyBreakdown: any[] = [];
    if (tier === 'pro') {
      const countries = accessLogs.map(l => l.country || 'Unknown');
      geographyBreakdown = calculateGeographyBreakdown(countries);
    }

    // =============================================
    // VIDEO ANALYTICS
    // =============================================
    let videoAnalytics = null;
    const videoLogs = accessLogs.filter(l => l.video_duration_seconds && l.video_duration_seconds > 0);
    if (videoLogs.length > 0) {
      const avgWatchTime = Math.round(
        videoLogs.reduce((sum, l) => sum + (l.watch_time_seconds || 0), 0) / videoLogs.length
      );
      const avgVideoCompletion = Math.round(
        videoLogs.reduce((sum, l) => sum + (l.video_completion_percent || 0), 0) / videoLogs.length
      );
      const finishedCount = videoLogs.filter(l => l.video_finished).length;

      videoAnalytics = {
        avgWatchTime,
        avgVideoCompletion,
        finishedCount,
        finishRate: Math.round((finishedCount / videoLogs.length) * 100)
      };
    }

    // =============================================
    // FILTER LOGS BASED ON TIER
    // =============================================
    const filteredLogs = accessLogs.map(log => {
      const baseLog: any = {
        id: log.id,
        viewerName: log.viewer_name,
        viewerEmail: log.viewer_email,
        accessedAt: log.accessed_at,
      };

      if (tier === 'starter' || tier === 'pro') {
        Object.assign(baseLog, {
          country: log.country,
          deviceType: log.device_type,
          os: log.os,
          browser: log.browser,
          trafficSource: log.traffic_source,
          referrerSource: log.referrer_source,
          engagementScore: log.engagement_score,
          intentSignal: log.intent_signal,
          totalDurationSeconds: log.total_duration_seconds,
          pagesViewedCount: log.pages_viewed_count,
          maxPageReached: log.max_page_reached,
          totalPages: log.total_pages,
          completionPercentage: log.completion_percentage,
          downloaded: log.downloaded,
          downloadCount: log.download_count,
        });
      }

      if (tier === 'pro') {
        Object.assign(baseLog, {
          city: log.city,
          isReturnVisit: log.is_return_visit,
          returnVisitCount: log.return_visit_count,
          referrerUrl: log.referrer_url,
          utmSource: log.utm_source,
          utmMedium: log.utm_medium,
          utmCampaign: log.utm_campaign,
          exitPage: log.exit_page,
          sessionEndAt: log.session_end_at,
          pagesTimeData: log.pages_time_data,
          watchTimeSeconds: log.watch_time_seconds,
          videoCompletionPercent: log.video_completion_percent,
          videoFinished: log.video_finished,
          videoDurationSeconds: log.video_duration_seconds,
          segmentsTimeData: log.segments_time_data,
        });
      }

      return baseLog;
    });

    const recentViewers = filteredLogs.slice(0, 10);

    // =============================================
    // UPDATE CACHED METRICS
    // =============================================
    try {
      await supabaseAdmin
        .from('files')
        .update({
          cached_health_score: contentHealthScore,
          cached_total_views: totalViews,
          cached_unique_viewers: uniqueViewers,
          cached_avg_engagement: avgEngagement,
          cached_hot_leads: hotLeads,
          cache_updated_at: new Date().toISOString()
        })
        .eq('id', fileId);
    } catch (cacheError) {
      console.error('Cache update error:', cacheError);
    }

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      totalViews,
      uniqueViewers,
      avgEngagement,
      contentHealthScore,
      hotLeads,
      warmLeads,
      coldLeads,
      completionRate: Math.round(completionRate),
      returnRate: Math.round(returnRate),
      actionRate: Math.round(actionRate),
      avgTimeSpent,
      pageDropOff: tier === 'pro' ? pageDropOff : [],
      pageHeatmap: tier === 'pro' ? pageHeatmap : [],
      totalPages: totalPages || null,
      videoAnalytics,
      bestTimeToShare: tier === 'starter' || tier === 'pro' ? bestTimeToShare : null,
      virality: tier === 'starter' || tier === 'pro' ? virality : null,
      trafficBreakdown,
      deviceBreakdown,
      geographyBreakdown,
      recentViewers,
      logs: filteredLogs,
      tier,
      historyDays: tierLimits.analyticsHistoryDays,
      period: periodFilter,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
