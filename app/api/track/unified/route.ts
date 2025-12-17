import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  calculateEngagementScore,
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

    const {
      accessLogId,
      fileId,
      fileType,
      sessionEndAt,
      totalDurationSeconds,
      pagesViewedCount,
      maxPageReached,
      completionPercentage,
      pagesTimeData,
      totalPages,
      exitPage,
      idleTimeSeconds,
      tabSwitches,
      downloaded,
      downloadCount,
      printAttempted,
      copyAttempted,
      // Video specific
      watchTimeSeconds,
      videoCompletionPercent,
      videoFinished,
    } = body;

    if (!accessLogId) {
      return NextResponse.json({ error: 'Missing accessLogId' }, { status: 400 });
    }

    // Get the existing access log
    const { data: existingLog, error: fetchError } = await supabaseAdmin
      .from('access_logs')
      .select('is_return_visit, return_visit_count, viewer_email, viewer_name, file_id')
      .eq('id', accessLogId)
      .single();

    if (fetchError || !existingLog) {
      return NextResponse.json({ error: 'Access log not found' }, { status: 404 });
    }

    // Calculate engagement score
    const engagementScore = calculateEngagementScore({
      totalDurationSeconds: totalDurationSeconds || 0,
      completionPercentage: completionPercentage || 0,
      downloaded: downloaded || false,
      isReturnVisit: existingLog.is_return_visit || false,
      totalPages: totalPages,
      videoDurationSeconds: watchTimeSeconds ? (watchTimeSeconds / (videoCompletionPercent || 1)) * 100 : undefined,
      videoCompletionPercent: videoCompletionPercent,
    });

    // Determine intent signal
    const intentSignal = getIntentSignal(engagementScore);

    // Check if hot lead
    const hotLead = isHotLead(
      engagementScore,
      downloaded || false,
      existingLog.return_visit_count || 0
    );

    // Build comprehensive update object
    const updateData: Record<string, any> = {
      session_end_at: sessionEndAt || new Date().toISOString(),
      total_duration_seconds: totalDurationSeconds || 0,
      engagement_score: engagementScore,
      intent_signal: intentSignal,
      file_type: fileType,
    };

    // Document-specific fields
    if (exitPage !== undefined) updateData.exit_page = exitPage;
    if (pagesViewedCount !== undefined) updateData.pages_viewed_count = pagesViewedCount;
    if (maxPageReached !== undefined) updateData.max_page_reached = maxPageReached;
    if (completionPercentage !== undefined) updateData.completion_percentage = completionPercentage;
    if (pagesTimeData !== undefined) updateData.pages_time_data = pagesTimeData;
    if (totalPages !== undefined) updateData.total_pages = totalPages;

    // Idle/focus tracking
    if (idleTimeSeconds !== undefined) updateData.idle_time_seconds = idleTimeSeconds;
    if (tabSwitches !== undefined) updateData.tab_switches_count = tabSwitches;

    // Action fields - set all variants for compatibility
    if (downloaded !== undefined) {
      updateData.downloaded = downloaded;
      updateData.is_downloaded = downloaded;
      updateData.download_attempted = downloaded;
    }
    if (downloadCount !== undefined) updateData.download_count = downloadCount;
    if (printAttempted !== undefined) updateData.print_attempted = printAttempted;
    if (copyAttempted !== undefined) updateData.copy_attempted = copyAttempted;

    // Video-specific fields
    if (watchTimeSeconds !== undefined) updateData.watch_time_seconds = watchTimeSeconds;
    if (videoCompletionPercent !== undefined) updateData.video_completion_percent = videoCompletionPercent;
    if (videoFinished !== undefined) updateData.video_finished = videoFinished;

    // Update the access_log record
    const { error: updateError } = await supabaseAdmin
      .from('access_logs')
      .update(updateData)
      .eq('id', accessLogId);

    if (updateError) {
      console.error('Unified session update error:', updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

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
    console.error('Unified session update error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// Helper function to update or create contact record (viewer as contact)
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

    // Check for existing contact using user_email (owner) and email (viewer)
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

      // Add fileId to files_viewed if not already present
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
          total_time_seconds: (existingContact.total_time_seconds || 0) + totalDurationSeconds,
          is_hot_lead: hotLead || existingContact.is_hot_lead,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingContact.id);
    } else {
      // Create new contact (viewer becomes a contact)
      await supabaseAdmin
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
          avg_engagement: engagementScore,
          total_time_seconds: totalDurationSeconds,
          is_hot_lead: hotLead,
        });
    }
  } catch (error) {
    // Log but don't fail the main request
    console.error('Contact update error:', error);
  }
}
