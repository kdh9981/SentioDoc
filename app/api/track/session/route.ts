import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and sendBeacon (which sends as text)
    const contentType = request.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      body = JSON.parse(text);
    }

    const {
      accessLogId,
      totalDuration,
      pagesViewed,
      maxPageReached,
      totalPages,
      exitPage,
      idleTime,
      tabSwitches,
      downloadAttempted,
      printAttempted,
      copyAttempted,
    } = body;

    if (!accessLogId) {
      return NextResponse.json({ error: 'Missing accessLogId' }, { status: 400 });
    }

    // Calculate completion percentage
    const completionPercentage = totalPages > 0
      ? Math.round((maxPageReached / totalPages) * 100)
      : 0;

    // Note: engagement_score and intent_signal are NOT stored
    // They are always recalculated from raw data in ViewersTab/ContactsPage

    // Build update object
    const updateData: any = {
      total_duration_seconds: totalDuration || 0,
      pages_viewed_count: pagesViewed || 0,
      max_page_reached: maxPageReached || 0,
      total_pages: totalPages || 0,
      completion_percentage: completionPercentage,
      exit_page: exitPage || 1,
      idle_time_seconds: idleTime || 0,
      tab_switches_count: tabSwitches || 0,
      download_attempted: downloadAttempted || false,
      is_downloaded: downloadAttempted || false,
      print_attempted: printAttempted || false,
      copy_attempted: copyAttempted || false,
      session_end_at: new Date().toISOString(),
    };

    // Note: viewer_metadata column doesn't exist - skip storing it
    // If needed in future, add column first:
    // ALTER TABLE access_logs ADD COLUMN viewer_metadata JSONB;

    // Update session with all summary data
    const { error } = await supabaseAdmin
      .from('access_logs')
      .update(updateData)
      .eq('id', accessLogId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      completionPercentage,
    });
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
