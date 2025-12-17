import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get all files with their tags
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all file_tags for this user with tag details
    const { data: fileTags, error } = await supabaseAdmin
      .from('file_tags')
      .select(`
        file_id,
        tags (
          id,
          name,
          emoji,
          color
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching file tags:', error);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    // Group tags by file_id
    const fileTagsMap: Record<string, Array<{ id: string; name: string; emoji: string; color: string }>> = {};

    (fileTags || []).forEach(ft => {
      if (ft.tags && ft.file_id) {
        if (!fileTagsMap[ft.file_id]) {
          fileTagsMap[ft.file_id] = [];
        }
        fileTagsMap[ft.file_id].push({
          id: (ft.tags as any).id,
          name: (ft.tags as any).name,
          emoji: (ft.tags as any).emoji || '🏷️',
          color: (ft.tags as any).color || 'blue',
        });
      }
    });

    return NextResponse.json({ fileTagsMap });
  } catch (error) {
    console.error('Files with tags error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
