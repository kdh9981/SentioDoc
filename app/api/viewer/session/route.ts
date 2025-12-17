import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  calculateEngagementScore,
  calculateTrackSiteViewerScore,
  getIntentSignal,
  isHotLead,
  parseCompanyFromEmail
} from '@/lib/analytics';

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

    console.log('[viewer/session] Received body:', JSON.stringify(body, null, 2));

    const {
      accessLogId,
      sessionEndAt,
      totalDurationSeconds,
      exitPage,
      pagesViewedCount,
      maxPageReached,
      completionPercentage,
      pagesTimeData,
      totalPages,
      downloaded,
      downloadCount,
      // Video specific
      watchTimeSeconds,
      videoCompletionPercent,
      videoFinished,
      videoDurationSeconds,
      segmentsTimeData, // NEW: Time spent per segment (0-9) for media
      exitSegment, // NEW: Which segment user exited at
      // Pre-calculated scores from viewers (optional)
      engagementScore: clientEngagementScore,
      intentSignal: clientIntentSignal,
      // Additional action fields
      isDownloaded,
    } = body;

    if (!accessLogId) {
      console.error('[viewer/session] Missing accessLogId');
      return NextResponse.json({ error: 'Missing accessLogId' }, { status: 400 });
    }

    // Get the existing access log to check return visit status AND file type
    const { data: existingLog, error: fetchError } = await supabaseAdmin
      .from('access_logs')
      .select('is_return_visit, return_visit_count, viewer_email, viewer_name, file_id')
      .eq('id', accessLogId)
      .single();

    if (fetchError || !existingLog) {
      return NextResponse.json({ error: 'Access log not found' }, { status: 404 });
    }

    // Check if this is a Track Site (external URL redirect) or a File
    const { data: fileData } = await supabaseAdmin
      .from('files')
      .select('type')
      .eq('id', existingLog.file_id)
      .single();

    const isTrackSite = fileData?.type === 'url';

    // Calculate engagement score based on content type
    let engagementScore: number;
    let intentSignal: string;

    if (clientEngagementScore !== undefined) {
      // Use the pre-calculated score from the viewer
      engagementScore = Math.min(100, Math.max(0, Math.round(clientEngagementScore)));
      intentSignal = clientIntentSignal || getIntentSignal(engagementScore);
    } else if (isTrackSite) {
      // Track Site: Use simplified formula (Return + Frequency)
      // This is the INDIVIDUAL viewer score, not the link-level score
      engagementScore = calculateTrackSiteViewerScore({
        isReturnVisit: existingLog.is_return_visit || false,
        returnVisitCount: existingLog.return_visit_count || 0,
      });
      intentSignal = getIntentSignal(engagementScore);
      console.log('[viewer/session] Track Site viewer score:', engagementScore, 'isReturn:', existingLog.is_return_visit, 'returnCount:', existingLog.return_visit_count);
    } else {
      // File: Use full engagement formula (Time, Completion, Download, Return, Depth)
      engagementScore = calculateEngagementScore({
        totalDurationSeconds: totalDurationSeconds || 0,
        completionPercentage: completionPercentage || 0,
        downloaded: downloaded || false,
        isReturnVisit: existingLog.is_return_visit || false,
        returnVisitCount: existingLog.return_visit_count || 0,
        totalPages: totalPages,
        videoDurationSeconds: videoDurationSeconds,
        videoCompletionPercent: videoCompletionPercent,
        pagesTimeData: pagesTimeData,
      });
      intentSignal = getIntentSignal(engagementScore);
    }

    // Check if hot lead (different criteria for Track Sites vs Files)
    let hotLead: boolean;
    if (isTrackSite) {
      // Track Site: Hot lead if return visitor with 2+ previous visits (3+ total)
      hotLead = engagementScore >= 70 || (existingLog.return_visit_count || 0) >= 2;
    } else {
      // File: Use standard hot lead detection
      hotLead = isHotLead(
        engagementScore,
        downloaded || false,
        existingLog.return_visit_count || 0
      );
    }

    // Build update object for access_log
    // NOTE: engagement_score and intent_signal are calculated dynamically, not stored
    // Ensure all numeric values are integers (database columns are integer type)
    const updateData: Record<string, any> = {
      session_end_at: sessionEndAt || new Date().toISOString(),
      total_duration_seconds: Math.floor(totalDurationSeconds || 0),
    };

    // Document-specific fields (only for Files, not Track Sites)
    if (!isTrackSite) {
      if (exitPage !== undefined) updateData.exit_page = Math.floor(exitPage);
      if (pagesViewedCount !== undefined) updateData.pages_viewed_count = Math.floor(pagesViewedCount);
      if (maxPageReached !== undefined) updateData.max_page_reached = Math.floor(maxPageReached);
      if (completionPercentage !== undefined) updateData.completion_percentage = Math.floor(completionPercentage);
      if (pagesTimeData !== undefined) updateData.pages_time_data = pagesTimeData;
      if (totalPages !== undefined) updateData.total_pages = Math.floor(totalPages);

      // Action fields
      const wasDownloaded = downloaded || isDownloaded;
      if (wasDownloaded !== undefined) {
        updateData.downloaded = wasDownloaded;
        updateData.is_downloaded = wasDownloaded;
      }
      if (downloadCount !== undefined) updateData.download_count = Math.floor(downloadCount);

      // Video-specific fields
      if (watchTimeSeconds !== undefined) updateData.watch_time_seconds = Math.floor(watchTimeSeconds);
      if (videoCompletionPercent !== undefined) updateData.video_completion_percent = Math.floor(videoCompletionPercent);
      if (videoFinished !== undefined) updateData.video_finished = videoFinished;
      if (videoDurationSeconds !== undefined) updateData.video_duration_seconds = Math.floor(videoDurationSeconds);
      if (segmentsTimeData !== undefined) updateData.segments_time_data = segmentsTimeData; // NEW: Time per segment
    }

    console.log('[viewer/session] Updating access_log:', accessLogId, 'with data:', JSON.stringify(updateData, null, 2));

    // Update the access_log record
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('access_logs')
      .update(updateData)
      .eq('id', accessLogId)
      .select();

    if (updateError) {
      console.error('[viewer/session] Supabase update error:', updateError);
      return NextResponse.json({ error: 'Failed to update session', details: updateError.message }, { status: 500 });
    }

    console.log('[viewer/session] Update successful, result:', JSON.stringify(updatedData, null, 2));

    // Update/Create contact record if we have an email
    if (existingLog.viewer_email) {
      await updateContact({
        fileId: existingLog.file_id,
        viewerEmail: existingLog.viewer_email,
        viewerName: existingLog.viewer_name,
        engagementScore,
        totalDurationSeconds: totalDurationSeconds || 0,
        isHotLead: hotLead,
      });
    }

    return NextResponse.json({
      success: true,
      engagementScore,
      intentSignal,
    });

  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// Helper function to update or create contact record
