import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/tags/[id]/files - Get all files with a specific tag
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

    const { id: tagId } = await params;

    // Get user ID
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!userData?.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify tag belongs to user
    const { data: tag } = await supabaseAdmin
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .eq('user_id', userData.id)
      .single();

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Get all files with this tag
    const { data: files, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('user_email', user.email)
      .contains('tags', [tagId])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Files fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get analytics for each file
    const filesWithAnalytics = await Promise.all(
      (files || []).map(async (file) => {
        // Get view count
        const { count: views } = await supabaseAdmin
          .from('access_logs')
          .select('*', { count: 'exact', head: true })
          .eq('file_id', file.id);

        // Get unique viewers
        const { data: viewers } = await supabaseAdmin
          .from('access_logs')
          .select('viewer_email, ip_address')
          .eq('file_id', file.id);

        const uniqueEmails = new Set(viewers?.filter(v => v.viewer_email).map(v => v.viewer_email));
        const uniqueIPs = new Set(viewers?.filter(v => !v.viewer_email && v.ip_address).map(v => v.ip_address));
        const uniqueViewers = uniqueEmails.size + uniqueIPs.size;

        // Get last view
        const { data: lastView } = await supabaseAdmin
          .from('access_logs')
          .select('accessed_at')
          .eq('file_id', file.id)
          .order('accessed_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: file.id,
          name: file.original_name,
          slug: file.slug,
          fileType: file.file_type,
          views: views || 0,
          uniqueViewers,
          lastViewedAt: lastView?.accessed_at || null,
          createdAt: file.created_at,
          tags: file.tags || [],
        };
      })
    );

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
      },
      files: filesWithAnalytics,
    });
  } catch (error) {
    console.error('Tag files error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
