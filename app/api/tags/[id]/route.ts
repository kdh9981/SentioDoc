import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// DELETE /api/tags/[id] - Delete a specific tag
export async function DELETE(
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
      .select('id')
      .eq('id', tagId)
      .eq('user_id', userData.id)
      .single();

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Remove tag from all files first
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('id, tags')
      .eq('user_email', user.email)
      .contains('tags', [tagId]);

    if (files && files.length > 0) {
      for (const file of files) {
        const updatedTags = (file.tags || []).filter((t: string) => t !== tagId);
        await supabaseAdmin
          .from('files')
          .update({ tags: updatedTags })
          .eq('id', file.id);
      }
    }

    // Delete the tag
    const { error } = await supabaseAdmin
      .from('tags')
      .delete()
      .eq('id', tagId)
      .eq('user_id', userData.id);

    if (error) {
      console.error('Tag delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tag delete error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET /api/tags/[id] - Get a specific tag
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

    // Get tag
    const { data: tag, error } = await supabaseAdmin
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .eq('user_id', userData.id)
      .single();

    if (error || !tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Get item count
    const { count: fileCount } = await supabaseAdmin
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', user.email)
      .contains('tags', [tagId]);

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        itemCount: fileCount || 0,
        createdAt: tag.created_at,
      }
    });
  } catch (error) {
    console.error('Tag fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/tags/[id] - Update a specific tag
export async function PATCH(
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

    const body = await request.json();
    const { name, color } = body;

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;

    // Update tag (verify ownership)
    const { data: updatedTag, error } = await supabaseAdmin
      .from('tags')
      .update(updateData)
      .eq('id', tagId)
      .eq('user_id', userData.id)
      .select()
      .single();

    if (error) {
      console.error('Tag update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json({ tag: updatedTag });
  } catch (error) {
    console.error('Tag update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
