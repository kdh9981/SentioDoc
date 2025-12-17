import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/tags - Get all tags for the user
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tags for this user (using user_email)
    const { data: tags, error } = await supabaseAdmin
      .from('tags')
      .select('*')
      .eq('user_email', user.email)
      .order('name', { ascending: true });

    if (error) {
      console.error('Tags fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get user ID for junction table queries
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('id')
      .eq('email', user.email)
      .single();

    // Get item counts for each tag from junction tables
    const tagsWithCounts = await Promise.all(
      (tags || []).map(async (tag) => {
        // Count files via file_tags junction table
        const { count: fileCount } = await supabaseAdmin
          .from('file_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id);

        // Count contacts via contact_tags junction table
        const { count: contactCount } = await supabaseAdmin
          .from('contact_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id);

        return {
          id: tag.id,
          name: tag.name,
          emoji: tag.emoji || '🏷️',
          color: tag.color,
          is_preset: tag.is_preset || false,
          files_count: fileCount || 0,
          contacts_count: contactCount || 0,
          created_at: tag.created_at,
        };
      })
    );

    // Get total files count
    const { count: totalFilesCount } = await supabaseAdmin
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', user.email)
      .is('deleted_at', null);

    // Get count of files that have at least one tag
    const { data: taggedFilesData } = await supabaseAdmin
      .from('file_tags')
      .select('file_id')
      .eq('user_id', userData?.id);

    const uniqueTaggedFiles = new Set(taggedFilesData?.map(f => f.file_id) || []);
    const taggedFilesCount = uniqueTaggedFiles.size;

    return NextResponse.json({
      tags: tagsWithCounts,
      totalFiles: totalFilesCount || 0,
      taggedFiles: taggedFilesCount,
    });
  } catch (error) {
    console.error('Tags error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, emoji, is_preset } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    // Check if tag with same name already exists
    const { data: existing } = await supabaseAdmin
      .from('tags')
      .select('id, name, emoji, color, is_preset, created_at')
      .eq('user_email', user.email)
      .ilike('name', name.trim())
      .single();

    if (existing) {
      // Return existing tag instead of error (for preset auto-creation)
      return NextResponse.json({
        tag: {
          id: existing.id,
          name: existing.name,
          emoji: existing.emoji || '🏷️',
          color: existing.color,
          is_preset: existing.is_preset || false,
          files_count: 0,
          contacts_count: 0,
          created_at: existing.created_at,
        }
      });
    }

    // Create the tag (using user_email, not user_id)
    const { data: newTag, error } = await supabaseAdmin
      .from('tags')
      .insert({
        user_email: user.email,
        name: name.trim(),
        emoji: emoji || '🏷️',
        color: color || 'blue',
        is_preset: is_preset || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Tag create error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      tag: {
        id: newTag.id,
        name: newTag.name,
        emoji: newTag.emoji || '🏷️',
        color: newTag.color,
        is_preset: newTag.is_preset || false,
        files_count: 0,
        contacts_count: 0,
        created_at: newTag.created_at,
      }
    });
  } catch (error) {
    console.error('Tag create error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/tags - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('id');

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Delete the tag (CASCADE will remove from file_tags and contact_tags)
    const { error } = await supabaseAdmin
      .from('tags')
      .delete()
      .eq('id', tagId)
      .eq('user_email', user.email);

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

// PATCH /api/tags - Update a tag
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tagId, name, color, emoji } = body;

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;
    if (emoji !== undefined) updateData.emoji = emoji;

    // Update tag (verify ownership via user_email)
    const { data: updatedTag, error } = await supabaseAdmin
      .from('tags')
      .update(updateData)
      .eq('id', tagId)
      .eq('user_email', user.email)
      .select()
      .single();

    if (error) {
      console.error('Tag update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json({
      tag: {
        id: updatedTag.id,
        name: updatedTag.name,
        emoji: updatedTag.emoji || '🏷️',
        color: updatedTag.color,
        is_preset: updatedTag.is_preset || false,
        created_at: updatedTag.created_at,
      }
    });
  } catch (error) {
    console.error('Tag update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
