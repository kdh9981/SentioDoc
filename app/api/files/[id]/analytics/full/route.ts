import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateReturnRate } from '@/lib/analytics/return-rate';

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

    const { id: fileId } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date filter
    let dateFilter: Date | null = null;
    if (period === '7d') dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (period === '14d') dateFilter = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    else if (period === '30d') dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Verify ownership
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('user_email, total_pages, file_type')
      .eq('id', fileId)
      .single();

    if (!file || file.user_email !== user.email) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Build query
    let query = supabaseAdmin
      .from('access_logs')
      .select('*')
      .eq('file_id', fileId)
      .order('accessed_at', { ascending: false });

    if (dateFilter) {
      query = query.gte('accessed_at', dateFilter.toISOString());
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Analytics error:', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        summary: { totalViews: 0, uniqueViewers: 0, avgEngagement: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0 },
        trafficSources: [],
        devices: [],
        countries: [],
        pageHeatmap: [],
        dropOff: [],
        viewers: [],
        viewsOverTime: []
      });
    }

    const totalViews = logs.length;

    // Unique viewers by email or IP
    const uniqueEmails = new Set(logs.filter(l => l.viewer_email).map(l => l.viewer_email));
    const uniqueIPs = new Set(logs.filter(l => !l.viewer_email && l.ip_address).map(l => l.ip_address));
    const uniqueViewers = uniqueEmails.size + uniqueIPs.size;

    // Engagement metrics
    const avgEngagement = Math.round(
      logs.reduce((sum, l) => sum + (l.engagement_score || 0), 0) / totalViews
    );

    const hotLeads = logs.filter(l => l.intent_signal === 'hot' || (l.engagement_score && l.engagement_score >= 70)).length;
    const warmLeads = logs.filter(l => l.intent_signal === 'warm' || (l.engagement_score && l.engagement_score >= 40 && l.engagement_score < 70)).length;
    const coldLeads = totalViews - hotLeads - warmLeads;

    // Completion rate
    const completedViewers = logs.filter(l => l.completion_percentage && l.completion_percentage >= 90).length;
    const completionRate = Math.round((completedViewers / totalViews) * 100);

    // Return rate - calculate dynamically (viewers with 2+ views in period)
    const returnRate = calculateReturnRate(logs);

    // Downloads
    const downloads = logs.filter(l => l.downloaded).length;

    // Avg time spent
    const avgTimeSpent = Math.round(
      logs.reduce((sum, l) => sum + (l.total_duration_seconds || 0), 0) / totalViews
    );

    // Traffic Sources breakdown
    const trafficMap: Record<string, number> = {};
    logs.forEach(l => {
      const source = l.referrer_source || l.utm_source || 'direct';
      trafficMap[source] = (trafficMap[source] || 0) + 1;
    });
    const trafficSources = Object.entries(trafficMap)
      .map(([source, count]) => ({
        source,
        count,
        percentage: Math.round((count / totalViews) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Device breakdown
    const deviceMap: Record<string, number> = {};
    logs.forEach(l => {
      const device = l.device_type || 'unknown';
      deviceMap[device] = (deviceMap[device] || 0) + 1;
    });
    const devices = Object.entries(deviceMap)
      .map(([device, count]) => ({
        device,
        count,
        percentage: Math.round((count / totalViews) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Country breakdown
    const countryMap: Record<string, number> = {};
    logs.forEach(l => {
      const country = l.country || 'Unknown';
      countryMap[country] = (countryMap[country] || 0) + 1;
    });
    const countries = Object.entries(countryMap)
      .map(([country, count]) => ({
        country,
        count,
        percentage: Math.round((count / totalViews) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Access method breakdown (QR vs Direct)
    const accessMethodMap: Record<string, number> = {};
    logs.forEach(l => {
      const method = l.access_method || 'direct_click';
      accessMethodMap[method] = (accessMethodMap[method] || 0) + 1;
    });
    const accessMethods = Object.entries(accessMethodMap)
      .map(([method, count]) => ({
        method,
        count,
        percentage: Math.round((count / totalViews) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Page Heatmap (for documents)
    let pageHeatmap: { page: number; totalTime: number; avgTime: number; viewCount: number; heatLevel: string }[] = [];
    const totalPages = file.total_pages || 0;

    if (totalPages > 0) {
      const pageTotals: Record<number, { totalTime: number; viewCount: number }> = {};

      // Initialize all pages
      for (let i = 1; i <= totalPages; i++) {
        pageTotals[i] = { totalTime: 0, viewCount: 0 };
      }

      // Aggregate from pages_time_data
      logs.forEach(l => {
        if (l.pages_time_data && typeof l.pages_time_data === 'object') {
          Object.entries(l.pages_time_data).forEach(([pageStr, time]) => {
            const page = parseInt(pageStr);
            if (page >= 1 && page <= totalPages) {
              pageTotals[page].totalTime += (time as number) || 0;
              pageTotals[page].viewCount += 1;
            }
          });
        }
      });

      const maxTime = Math.max(...Object.values(pageTotals).map(p => p.totalTime), 1);

      pageHeatmap = Object.entries(pageTotals).map(([pageStr, data]) => {
        const heatScore = (data.totalTime / maxTime) * 100;
        let heatLevel = 'cold';
        if (heatScore >= 80) heatLevel = 'hot';
        else if (heatScore >= 50) heatLevel = 'medium';
        else if (heatScore >= 20) heatLevel = 'cool';

        return {
          page: parseInt(pageStr),
          totalTime: data.totalTime,
          avgTime: data.viewCount > 0 ? Math.round(data.totalTime / data.viewCount) : 0,
          viewCount: data.viewCount,
          heatLevel
        };
      }).sort((a, b) => a.page - b.page);
    }

    // Drop-off Analysis
    let dropOff: { page: number; viewers: number; dropOffRate: number; dropOffCount: number }[] = [];

    if (totalPages > 0) {
      const exitCounts: Record<number, number> = {};
      logs.forEach(l => {
        if (l.exit_page) {
          exitCounts[l.exit_page] = (exitCounts[l.exit_page] || 0) + 1;
        }
      });

      let remainingViewers = totalViews;
      for (let page = 1; page <= totalPages; page++) {
        const droppedHere = exitCounts[page] || 0;
        const dropOffRate = remainingViewers > 0 ? (droppedHere / remainingViewers) * 100 : 0;

        dropOff.push({
          page,
          viewers: remainingViewers,
          dropOffRate: Math.round(dropOffRate * 10) / 10,
          dropOffCount: droppedHere
        });

        remainingViewers -= droppedHere;
      }
    }

    // Calculate per-file visit counts for each viewer
    const viewerVisitCounts = new Map<string, number>();
    logs.forEach(l => {
      const viewerId = l.viewer_email || l.ip_address || l.id;
      viewerVisitCounts.set(viewerId, (viewerVisitCounts.get(viewerId) || 0) + 1);
    });

    // Viewers list (detailed)
    const viewers = logs.slice(0, 50).map(l => {
      const viewerId = l.viewer_email || l.ip_address || l.id;
      return {
        id: l.id,
        name: l.viewer_name || 'Anonymous',
        email: l.viewer_email || null,
        company: l.viewer_email ? getCompanyFromEmail(l.viewer_email) : null,
        country: l.country || null,
        city: l.city || null,
        device: l.device_type || 'unknown',
        browser: l.browser || null,
        os: l.os || null,
        engagementScore: l.engagement_score || 0,
        intentSignal: l.intent_signal || 'cold',
        totalDuration: l.total_duration_seconds || 0,
        pagesViewed: l.pages_viewed_count || 0,
        maxPage: l.max_page_reached || 0,
        totalPages: l.total_pages || file.total_pages || null,
        completionPercentage: l.completion_percentage || 0,
        entryPage: l.entry_page || 1,
        exitPage: l.exit_page || null,
        downloaded: l.downloaded || false,
        totalVisitsToFile: viewerVisitCounts.get(viewerId) || 1,
        referrerSource: l.referrer_source || 'direct',
        utmSource: l.utm_source || null,
        utmMedium: l.utm_medium || null,
        utmCampaign: l.utm_campaign || null,
        accessedAt: l.accessed_at
      };
    });

    // Views over time (last N days based on period)
    const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
    const viewsByDate = new Map<string, number>();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      viewsByDate.set(date.toISOString().split('T')[0], 0);
    }

    logs.forEach(l => {
      const dateStr = new Date(l.accessed_at).toISOString().split('T')[0];
      if (viewsByDate.has(dateStr)) {
        viewsByDate.set(dateStr, (viewsByDate.get(dateStr) || 0) + 1);
      }
    });

    const viewsOverTime = Array.from(viewsByDate.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Video analytics (for video files)
    const videoLogs = logs.filter(l => l.video_completion_percent !== null && l.video_completion_percent !== undefined);
    let videoAnalytics = null;

    if (videoLogs.length > 0) {
      const avgWatchTime = Math.round(
        videoLogs.reduce((sum, l) => sum + (l.watch_time_seconds || 0), 0) / videoLogs.length
      );
      const avgCompletion = Math.round(
        videoLogs.reduce((sum, l) => sum + (l.video_completion_percent || 0), 0) / videoLogs.length
      );
      const finishedCount = videoLogs.filter(l => l.video_finished).length;
      const totalDuration = videoLogs[0]?.video_duration_seconds || null;

      // Completion buckets
      const completionBuckets: Record<string, number> = {
        'Watched 100%': 0,
        'Watched 75-99%': 0,
        'Watched 50-74%': 0,
        'Watched 25-49%': 0,
        'Watched <25%': 0,
      };

      videoLogs.forEach(l => {
        const pct = l.video_completion_percent || 0;
        if (pct >= 100) completionBuckets['Watched 100%']++;
        else if (pct >= 75) completionBuckets['Watched 75-99%']++;
        else if (pct >= 50) completionBuckets['Watched 50-74%']++;
        else if (pct >= 25) completionBuckets['Watched 25-49%']++;
        else completionBuckets['Watched <25%']++;
      });

      videoAnalytics = {
        avgWatchTime,
        avgCompletion,
        finishedCount,
        totalDuration,
        completionBuckets,
        totalVideoViews: videoLogs.length,
      };
    }

    return NextResponse.json({
      summary: {
        totalViews,
        uniqueViewers,
        avgEngagement,
        hotLeads,
        warmLeads,
        coldLeads,
        completionRate,
        returnRate,
        downloads,
        avgTimeSpent,
        totalPages
      },
      trafficSources,
      devices,
      countries,
      pageHeatmap,
      dropOff,
      viewers,
      viewsOverTime,
      accessMethods,
      video: videoAnalytics,
    });

  } catch (error) {
    console.error('Full analytics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function getCompanyFromEmail(email: string): string | null {
  if (!email) return null;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  const consumerDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'protonmail.com', 'naver.com', 'daum.net'];
  if (consumerDomains.some(d => domain === d || domain.endsWith('.' + d))) {
    return null;
  }

  const name = domain.split('.')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}