async function updateContact({
  fileId,
  viewerEmail,
  viewerName,
  engagementScore,
  totalDurationSeconds,
  isHotLead: hotLead,
}: {
  fileId: string;
  viewerEmail: string;
  viewerName: string;
  engagementScore: number;
  totalDurationSeconds: number;
  isHotLead: boolean;
}) {
  try {
    // Get file owner's email
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('user_email')
      .eq('id', fileId)
      .single();

    if (!file?.user_email) return;

    const ownerEmail = file.user_email;

    // Check for existing contact
    const { data: existingContact } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('user_email', ownerEmail)
      .eq('email', viewerEmail)
      .single();

    const company = parseCompanyFromEmail(viewerEmail);

    if (existingContact) {
      // Update existing contact
      const newTotalViews = (existingContact.total_views || 0) + 1;
      const prevAvg = existingContact.avg_engagement || 0;
      const prevViews = existingContact.total_views || 0;
      const newAvgEngagement = prevViews > 0
        ? ((prevAvg * prevViews) + engagementScore) / newTotalViews
        : engagementScore;

      const filesViewed = existingContact.files_viewed || [];
      if (!filesViewed.includes(fileId)) {
        filesViewed.push(fileId);
      }

      await supabaseAdmin
        .from('contacts')
        .update({
          name: viewerName || existingContact.name,
          last_seen_at: new Date().toISOString(),
          total_views: newTotalViews,
          files_viewed: filesViewed,
          avg_engagement: Math.round(newAvgEngagement),
          total_time_seconds: Math.floor((existingContact.total_time_seconds || 0) + totalDurationSeconds),
          is_hot_lead: hotLead || existingContact.is_hot_lead,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingContact.id);

      console.log('[updateContact] Updated existing contact:', viewerEmail);
    } else {
      // Create new contact
      const { error: insertError } = await supabaseAdmin
        .from('contacts')
        .insert({
          user_email: ownerEmail,
          email: viewerEmail,
          name: viewerName || null,
          company: company,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          total_views: 1,
          files_viewed: [fileId],
          avg_engagement: Math.round(engagementScore),
          total_time_seconds: Math.floor(totalDurationSeconds),
          is_hot_lead: hotLead,
        });

      if (insertError) {
        console.error('[updateContact] Insert error:', insertError);
      } else {
        console.log('[updateContact] Created new contact:', viewerEmail);
      }
    }
  } catch (error) {
    console.error('Contact update error:', error);
  }
}
