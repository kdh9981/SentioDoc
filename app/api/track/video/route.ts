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
      fileId,
      videoUrl,
      videoPlatform,
      videoDuration,
      action, // 'ready', 'start', 'progress', 'pause', 'seek', 'complete', 'end'
      currentTime,
      watchTime,
    } = body;

    if (!accessLogId || !fileId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate completion percentage
    const completionPercentage = videoDuration > 0
      ? Math.min(100, Math.round((currentTime / videoDuration) * 100))
      : 0;

    // Calculate engagement score based on watch behavior
    let engagementScore = 0;
    if (videoDuration > 0) {
      const watchPercentage = (watchTime / videoDuration) * 100;
      // Base score from watch time (max 60 points)
      engagementScore = Math.min(60, watchPercentage * 0.6);
      // Bonus for completion (max 40 points)
      if (action === 'complete') {
        engagementScore += 40;
      } else if (completionPercentage >= 75) {
        engagementScore += 30;
      } else if (completionPercentage >= 50) {
        engagementScore += 20;
      } else if (completionPercentage >= 25) {
        engagementScore += 10;
      }
    }

    // Determine intent signal
    let intentSignal = 'low';
    if (engagementScore >= 70 || action === 'complete') {
      intentSignal = 'high';
    } else if (engagementScore >= 40 || completionPercentage >= 50) {
      intentSignal = 'medium';
    }

    // Update the access log with video analytics
    const accessLogUpdate: any = {
      engagement_score: Math.round(engagementScore),
      intent_signal: intentSignal,
      total_duration_seconds: watchTime,
      completion_percentage: completionPercentage,
      file_type: 'video',
      watch_time_seconds: watchTime,
      video_completion_percent: completionPercentage,
    };

    // Set session end time on end/complete actions
    if (action === 'end' || action === 'complete') {
      accessLogUpdate.session_end_at = new Date().toISOString();
    }

    await supabaseAdmin
      .from('access_logs')
      .update(accessLogUpdate)
      .eq('id', accessLogId);

    // For native videos, the videoUrl might be a relative path like /api/file/uuid
    // For embedded videos (YouTube/Vimeo), it's the full external URL
    // Ensure we have a valid URL or use the file ID as identifier
    const normalizedVideoUrl = videoUrl || `native:${fileId}`;

    // Check if video analytics record exists
    const { data: existing } = await supabaseAdmin
      .from('video_analytics')
      .select('*')
      .eq('access_log_id', accessLogId)
      .eq('file_id', fileId)
      .single();

    if (existing) {
      // Update existing record
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (watchTime) {
        updates.watch_time_seconds = Math.max(existing.watch_time_seconds, watchTime);
      }

      if (currentTime) {
        updates.max_position_seconds = Math.max(existing.max_position_seconds, currentTime);
        if (videoDuration) {
          updates.completion_percentage = Math.round((updates.max_position_seconds / videoDuration) * 100);
        }
      }

      switch (action) {
        case 'start':
          updates.play_count = existing.play_count + 1;
          break;
        case 'pause':
          updates.pause_count = existing.pause_count + 1;
          break;
        case 'seek':
          updates.seek_count = existing.seek_count + 1;
          break;
        case 'complete':
          updates.finished = true;
          updates.completion_percentage = 100;
          break;
      }

      const { error } = await supabaseAdmin
        .from('video_analytics')
        .update(updates)
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabaseAdmin
        .from('video_analytics')
        .insert({
          access_log_id: accessLogId,
          file_id: fileId,
          video_url: normalizedVideoUrl,
          video_platform: videoPlatform || 'native',
          video_duration_seconds: videoDuration || 0,
          watch_time_seconds: watchTime || 0,
          max_position_seconds: currentTime || 0,
          play_count: action === 'start' ? 1 : 0,
          pause_count: action === 'pause' ? 1 : 0,
          seek_count: action === 'seek' ? 1 : 0,
          finished: action === 'complete',
          completion_percentage: currentTime && videoDuration
            ? Math.round((currentTime / videoDuration) * 100)
            : 0,
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Video tracking error:', error);
    return NextResponse.json({ error: 'Failed to track video' }, { status: 500 });
  }
}
