import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// to update cached analytics for all files
// Add to vercel.json: { "crons": [{ "path": "/api/cron/update-file-stats", "schedule": "0 * * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, require auth. In dev, allow without auth.
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting file stats update...');

    // Get all files
    const { data: files, error: filesError } = await supabaseAdmin
      .from('files')
      .select('id, user_email');

    if (filesError) {
      console.error('[CRON] Error fetching files:', filesError);
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }

    if (!files || files.length === 0) {
      console.log('[CRON] No files to update');
      return NextResponse.json({ message: 'No files to update', updated: 0 });
    }

    let updated = 0;
    let errors = 0;

    // Process files in batches to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (file) => {
          try {
            // Get total views
            const { count: totalViews } = await supabaseAdmin
              .from('access_logs')
              .select('*', { count: 'exact', head: true })
              .eq('file_id', file.id);

            // Get unique viewers (by email or IP)
            const { data: viewers } = await supabaseAdmin
              .from('access_logs')
              .select('viewer_email, ip_address')
              .eq('file_id', file.id);

            const uniqueEmails = new Set(
              viewers?.filter(v => v.viewer_email).map(v => v.viewer_email) || []
            );
            const uniqueIPs = new Set(
              viewers?.filter(v => !v.viewer_email && v.ip_address).map(v => v.ip_address) || []
            );
            const uniqueViewers = uniqueEmails.size + uniqueIPs.size;

            // Get average engagement score
            const { data: engagementData } = await supabaseAdmin
              .from('access_logs')
              .select('engagement_score')
              .eq('file_id', file.id)
              .not('engagement_score', 'is', null);

            const avgEngagement = engagementData && engagementData.length > 0
              ? Math.round(
                  engagementData.reduce((sum, log) => sum + (log.engagement_score || 0), 0) /
                    engagementData.length
                )
              : 0;

            // Get hot leads count
            const { count: hotLeads } = await supabaseAdmin
              .from('access_logs')
              .select('*', { count: 'exact', head: true })
              .eq('file_id', file.id)
              .or('intent_signal.eq.hot,engagement_score.gte.70');

            // Get last viewed time
            const { data: lastView } = await supabaseAdmin
              .from('access_logs')
              .select('accessed_at')
              .eq('file_id', file.id)
              .order('accessed_at', { ascending: false })
              .limit(1)
              .single();

            // Get views in last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { count: recentViews } = await supabaseAdmin
              .from('access_logs')
              .select('*', { count: 'exact', head: true })
              .eq('file_id', file.id)
              .gte('accessed_at', sevenDaysAgo.toISOString());

            // Update file with cached stats
            const { error: updateError } = await supabaseAdmin
              .from('files')
              .update({
                cached_views: totalViews || 0,
                cached_unique_viewers: uniqueViewers,
                cached_avg_engagement: avgEngagement,
                cached_hot_leads: hotLeads || 0,
                cached_last_viewed: lastView?.accessed_at || null,
                cached_recent_views: recentViews || 0,
                stats_updated_at: new Date().toISOString(),
              })
              .eq('id', file.id);

            if (updateError) {
              console.error(`[CRON] Error updating file ${file.id}:`, updateError);
              errors++;
            } else {
              updated++;
            }
          } catch (err) {
            console.error(`[CRON] Error processing file ${file.id}:`, err);
            errors++;
          }
        })
      );
    }

    console.log(`[CRON] File stats update complete. Updated: ${updated}, Errors: ${errors}`);

    return NextResponse.json({
      message: 'File stats updated',
      total: files.length,
      updated,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error updating file stats:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
