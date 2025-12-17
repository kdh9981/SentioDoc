import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;

    // Get favorite files
    const { data: files, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('user_email', userEmail)
      .eq('is_favorite', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get analytics data for each file
    const filesWithAnalytics = await Promise.all((files || []).map(async (f) => {
      const { data: accessLogs } = await supabaseAdmin
        .from('access_logs')
        .select('viewer_email, engagement_score, accessed_at')
        .eq('file_id', f.id);

      const uniqueViewers = new Set(accessLogs?.map(l => l.viewer_email).filter(Boolean)).size;
      const hotLeads = accessLogs?.filter(l => (l.engagement_score || 0) >= 70).length || 0;
      const avgEngagement = accessLogs && accessLogs.length > 0
        ? Math.round(accessLogs.reduce((sum, l) => sum + (l.engagement_score || 0), 0) / accessLogs.length)
        : 0;
      const lastViewedAt = accessLogs && accessLogs.length > 0
        ? accessLogs.sort((a, b) => new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime())[0]?.accessed_at
        : null;

      return {
        id: f.id,
        name: f.original_name,
        slug: f.slug,
        type: f.type || 'file',
        fileType: f.file_type,
        views: f.views || 0,
        uniqueViewers,
        avgEngagement,
        hotLeads,
        createdAt: f.created_at,
        lastViewedAt,
      };
    }));

    return NextResponse.json({ files: filesWithAnalytics });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}
