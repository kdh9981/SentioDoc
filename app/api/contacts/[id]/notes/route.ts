import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// Contact ID = base64 encoded email
// Notes are stored with user_id + contact_email as the key

// GET - Fetch notes for a contact
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

    // Decode the contact email from base64
    let contactEmail: string;
    try {
      contactEmail = Buffer.from(encodedId, 'base64').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    // Fetch notes for this user + contact email combination
    const { data: notes, error } = await supabaseAdmin
      .from('contact_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('contact_email', contactEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Notes fetch error:', error);
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ notes: [] });
      }
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json({ notes: notes || [] });

  } catch (error) {
    console.error('Notes fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create a new note
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

    // Decode the contact email from base64
    let contactEmail: string;
    try {
      contactEmail = Buffer.from(encodedId, 'base64').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    // Create the note with contact_email instead of contact_id
    const { data: note, error } = await supabaseAdmin
      .from('contact_notes')
      .insert({
        user_id: user.id,
        contact_email: contactEmail,
        content: content.trim(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Note create error:', error);
      // Check if table doesn't exist - need to create it
      if (error.code === '42P01') {
        return NextResponse.json({
          error: 'Notes table not configured. Run migration first.',
          details: 'Table contact_notes does not exist'
        }, { status: 500 });
      }
      // Check if column doesn't exist
      if (error.code === '42703') {
        return NextResponse.json({
          error: 'Notes table schema mismatch. Run migration to update.',
          details: error.message
        }, { status: 500 });
      }
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    return NextResponse.json({ note, success: true });

  } catch (error) {
    console.error('Note create error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: encodedId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode the contact email from base64
    let contactEmail: string;
    try {
      contactEmail = Buffer.from(encodedId, 'base64').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Delete note (verify ownership via user_id and contact_email)
    const { error } = await supabaseAdmin
      .from('contact_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id)
      .eq('contact_email', contactEmail);

    if (error) {
      console.error('Note delete error:', error);
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Note delete error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
