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

    // 1. Get all files for this user
    const { data: files, error: filesError } = await supabaseAdmin
      .from('files')
      .select('id, name, slug, views, type, user_email')
      .eq('user_email', user.email)
      .is('deleted_at', null)
      .limit(10);

    if (filesError) {
      return NextResponse.json({ error: 'Files query failed', details: filesError }, { status: 500 });
    }

    // 2. Get ALL access_logs (not filtered by file_id) to see what exists
    const { data: allLogs, error: logsError } = await supabaseAdmin
      .from('access_logs')
      .select('id, file_id, file_name, owner_email, viewer_email, accessed_at')
      .order('accessed_at', { ascending: false })
      .limit(50);

    if (logsError) {
      return NextResponse.json({ error: 'Logs query failed', details: logsError }, { status: 500 });
    }

    // 3. Get access_logs filtered by owner_email
    const { data: ownerLogs, error: ownerLogsError } = await supabaseAdmin
      .from('access_logs')
      .select('id, file_id, file_name, accessed_at')
      .eq('owner_email', user.email)
      .order('accessed_at', { ascending: false })
      .limit(20);

    // 4. For each file, try to find matching access_logs
    const fileAnalysis = await Promise.all((files || []).map(async (f) => {
      const { data: fileLogs, error } = await supabaseAdmin
        .from('access_logs')
        .select('id, accessed_at')
        .eq('file_id', f.id);

      return {
        fileId: f.id,
        fileName: f.name,
        fileViews: f.views,
        matchingLogsCount: fileLogs?.length || 0,
        queryError: error?.message || null,
      };
    }));

    // 5. Check if there are ANY access_logs at all
    const { count: totalLogsCount } = await supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      userEmail: user.email,
      totalAccessLogsInDB: totalLogsCount,
      files: files?.map(f => ({ id: f.id, name: f.name, views: f.views })),
      fileAnalysis,
      recentLogsInDB: allLogs?.slice(0, 10).map(l => ({
        id: l.id,
        file_id: l.file_id,
        file_name: l.file_name,
        owner_email: l.owner_email,
        accessed_at: l.accessed_at,
      })),
      logsForThisUser: ownerLogs?.map(l => ({
        id: l.id,
        file_id: l.file_id,
        file_name: l.file_name,
        accessed_at: l.accessed_at,
      })),
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Server error', message: error.message }, { status: 500 });
  }
}
