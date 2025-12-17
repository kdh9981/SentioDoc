import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch link preview settings for a file
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

    const { data: file, error } = await supabaseAdmin
      .from('files')
      .select('og_title, og_description, og_image_type, og_image_url')
      .eq('id', fileId)
      .eq('user_email', user.email)
      .single();

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({
      preview: {
        og_title: file.og_title || null,
        og_description: file.og_description || null,
        og_image_type: file.og_image_type || 'default',
        og_image_url: file.og_image_url || null
      }
    });
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return NextResponse.json({ error: 'Failed to fetch preview settings' }, { status: 500 });
  }
}

// PUT - Update link preview settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { file_id, og_title, og_description, og_image_type, og_image_url } = body;

    if (!file_id) {
      return NextResponse.json({ error: 'file_id required' }, { status: 400 });
    }

    // Check user's tier - only starter+ can customize
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('tier')
      .eq('email', user.email)
      .single();

    const tier = userData?.tier || 'free';

    if (tier === 'free') {
      return NextResponse.json({
        error: 'Link preview customization requires Starter plan or higher',
        upgrade_needed: true
      }, { status: 403 });
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

    // Update link preview
    const { data: updatedFile, error } = await supabaseAdmin
      .from('files')
      .update({
        og_title: og_title || null,
        og_description: og_description || null,
        og_image_type: og_image_type || 'default',
        og_image_url: og_image_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', file_id)
      .select('og_title, og_description, og_image_type, og_image_url')
      .single();

    if (error) throw error;

    return NextResponse.json({
      preview: {
        og_title: updatedFile.og_title,
        og_description: updatedFile.og_description,
        og_image_type: updatedFile.og_image_type,
        og_image_url: updatedFile.og_image_url
      }
    });
  } catch (error) {
    console.error('Error updating link preview:', error);
    return NextResponse.json({ error: 'Failed to update preview' }, { status: 500 });
  }
}
