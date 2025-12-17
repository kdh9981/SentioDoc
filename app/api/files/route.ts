import { NextResponse, NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  calculateFileLinkScoreFromLogs,
  calculateTrackSiteLinkScoreFromLogs,
  calculateAggregatedViewerScore,
  AccessLog
} from '@/lib/analytics/calculations';

// Helper: Get actual duration from access log
function getActualDuration(log: any): number {
  if (log.total_duration_seconds && log.total_duration_seconds > 0) {
    return log.total_duration_seconds;
  }
  if (log.pages_time_data && typeof log.pages_time_data === 'object') {
    const times = Object.values(log.pages_time_data as Record<string, number>);
    if (times.length > 0) {
      return Math.round(times.reduce((sum: number, t: any) => sum + (Number(t) || 0), 0));
    }
  }
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;
    const { searchParams } = new URL(request.url);
    const favoritesOnly = searchParams.get('favorites') === 'true';

    // Get date filter params from query
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Build query for files
    let query = supabaseAdmin
      .from('files')
      .select('*')
      .eq('user_email', userEmail)
      .is('deleted_at', null);

    if (favoritesOnly) {
      query = query.eq('is_favorite', true);
    }

    const { data: files, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Get analytics data for each file WITH date filtering
    const filesWithAnalytics = await Promise.all((files || []).map(async (f) => {
      const isTrackSite = f.type === 'url';

      // Build access_logs query with optional date filter
      let logsQuery = supabaseAdmin
        .from('access_logs')
        .select('*')
        .eq('file_id', f.id);

      // Apply date filter if provided
      if (startDateParam) {
        logsQuery = logsQuery.gte('accessed_at', startDateParam);
      }
      if (endDateParam) {
        logsQuery = logsQuery.lte('accessed_at', endDateParam);
      }

      const { data: accessLogs, error: logsError } = await logsQuery;

      if (logsError) {
        console.error(`[/api/files] Error fetching access_logs for file ${f.id}:`, logsError);
      }

      // Cast logs to AccessLog type for the centralized functions
      const typedLogs = (accessLogs || []) as AccessLog[];

      // Group logs by unique viewer
      const viewerLogsMap = new Map<string, AccessLog[]>();
      typedLogs.forEach(log => {
        const identifier = log.viewer_email || log.ip_address || log.session_id || log.id;
        if (!viewerLogsMap.has(identifier)) {
          viewerLogsMap.set(identifier, []);
        }
        viewerLogsMap.get(identifier)!.push(log);
      });

      const uniqueViewers = viewerLogsMap.size || 0;

      // Hot leads = unique viewers with AGGREGATED score >= 70
      let hotLeads = 0;
      viewerLogsMap.forEach((viewerLogs) => {
        const score = calculateAggregatedViewerScore(viewerLogs, isTrackSite);
        if (score >= 70) hotLeads++;
      });

      // Use CENTRALIZED Performance score functions (Single Source of Truth)
      let avgEngagement = 0;
      if (typedLogs.length > 0) {
        if (isTrackSite) {
          avgEngagement = calculateTrackSiteLinkScoreFromLogs(typedLogs);
        } else {
          avgEngagement = calculateFileLinkScoreFromLogs(typedLogs);
        }
      }

      // Get last viewed at from filtered logs
      const lastViewedAt = typedLogs.length > 0
        ? typedLogs.sort((a, b) => new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime())[0]?.accessed_at
        : null;

      // Use accessLogs.length instead of f.views
      const views = typedLogs.length;

      return {
        id: f.id,
        name: f.name || f.slug,
        slug: f.slug,
        views: views,
        fileType: f.file_type,
        mime_type: f.mime_type,
        size: f.file_size,
        createdAt: f.created_at,
        created_at: f.created_at,
        type: f.type || 'file',
        isActive: f.is_active ?? true,
        isFavorite: f.is_favorite ?? false,
        lastViewedAt,
        cached_last_viewed_at: lastViewedAt,
        uniqueViewers,
        cached_unique_viewers: uniqueViewers,
        avgEngagement,
        cached_avg_engagement: avgEngagement,
        hotLeads,
        cached_hot_leads: hotLeads,
        cached_total_views: views,
        deletedAt: f.deleted_at,
        externalUrl: f.external_url,
        hasPassword: !!f.password_hash,
        expiresAt: f.expires_at,
        requireEmail: f.require_email === true,
        requireName: f.require_name === true,
        allowDownload: f.allow_download === true,
        allowPrint: f.allow_print === true,
      };
    }));

    return NextResponse.json({ files: filesWithAnalytics });
  } catch (error) {
    console.error('Fetch files error:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}
