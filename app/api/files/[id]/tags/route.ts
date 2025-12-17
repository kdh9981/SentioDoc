import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get tags for a file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tags for this file via junction table
    // user_id in file_tags references auth.users(id), so use user.id directly
    const { data: fileTags, error } = await supabaseAdmin
      .from('file_tags')
      .select(`
        tag_id,
        tags (
          id,
          name,
          emoji,
          color
        )
      `)
      .eq('file_id', fileId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching file tags:', error);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    // Extract tags from the junction table result
    const tags = (fileTags || [])
      .map(ft => ft.tags)
      .filter(Boolean)
      .map(tag => ({
        id: (tag as any).id,
        name: (tag as any).name,
        emoji: (tag as any).emoji || '🏷️',
        color: (tag as any).color || 'blue',
      }));

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('File tags GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Add tag to file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tag_id } = body;

    if (!tag_id) {
      return NextResponse.json({ error: 'tag_id is required' }, { status: 400 });
    }

    // Verify user owns the file
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('id')
      .eq('id', fileId)
      .eq('user_email', user.email)
      .single();

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if already tagged
    const { data: existing } = await supabaseAdmin
      .from('file_tags')
      .select('id')
      .eq('file_id', fileId)
      .eq('tag_id', tag_id)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: 'Tag already applied' });
    }

    // Add tag - use user.id from auth (not authorized_users.id)
    const { error } = await supabaseAdmin
      .from('file_tags')
      .insert({
        user_id: user.id,
        file_id: fileId,
        tag_id: tag_id,
      });

    if (error) {
      console.error('Error adding file tag:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('File tags POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Remove tag from file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tag_id');

    if (!tagId) {
      return NextResponse.json({ error: 'tag_id query param is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('file_tags')
      .delete()
      .eq('file_id', fileId)
      .eq('tag_id', tagId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error removing file tag:', error);
      return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File tags DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
