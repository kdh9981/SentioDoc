import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get tags for a contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: encodedId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode contact email from base64
    let contactEmail: string;
    try {
      contactEmail = Buffer.from(encodedId, 'base64').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    // Get tags for this contact via junction table
    // user_id references auth.users(id), so use user.id directly
    const { data: contactTags, error } = await supabaseAdmin
      .from('contact_tags')
      .select(`
        tag_id,
        tags (
          id,
          name,
          emoji,
          color
        )
      `)
      .eq('contact_email', contactEmail)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching contact tags:', error);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    // Extract tags from the junction table result
    const tags = (contactTags || [])
      .map(ct => ct.tags)
      .filter(Boolean)
      .map(tag => ({
        id: (tag as any).id,
        name: (tag as any).name,
        emoji: (tag as any).emoji || '🏷️',
        color: (tag as any).color || 'blue',
      }));

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Contact tags GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Add tag to contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: encodedId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode contact email from base64
    let contactEmail: string;
    try {
      contactEmail = Buffer.from(encodedId, 'base64').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const body = await request.json();
    const { tag_id } = body;

    if (!tag_id) {
      return NextResponse.json({ error: 'tag_id is required' }, { status: 400 });
    }

    // Check if already tagged
    const { data: existing } = await supabaseAdmin
      .from('contact_tags')
      .select('id')
      .eq('contact_email', contactEmail)
      .eq('tag_id', tag_id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: 'Tag already applied' });
    }

    // Add tag - use user.id from auth (not authorized_users.id)
    const { error } = await supabaseAdmin
      .from('contact_tags')
      .insert({
        user_id: user.id,
        contact_email: contactEmail,
        tag_id: tag_id,
      });

    if (error) {
      console.error('Error adding contact tag:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Contact tags POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Remove tag from contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: encodedId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode contact email from base64
    let contactEmail: string;
    try {
      contactEmail = Buffer.from(encodedId, 'base64').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tag_id');

    if (!tagId) {
      return NextResponse.json({ error: 'tag_id query param is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('contact_tags')
      .delete()
      .eq('contact_email', contactEmail)
      .eq('tag_id', tagId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error removing contact tag:', error);
      return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact tags DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
