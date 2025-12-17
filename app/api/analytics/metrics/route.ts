import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  calculateFileLinkScoreFromLogs,
  calculateTrackSiteLinkScoreFromLogs,
  AccessLog
} from '@/lib/analytics/calculations';

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

// Helper: Calculate aggregated viewer score for FILES
// Formula: Time(25%) + Completion(25%) + Download(20%) + Return(15%) + Depth(15%)
function calculateFileViewerScore(viewerLogs: any[]): number {
  if (viewerLogs.length === 0) return 0;

  let totalDuration = 0;
  let maxCompletion = 0;
  let downloaded = false;
  const isReturn = viewerLogs.length > 1;

  viewerLogs.forEach(log => {
    totalDuration += getActualDuration(log);
    if ((log.completion_percentage || 0) > maxCompletion) {
      maxCompletion = log.completion_percentage || 0;
    }
    if (log.is_downloaded || log.downloaded || log.download_count > 0) {
      downloaded = true;
    }
  });

  // Time score (0-100)
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
  const depthScore = maxCompletion;

  return Math.round(
    (timeScore * 0.25) +
    (completionScore * 0.25) +
    (downloadScore * 0.20) +
    (returnScore * 0.15) +
    (depthScore * 0.15)
  );
}

// Helper: Calculate aggregated viewer score for TRACK SITES
// Formula: Return(60%) + Frequency(40%)
function calculateTrackSiteViewerScore(viewerLogs: any[]): number {
  if (viewerLogs.length === 0) return 0;

  const isReturn = viewerLogs.length > 1;
  const returnScore = isReturn ? 100 : 0;
  const frequencyScore = Math.min(100, viewerLogs.length * 33);

  return Math.round((returnScore * 0.60) + (frequencyScore * 0.40));
}


