import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Get user's file IDs
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('id')
      .eq('user_email', user.email);

    if (!files || files.length === 0) {
      return NextResponse.json({
        viewsOverTime: [],
        totalViews: 0,
        changePercent: 0
      });
    }

    const fileIds = files.map(f => f.id);
    const now = new Date();

    // Current period
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - days);
    currentStart.setHours(0, 0, 0, 0);

    // Previous period (for comparison)
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - days);

    // Fetch current period logs
    const { data: currentLogs } = await supabaseAdmin
      .from('access_logs')
      .select('accessed_at')
      .in('file_id', fileIds)
      .gte('accessed_at', currentStart.toISOString())
      .order('accessed_at', { ascending: true });

    // Fetch previous period logs
    const { data: previousLogs } = await supabaseAdmin
      .from('access_logs')
      .select('id')
      .in('file_id', fileIds)
      .gte('accessed_at', previousStart.toISOString())
      .lt('accessed_at', currentStart.toISOString());

    const currentCount = currentLogs?.length || 0;
    const previousCount = previousLogs?.length || 0;

    // Calculate percent change
    let changePercent = 0;
    if (previousCount > 0) {
      changePercent = Math.round(((currentCount - previousCount) / previousCount) * 100);
    } else if (currentCount > 0) {
      changePercent = 100;
    }

    // Group by date
    const viewsByDate = new Map<string, number>();

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(currentStart);
      date.setDate(date.getDate() + i);
      viewsByDate.set(date.toISOString().split('T')[0], 0);
    }

    // Count views per date
    currentLogs?.forEach(log => {
      const dateStr = new Date(log.accessed_at).toISOString().split('T')[0];
      if (viewsByDate.has(dateStr)) {
        viewsByDate.set(dateStr, (viewsByDate.get(dateStr) || 0) + 1);
      }
    });

    const viewsOverTime = Array.from(viewsByDate.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      viewsOverTime,
      totalViews: currentCount,
      changePercent
    });

  } catch (error) {
    console.error('Views trend error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
