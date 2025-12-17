import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { UTM_LIMITS } from '@/types';

// GET - Fetch UTM templates for a file
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileId = request.nextUrl.searchParams.get('file_id');

    if (!fileId) {
      return NextResponse.json({ error: 'file_id required' }, { status: 400 });
    }

    // Verify file ownership
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('id')
      .eq('id', fileId)
      .eq('user_email', user.email)
      .single();

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const { data: templates, error } = await supabaseAdmin
      .from('utm_templates')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Error fetching UTM templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST - Create new UTM template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { file_id, name, utm_source, utm_medium, utm_campaign, utm_content, utm_term } = body;

    if (!file_id || !name || !utm_source) {
      return NextResponse.json({ error: 'file_id, name, and utm_source are required' }, { status: 400 });
    }

    // Verify file ownership
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('id')
      .eq('id', file_id)
      .eq('user_email', user.email)
      .single();

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get user's tier
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('tier')
      .eq('email', user.email)
      .single();

    const tier = (userData?.tier || 'free') as keyof typeof UTM_LIMITS;
    const limit = UTM_LIMITS[tier] || UTM_LIMITS.free;

    // Check current count
    const { count } = await supabaseAdmin
      .from('utm_templates')
      .select('*', { count: 'exact', head: true })
      .eq('file_id', file_id);

    if ((count || 0) >= limit) {
      return NextResponse.json({
        error: 'UTM limit reached',
        limit,
        tier,
        upgrade_needed: true
      }, { status: 403 });
    }

    // Check for duplicate name
    const { data: existing } = await supabaseAdmin
      .from('utm_templates')
      .select('id')
      .eq('file_id', file_id)
      .ilike('name', name)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'A UTM template with this name already exists' }, { status: 400 });
    }

    // Create template
    const { data: template, error } = await supabaseAdmin
      .from('utm_templates')
      .insert({
        file_id,
        user_email: user.email,
        name,
        utm_source,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        utm_term: utm_term || null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error creating UTM template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

// DELETE - Delete UTM template
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = request.nextUrl.searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    // Verify ownership through user_email
    const { error } = await supabaseAdmin
      .from('utm_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_email', user.email);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting UTM template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
