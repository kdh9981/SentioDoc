import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Get days param (default 7, max 30)
    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get('days') || '7', 10);
    const days = Math.min(Math.max(daysParam, 1), 30);

    // Verify user owns this file
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('user_email')
      .eq('id', fileId)
      .single();

    if (!file || file.user_email !== userEmail) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Fetch access logs
    const { data: logs, error } = await supabaseAdmin
      .from('access_logs')
      .select('accessed_at')
      .eq('file_id', fileId)
      .gte('accessed_at', startDate.toISOString())
      .order('accessed_at', { ascending: true });

    if (error) {
      console.error('Views over time error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Group by date
    const viewsByDate = new Map<string, number>();

    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      viewsByDate.set(dateStr, 0);
    }

    // Count views per date
    logs?.forEach(log => {
      const dateStr = new Date(log.accessed_at).toISOString().split('T')[0];
      viewsByDate.set(dateStr, (viewsByDate.get(dateStr) || 0) + 1);
    });

    // Convert to array format
    const viewsOverTime = Array.from(viewsByDate.entries())
      .map(([date, views]) => ({
        date,
        views
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ viewsOverTime });
  } catch (error) {
    console.error('Views over time error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
