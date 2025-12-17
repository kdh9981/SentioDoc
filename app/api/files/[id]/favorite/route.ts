import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: fileId } = await params;

    // Get current state
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('files')
      .select('is_favorite, user_email')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (file.user_email !== user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Toggle favorite
    const newValue = !file.is_favorite;

    const { error: updateError } = await supabaseAdmin
      .from('files')
      .update({ is_favorite: newValue })
      .eq('id', fileId);

    if (updateError) {
      console.error('Failed to update favorite:', updateError);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ is_favorite: newValue });
  } catch (error) {
    console.error('Favorite toggle error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
