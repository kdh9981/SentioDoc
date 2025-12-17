import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateReturnRate } from '@/lib/analytics/return-rate';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const daysParam = searchParams.get('days'); // Backwards compatibility

    // Calculate date ranges
    let startDate: Date;
    let endDate: Date = new Date();
    endDate.setHours(23, 59, 59, 999);
    let days: number;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      days = parseInt(daysParam || '30', 10);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
      startDate.setHours(0, 0, 0, 0);
    }

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Previous period for comparison
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    prevEndDate.setHours(23, 59, 59, 999);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - days + 1);
    prevStartDate.setHours(0, 0, 0, 0);
    const prevStartDateStr = prevStartDate.toISOString();
    const prevEndDateStr = prevEndDate.toISOString();

    // Get user's files
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('id, original_name, mime_type, type, views, cached_avg_engagement, cached_total_views, cached_qr_scans, total_pages')
      .eq('user_email', userEmail)
      .is('deleted_at', null);

    const fileIds = files?.map(f => f.id) || [];

    const emptyResponse = {
      totalViews: 0, totalViewsChange: 0,
      qrScans: 0, qrScansChange: 0,
      uniqueViewers: 0, uniqueViewersChange: 0,
      avgEngagement: 0, avgEngagementChange: 0,
      hotLeads: 0, hotLeadsChange: 0,
      avgCompletion: 0, completionChange: 0,
      avgTime: 0, timeChange: 0,
      returnRate: 0, returnChange: 0,
      downloads: 0, downloadsChange: 0,
      viewsOverTime: [],
      topCountries: [], topCities: [], topRegions: [], topLanguages: [],
      deviceBreakdown: [], browserBreakdown: [], osBreakdown: [],
      topContent: [], needsAttention: [],
      trafficSources: [], utmCampaigns: [],
      accessMethod: { direct: 100, qr: 0 },
      topDays: [],
      popularHours: Array(24).fill(0),
      engagementBreakdown: { hot: { count: 0, percent: 0 }, warm: { count: 0, percent: 0 }, cold: { count: 0, percent: 0 } },
      returnVsNew: { return: 0, new: 100 },
    };

    if (fileIds.length === 0) {
      return NextResponse.json(emptyResponse);
    }

    // Get current period logs with all fields
    const { data: currentLogs } = await supabaseAdmin
      .from('access_logs')
      .select('*')
      .in('file_id', fileIds)
      .gte('accessed_at', startDateStr)
      .lte('accessed_at', endDateStr)
      .order('accessed_at', { ascending: true });

    // Get previous period logs for comparison
    const { data: prevLogs } = await supabaseAdmin
      .from('access_logs')
      .select('viewer_email, engagement_score, is_return_visit, is_downloaded, total_duration_seconds, max_page_reached, utm_medium')
      .in('file_id', fileIds)
      .gte('accessed_at', prevStartDateStr)
      .lt('accessed_at', prevEndDateStr);

    const logs = currentLogs || [];
    const prevLogsData = prevLogs || [];

    // Build file pages map for completion calculation
    const filePagesMap = new Map<string, number>();
    files?.forEach(f => {
      if (f.total_pages && f.total_pages > 0) {
        filePagesMap.set(f.id, f.total_pages);
      }
    });

    // ===== CURRENT PERIOD METRICS =====
    const totalViews = logs.length;
    const uniqueEmails = new Set(logs.map(l => l.viewer_email).filter(Boolean));
    const uniqueViewers = uniqueEmails.size;

    const engagementScores = logs.filter(l => l.engagement_score != null).map(l => l.engagement_score);
    const avgEngagement = engagementScores.length > 0
      ? Math.round(engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length)
      : 0;

    const hotLeads = logs.filter(l => (l.engagement_score || 0) >= 70).length;

    // QR Scans
    const qrScansFromLogs = logs.filter(l =>
      l.access_method === 'qr_scan' || l.utm_medium === 'qr' || l.utm_medium === 'qr_code'
    ).length;
    const qrScans = qrScansFromLogs;

    // Completion Rate (for documents with pages)
    const completionData: number[] = [];
    logs.forEach(log => {
      const totalPages = filePagesMap.get(log.file_id);
      if (totalPages && log.max_page_reached) {
        completionData.push(Math.min(100, Math.round((log.max_page_reached / totalPages) * 100)));
      }
    });
    const avgCompletion = completionData.length > 0
      ? Math.round(completionData.reduce((a, b) => a + b, 0) / completionData.length)
      : 0;

    // Average Time
    const times = logs.filter(l => l.total_duration_seconds != null && l.total_duration_seconds > 0).map(l => l.total_duration_seconds);
    const avgTime = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;

    // Return Rate - calculate dynamically (viewers with 2+ views in period)
    const returnRate = calculateReturnRate(logs);

    // Downloads
    const downloads = logs.filter(l => l.is_downloaded || (l.download_count && l.download_count > 0)).length;

    // ===== PREVIOUS PERIOD METRICS =====
    const prevTotalViews = prevLogsData.length;
    const prevUniqueViewers = new Set(prevLogsData.map(l => l.viewer_email).filter(Boolean)).size;
    const prevEngScores = prevLogsData.filter(l => l.engagement_score != null).map(l => l.engagement_score);
    const prevAvgEngagement = prevEngScores.length > 0
      ? Math.round(prevEngScores.reduce((a: number, b: number) => a + b, 0) / prevEngScores.length)
      : 0;
    const prevHotLeads = prevLogsData.filter(l => (l.engagement_score || 0) >= 70).length;
    const prevQrScans = prevLogsData.filter(l => l.utm_medium === 'qr' || l.utm_medium === 'qr_code').length;
    const prevTimes = prevLogsData.filter(l => l.total_duration_seconds != null).map(l => l.total_duration_seconds || 0);
    const prevAvgTime = prevTimes.length > 0 ? Math.round(prevTimes.reduce((a, b) => a + b, 0) / prevTimes.length) : 0;
    const prevReturnRate = calculateReturnRate(prevLogsData);
    const prevDownloads = prevLogsData.filter(l => l.is_downloaded).length;

    // Calculate percentage changes
    const calcChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    const totalViewsChange = calcChange(totalViews, prevTotalViews);
    const uniqueViewersChange = calcChange(uniqueViewers, prevUniqueViewers);
    const avgEngagementChange = calcChange(avgEngagement, prevAvgEngagement);
    const hotLeadsChange = calcChange(hotLeads, prevHotLeads);
    const qrScansChange = calcChange(qrScans, prevQrScans);
    const timeChange = calcChange(avgTime, prevAvgTime);
    const returnChange = calcChange(returnRate, prevReturnRate);
    const downloadsChange = calcChange(downloads, prevDownloads);
    const completionChange = 0; // No prev data for this

    // ===== ENGAGEMENT BREAKDOWN =====
    const hotCount = logs.filter(l => (l.engagement_score || 0) >= 70).length;
    const warmCount = logs.filter(l => (l.engagement_score || 0) >= 40 && (l.engagement_score || 0) < 70).length;
    const coldCount = logs.filter(l => (l.engagement_score || 0) < 40).length;
    const totalEng = hotCount + warmCount + coldCount || 1;
    const engagementBreakdown = {
      hot: { count: hotCount, percent: Math.round((hotCount / totalEng) * 100) },
      warm: { count: warmCount, percent: Math.round((warmCount / totalEng) * 100) },
      cold: { count: coldCount, percent: Math.round((coldCount / totalEng) * 100) },
    };

    // ===== RETURN VS NEW =====
    // Calculate based on viewers with 2+ views vs single view
    const viewerViewCounts = new Map<string, number>();
    logs.forEach(l => {
      const id = l.viewer_email || l.ip_address;
      if (id) viewerViewCounts.set(id, (viewerViewCounts.get(id) || 0) + 1);
    });
    let returnViewerCount = 0;
    let newViewerCount = 0;
    viewerViewCounts.forEach(count => {
      if (count > 1) returnViewerCount++;
      else newViewerCount++;
    });
    const totalViewerCount = viewerViewCounts.size || 1;
    const returnVsNew = {
      return: Math.round((returnViewerCount / totalViewerCount) * 100),
      new: Math.round((newViewerCount / totalViewerCount) * 100),
    };

    // ===== TOP DAYS =====
    const daysCounts = [0, 0, 0, 0, 0, 0, 0];
    logs.forEach(log => {
      const day = new Date(log.accessed_at).getDay();
      daysCounts[day]++;
    });
    const maxDayCount = Math.max(...daysCounts) || 1;
    const topDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name, i) => ({
      name,
      count: daysCounts[i],
      percent: Math.round((daysCounts[i] / maxDayCount) * 100),
    }));

    // ===== POPULAR HOURS (array of 24 numbers) =====
    const hoursCounts = Array(24).fill(0);
    logs.forEach(log => {
      const hour = new Date(log.accessed_at).getHours();
      hoursCounts[hour]++;
    });
    const popularHours = hoursCounts;

    // ===== ACCESS METHOD =====
    const qrViews = logs.filter(l =>
      l.access_method === 'qr_scan' || l.utm_medium === 'qr' || l.utm_medium === 'qr_code'
    ).length;
    const directViews = totalViews - qrViews;
    const accessMethod = {
      direct: totalViews > 0 ? Math.round((directViews / totalViews) * 100) : 100,
      qr: totalViews > 0 ? Math.round((qrViews / totalViews) * 100) : 0,
    };

    // ===== VIEWS OVER TIME =====
    const viewsByDate = new Map<string, number>();
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      const dateStr = tempDate.toISOString().split('T')[0];
      viewsByDate.set(dateStr, 0);
      tempDate.setDate(tempDate.getDate() + 1);
    }
    logs.forEach(log => {
      const dateStr = log.accessed_at.split('T')[0];
      if (viewsByDate.has(dateStr)) {
        viewsByDate.set(dateStr, (viewsByDate.get(dateStr) || 0) + 1);
      }
    });
    const viewsOverTime = Array.from(viewsByDate.entries()).map(([date, views]) => ({ date, views }));

    // ===== GEOGRAPHIC DATA =====
    const countryMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    const regionMap = new Map<string, number>();
    const languageMap = new Map<string, number>();

    logs.forEach(log => {
      const country = log.country || 'Unknown';
      const city = log.city || 'Unknown';
      const region = log.region || 'Unknown';
      const language = log.language || 'Unknown';

      countryMap.set(country, (countryMap.get(country) || 0) + 1);
      cityMap.set(city, (cityMap.get(city) || 0) + 1);
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
      languageMap.set(language, (languageMap.get(language) || 0) + 1);
    });

    const topCountries = Array.from(countryMap.entries())
      .filter(([c]) => c !== 'Unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, views]) => ({
        country, views,
        percentage: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0,
      }));

    const topCities = Array.from(cityMap.entries())
      .filter(([c]) => c !== 'Unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, views]) => ({
        city, views,
        percentage: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0,
      }));

    const topRegions = Array.from(regionMap.entries())
      .filter(([r]) => r !== 'Unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([region, views]) => ({
        region, views,
        percentage: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0,
      }));

    const topLanguages = Array.from(languageMap.entries())
      .filter(([l]) => l !== 'Unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([language, views]) => ({
        language, views,
        percentage: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0,
      }));

    // ===== DEVICE/BROWSER/OS BREAKDOWN =====
    const deviceMap = new Map<string, number>();
    const browserMap = new Map<string, number>();
    const osMap = new Map<string, number>();

    logs.forEach(log => {
      const device = log.device_type || 'Unknown';
      const browser = log.browser || 'Unknown';
      const os = log.os || 'Unknown';

      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
      osMap.set(os, (osMap.get(os) || 0) + 1);
    });

    const deviceBreakdown = Array.from(deviceMap.entries())
      .filter(([d]) => d !== 'Unknown')
      .sort((a, b) => b[1] - a[1])
      .map(([device, count]) => ({
        device, count,
        percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }));

    const browserBreakdown = Array.from(browserMap.entries())
      .filter(([b]) => b !== 'Unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([browser, count]) => ({
        browser, count,
        percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }));

    const osBreakdown = Array.from(osMap.entries())
      .filter(([o]) => o !== 'Unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([os, count]) => ({
        os, count,
        percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }));

    // ===== TRAFFIC SOURCES =====
    const sourceMap = new Map<string, number>();
    logs.forEach(log => {
      const source = log.traffic_source || log.referrer_source || 'direct';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });
    const trafficSources = Array.from(sourceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({
        source, count,
        percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }));

    // ===== UTM CAMPAIGNS =====
    const campaignMap = new Map<string, number>();
    logs.forEach(log => {
      if (log.utm_campaign) {
        campaignMap.set(log.utm_campaign, (campaignMap.get(log.utm_campaign) || 0) + 1);
      }
    });
    const utmCampaigns = Array.from(campaignMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([campaign, count]) => ({
        campaign, count,
        percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }));

    // ===== TOP CONTENT =====
    const fileViewsMap = new Map<string, {
      name: string; views: number; totalEngagement: number; count: number; mimeType: string; type: string;
    }>();
    files?.forEach(f => {
      fileViewsMap.set(f.id, {
        name: f.original_name,
        views: 0, totalEngagement: 0, count: 0,
        mimeType: f.mime_type || '', type: f.type || '',
      });
    });
    logs.forEach(log => {
      const file = fileViewsMap.get(log.file_id);
      if (file) {
        file.views++;
        if (log.engagement_score != null) {
          file.totalEngagement += log.engagement_score;
          file.count++;
        }
      }
    });

    const allContent = Array.from(fileViewsMap.entries())
      .map(([id, data]) => ({
        id, name: data.name, views: data.views,
        engagement: data.count > 0 ? Math.round(data.totalEngagement / data.count) : 0,
        mimeType: data.mimeType, type: data.type,
      }));

    const topContent = [...allContent]
      .filter(f => f.views > 0)
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);

    const needsAttention = [...allContent]
      .filter(f => f.views > 0 && f.engagement < 40)
      .sort((a, b) => a.engagement - b.engagement)
      .slice(0, 10);

    return NextResponse.json({
      totalViews, totalViewsChange,
      qrScans, qrScansChange,
      uniqueViewers, uniqueViewersChange,
      avgEngagement, avgEngagementChange,
      hotLeads, hotLeadsChange,
      avgCompletion, completionChange,
      avgTime, timeChange,
      returnRate, returnChange,
      downloads, downloadsChange,
      viewsOverTime,
      topCountries, topCities, topRegions, topLanguages,
      deviceBreakdown, browserBreakdown, osBreakdown,
      topContent, needsAttention,
      trafficSources, utmCampaigns,
      accessMethod,
      topDays, popularHours,
      engagementBreakdown, returnVsNew,
    });
  } catch (error) {
    console.error('Global analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