export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const daysParam = searchParams.get('days');

    let days: number | null = null;
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else if (daysParam !== null && daysParam !== '' && daysParam !== 'all') {
      days = parseInt(daysParam, 10);
    }

    // Get user's files with type information
    const { data: files, error: filesError } = await supabaseAdmin
      .from('files')
      .select('id, total_pages, type')
      .eq('user_email', user.email)
      .is('deleted_at', null);

    if (!files || files.length === 0) {
      return NextResponse.json({
        totalViews: 0, viewsChange: 0, uniqueViewers: 0, viewersChange: 0,
        avgEngagement: 0, engagementChange: 0, hotLeads: 0, hotLeadsChange: 0,
        qrScans: 0, qrScansChange: 0, avgCompletion: 0, completionChange: 0,
        avgTime: 0, timeChange: 0, returnRate: 0, returnChange: 0,
        downloads: 0, downloadsChange: 0, uniquePercent: 0, viewsToday: 0, qrToday: 0,
      });
    }

    const fileIds = files.map(f => f.id);
    const fileTypeMap = new Map(files.map(f => [f.id, f.type || 'file']));
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    let currentStart: Date | null = null;
    let currentEnd: Date | null = null;
    let previousStart: Date | null = null;
    let previousEnd: Date | null = null;
    let periodDays: number | null = null;

    if (startDate && endDate) {
      currentStart = startDate;
      currentEnd = endDate;
      periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      previousEnd = new Date(startDate);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - periodDays + 1);
    } else if (days !== null) {
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - (days - 1));
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(now);
      currentEnd.setHours(23, 59, 59, 999);
      periodDays = days;

      previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - days + 1);
      previousStart.setHours(0, 0, 0, 0);
    }

    // Fetch current period logs
    let currentLogsQuery = supabaseAdmin
      .from('access_logs')
      .select('*')
      .in('file_id', fileIds);

    if (currentStart) {
      currentLogsQuery = currentLogsQuery.gte('accessed_at', currentStart.toISOString());
      if (currentEnd) {
        currentLogsQuery = currentLogsQuery.lte('accessed_at', currentEnd.toISOString());
      }
    }

    const { data: currentLogs, error: logsError } = await currentLogsQuery;

    // Fetch previous period logs
    let previousLogs: typeof currentLogs = [];
    if (currentStart && previousStart && previousEnd) {
      const { data } = await supabaseAdmin
        .from('access_logs')
        .select('*')
        .in('file_id', fileIds)
        .gte('accessed_at', previousStart.toISOString())
        .lte('accessed_at', previousEnd.toISOString());
      previousLogs = data || [];
    }

    // Fetch today's logs
    const { data: todayLogs } = await supabaseAdmin
      .from('access_logs')
      .select('utm_medium, access_method')
      .in('file_id', fileIds)
      .gte('accessed_at', todayStart.toISOString());

    // CALCULATE METRICS
    const calculateMetrics = (logs: any[], fileTypeMap: Map<string, string>) => {
      if (!logs || logs.length === 0) {
        return {
          views: 0, uniqueViewers: 0, avgEngagement: 0, hotLeads: 0,
          warmLeads: 0, coldLeads: 0, qrScans: 0, avgCompletion: 0,
          avgTime: 0, returnRate: 0, downloads: 0,
        };
      }

      const views = logs.length;

      // ============ GROUP BY UNIQUE VIEWERS (per file) ============
      // Key: fileId:viewerIdentifier to handle same person viewing different files
      const viewerFileLogsMap = new Map<string, any[]>();
      logs.forEach(log => {
        const viewerId = log.viewer_email || log.ip_address || log.session_id || log.id;
        const key = `${log.file_id}:${viewerId}`;
        if (!viewerFileLogsMap.has(key)) {
          viewerFileLogsMap.set(key, []);
        }
        viewerFileLogsMap.get(key)!.push(log);
      });

      // ============ GLOBAL UNIQUE VIEWERS ============
      const globalViewerIds = new Set<string>();
      logs.forEach(log => {
        const viewerId = log.viewer_email || log.ip_address || log.session_id || log.id;
        globalViewerIds.add(viewerId);
      });
      const uniqueViewers = globalViewerIds.size;

      // ============ HOT/WARM/COLD LEADS ============
      // Count unique viewers with aggregated score >= threshold
      // Each viewer counted ONCE globally, using their BEST score across all files
      const viewerBestScores = new Map<string, number>();

      viewerFileLogsMap.forEach((viewerLogs, key) => {
        const fileId = key.split(':')[0];
        const viewerId = key.split(':').slice(1).join(':');
        const isTrackSite = fileTypeMap.get(fileId) === 'url';

        // Calculate score based on file type
        const score = isTrackSite
          ? calculateTrackSiteViewerScore(viewerLogs)
          : calculateFileViewerScore(viewerLogs);

        // Keep the best score for this viewer across all files
        const currentBest = viewerBestScores.get(viewerId) || 0;
        if (score > currentBest) {
          viewerBestScores.set(viewerId, score);
        }
      });

      let hotLeads = 0;
      let warmLeads = 0;
      let coldLeads = 0;

      viewerBestScores.forEach((score) => {
        if (score >= 70) hotLeads++;
        else if (score >= 40) warmLeads++;
        else coldLeads++;
      });

      // ============ ENGAGEMENT (Weighted Average of Per-Link Scores) ============
      const fileLogsMap = new Map<string, any[]>();
      logs.forEach(log => {
        if (!fileLogsMap.has(log.file_id)) {
          fileLogsMap.set(log.file_id, []);
        }
        fileLogsMap.get(log.file_id)!.push(log);
      });

      let weightedScoreSum = 0;
      let totalWeight = 0;

      fileLogsMap.forEach((fileLogs, fileId) => {
        const isTrackSite = fileTypeMap.get(fileId) === 'url';
        const typedLogs = fileLogs as AccessLog[];
        const fileScore = isTrackSite
          ? calculateTrackSiteLinkScoreFromLogs(typedLogs)
          : calculateFileLinkScoreFromLogs(typedLogs);
        const weight = fileLogs.length;
        weightedScoreSum += fileScore * weight;
        totalWeight += weight;
      });

      const avgEngagement = totalWeight > 0 ? Math.round(weightedScoreSum / totalWeight) : 0;

      // ============ QR SCANS ============
      const qrScans = logs.filter(l =>
        l.access_method === 'qr_scan' ||
        l.utm_medium?.toLowerCase() === 'qr' ||
        l.utm_medium?.toLowerCase() === 'qr_code' ||
        l.utm_medium?.toLowerCase() === 'qrcode'
      ).length;

      // ============ COMPLETION RATE (Files only) ============
      const fileLogs = logs.filter(l => fileTypeMap.get(l.file_id) !== 'url');
      const completedViewers = fileLogs.filter(l => (l.completion_percentage || 0) >= 90).length;
      const avgCompletion = fileLogs.length > 0 ? Math.round((completedViewers / fileLogs.length) * 100) : 0;

      // ============ AVERAGE TIME (Files only) ============
      const logsWithDuration = logs.filter(l => getActualDuration(l) > 0);
      const timeSum = logsWithDuration.reduce((sum, l) => sum + getActualDuration(l), 0);
      const avgTime = logsWithDuration.length > 0 ? Math.round(timeSum / logsWithDuration.length) : 0;

      // ============ RETURN RATE ============
      let returnViewerCount = 0;
      const viewerVisitCounts = new Map<string, number>();
      logs.forEach(log => {
        const viewerId = log.viewer_email || log.ip_address || log.session_id || log.id;
        viewerVisitCounts.set(viewerId, (viewerVisitCounts.get(viewerId) || 0) + 1);
      });
      viewerVisitCounts.forEach((count) => {
        if (count > 1) returnViewerCount++;
      });
      const returnRate = uniqueViewers > 0 ? Math.round((returnViewerCount / uniqueViewers) * 100) : 0;

      // ============ DOWNLOADS (Files only) ============
      const downloadedLogs = fileLogs.filter(l =>
        l.is_downloaded || l.downloaded || (l.download_count && l.download_count > 0)
      );
      const downloads = downloadedLogs.length;

      return {
        views, uniqueViewers, avgEngagement, hotLeads, warmLeads, coldLeads,
        qrScans, avgCompletion, avgTime, returnRate, downloads,
      };
    };

    const current = calculateMetrics(currentLogs || [], fileTypeMap);
    const previous = calculateMetrics(previousLogs || [], fileTypeMap);

    const viewsToday = todayLogs?.length || 0;
    const qrToday = todayLogs?.filter(l =>
      l.access_method === 'qr_scan' ||
      l.utm_medium?.toLowerCase() === 'qr' ||
      l.utm_medium?.toLowerCase() === 'qr_code'
    ).length || 0;

    const calcChange = (current: number, previous: number): number | null => {
      if (previous === 0) return current > 0 ? null : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const uniquePercent = current.views > 0 ? Math.round((current.uniqueViewers / current.views) * 100) : 0;

    return NextResponse.json({
      totalViews: current.views,
      viewsChange: calcChange(current.views, previous.views),
      uniqueViewers: current.uniqueViewers,
      viewersChange: calcChange(current.uniqueViewers, previous.uniqueViewers),
      avgEngagement: current.avgEngagement,
      engagementChange: calcChange(current.avgEngagement, previous.avgEngagement),
      hotLeads: current.hotLeads,
      hotLeadsChange: calcChange(current.hotLeads, previous.hotLeads),
      qrScans: current.qrScans,
      qrScansChange: calcChange(current.qrScans, previous.qrScans),
      avgCompletion: current.avgCompletion,
      completionChange: calcChange(current.avgCompletion, previous.avgCompletion),
      avgTime: current.avgTime,
      timeChange: calcChange(current.avgTime, previous.avgTime),
      returnRate: current.returnRate,
      returnChange: calcChange(current.returnRate, previous.returnRate),
      downloads: current.downloads,
      downloadsChange: calcChange(current.downloads, previous.downloads),
      uniquePercent,
      viewsToday,
      qrToday,
    });

  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
