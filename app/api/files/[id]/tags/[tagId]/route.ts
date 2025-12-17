import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// REMOVE tag from file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: fileId, tagId } = await params;

    // Verify file ownership
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('user_email, tags')
      .eq('id', fileId)
      .single();

    if (!file || file.user_email !== user.email) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Remove tag from file's tags array
    const currentTags = file.tags || [];
    const updatedTags = currentTags.filter((t: string) => t !== tagId);

    const { error } = await supabaseAdmin
      .from('files')
      .update({ tags: updatedTags })
      .eq('id', fileId);

    if (error) {
      console.error('Remove tag error:', error);
      return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove tag error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
