import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      accessLogId,
      fileId,
      pageNumber,
      duration,
      scrollDepth,
    } = body;

    if (!accessLogId || !fileId || !pageNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get viewer_email from access_log (page_views.viewer_email has NOT NULL constraint)
    const { data: accessLog } = await supabaseAdmin
      .from('access_logs')
      .select('viewer_email')
      .eq('id', accessLogId)
      .single();

    // Default to 'anonymous' if no email (satisfies NOT NULL constraint)
    const viewerEmail = accessLog?.viewer_email || 'anonymous';

    // Check if page view already exists for this session
    const { data: existing } = await supabaseAdmin
      .from('page_views')
      .select('id, revisit_count, duration_seconds, scroll_depth_percentage')
      .eq('access_log_id', accessLogId)
      .eq('page_number', pageNumber)
      .single();

    if (existing) {
      // Update existing - increment revisit, add duration, keep max scroll
      const { error } = await supabaseAdmin
        .from('page_views')
        .update({
          duration_seconds: (existing.duration_seconds || 0) + (duration || 0),
          scroll_depth_percentage: Math.max(existing.scroll_depth_percentage || 0, scrollDepth || 0),
          revisit_count: (existing.revisit_count || 1) + 1,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new page view
      const { error } = await supabaseAdmin
        .from('page_views')
        .insert({
          access_log_id: accessLogId,
          file_id: fileId,
          viewer_email: viewerEmail,
          page_number: pageNumber,
          duration_seconds: duration || 0,
          scroll_depth_percentage: scrollDepth || 0,
          revisit_count: 1,
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Page tracking error:', error);
    return NextResponse.json({ error: 'Failed to track page' }, { status: 500 });
  }
}
