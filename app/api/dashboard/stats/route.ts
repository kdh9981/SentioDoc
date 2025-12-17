import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/dashboard/stats
// Returns overview stats for dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's files
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('id')
      .eq('user_email', user.email);

    const fileIds = files?.map(f => f.id) || [];

    if (fileIds.length === 0) {
      return NextResponse.json({
        todayViews: 0,
        yesterdayViews: 0,
        weekViews: 0,
        monthViews: 0,
        totalViews: 0,
        totalLinks: 0,
        activeLinks: 0,
        hotLeads: 0,
        warmLeads: 0,
        coldLeads: 0,
        avgEngagement: 0,
        topPerformer: null
      });
    }

    // Calculate date boundaries
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Today's views
    const { count: todayViews } = await supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .in('file_id', fileIds)
      .gte('accessed_at', today.toISOString());

    // Yesterday's views
    const { count: yesterdayViews } = await supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .in('file_id', fileIds)
      .gte('accessed_at', yesterday.toISOString())
      .lt('accessed_at', today.toISOString());

    // This week's views
    const { count: weekViews } = await supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .in('file_id', fileIds)
      .gte('accessed_at', weekAgo.toISOString());

    // This month's views
    const { count: monthViews } = await supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .in('file_id', fileIds)
      .gte('accessed_at', monthAgo.toISOString());

    // Total views (all time)
    const { count: totalViews } = await supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .in('file_id', fileIds);

    // Lead counts
    const { count: hotLeads } = await supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .in('file_id', fileIds)
      .eq('intent_signal', 'hot');

    const { count: warmLeads } = await supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .in('file_id', fileIds)
      .eq('intent_signal', 'warm');

    const { count: coldLeads } = await supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .in('file_id', fileIds)
      .eq('intent_signal', 'cold');

    // Get average engagement from recent logs
    const { data: recentLogs } = await supabaseAdmin
      .from('access_logs')
      .select('engagement_score')
      .in('file_id', fileIds)
      .not('engagement_score', 'is', null)
      .order('accessed_at', { ascending: false })
      .limit(100);

    const avgEngagement = recentLogs && recentLogs.length > 0
      ? Math.round(recentLogs.reduce((sum, l) => sum + (l.engagement_score || 0), 0) / recentLogs.length)
      : 0;

    // Active links (viewed in last 7 days)
    const { data: activeFileIds } = await supabaseAdmin
      .from('access_logs')
      .select('file_id')
      .in('file_id', fileIds)
      .gte('accessed_at', weekAgo.toISOString());

    const activeLinks = new Set(activeFileIds?.map(l => l.file_id) || []).size;

    // Top performer (most views in last 7 days)
    const { data: topFiles } = await supabaseAdmin
      .from('files')
      .select('id, original_name, cached_total_views')
      .eq('user_email', user.email)
      .order('cached_total_views', { ascending: false })
      .limit(1);

    const topPerformer = topFiles && topFiles.length > 0 ? {
      id: topFiles[0].id,
      name: topFiles[0].original_name,
      views: topFiles[0].cached_total_views || 0
    } : null;

    return NextResponse.json({
      todayViews: todayViews || 0,
      yesterdayViews: yesterdayViews || 0,
      weekViews: weekViews || 0,
      monthViews: monthViews || 0,
      totalViews: totalViews || 0,
      totalLinks: fileIds.length,
      activeLinks,
      hotLeads: hotLeads || 0,
      warmLeads: warmLeads || 0,
      coldLeads: coldLeads || 0,
      avgEngagement,
      topPerformer
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
