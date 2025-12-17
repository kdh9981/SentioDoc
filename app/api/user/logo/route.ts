import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTierLimits } from '@/lib/tierLimits';

// GET /api/user/logo - Get user's custom logo and brand color
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('logo_url, brand_color, tier')
      .eq('email', user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tierLimits = getTierLimits(userData.tier || 'free');

    return NextResponse.json({
      logo: userData.logo_url || null,
      logoUrl: userData.logo_url || null,
      brandColor: userData.brand_color || '#3B82F6',
      canCustomize: tierLimits.customBranding,
      tier: userData.tier || 'free',
    });
  } catch (error) {
    console.error('Logo fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;

    // Check tier
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('tier, logo_url')
      .eq('email', userEmail)
      .single();

    const tier = userData?.tier || 'free';

    if (tier === 'free') {
      return NextResponse.json(
        { error: 'Custom branding requires Starter or Pro plan' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle JSON request (brand color only)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { brandColor } = body;

      if (brandColor) {
        const { error } = await supabaseAdmin
          .from('authorized_users')
          .update({ brand_color: brandColor })
          .eq('email', userEmail);

        if (error) {
          console.error('Brand color update error:', error);
          return NextResponse.json({ error: 'Failed to save brand color' }, { status: 500 });
        }

        return NextResponse.json({ success: true, brandColor });
      }

      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Handle file upload
    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Logo must be under 2MB' }, { status: 400 });
    }

    // Delete old logo if exists
    if (userData?.logo_url) {
      const oldPath = userData.logo_url.split('/uploaded-files/')[1];
      if (oldPath) {
        await supabaseAdmin.storage.from('uploaded-files').remove([oldPath]);
      }
    }

    // Upload to Supabase storage
    const fileExt = file.name.split('.').pop();
    const fileName = `logos/${userEmail.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('uploaded-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Logo upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('uploaded-files')
      .getPublicUrl(fileName);

    const logoUrl = urlData.publicUrl;

    // Update user record
    const { error: updateError } = await supabaseAdmin
      .from('authorized_users')
      .update({ logo_url: logoUrl })
      .eq('email', userEmail);

    if (updateError) {
      console.error('Logo update error:', updateError);
      return NextResponse.json({ error: 'Failed to save logo' }, { status: 500 });
    }

    return NextResponse.json({ logo: logoUrl, logoUrl });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;

    // Get current logo URL to delete from storage
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('logo_url')
      .eq('email', userEmail)
      .single();

    if (userData?.logo_url) {
      const filePath = userData.logo_url.split('/uploaded-files/')[1];
      if (filePath) {
        await supabaseAdmin.storage.from('uploaded-files').remove([filePath]);
      }
    }

    const { error } = await supabaseAdmin
      .from('authorized_users')
      .update({ logo_url: null })
      .eq('email', userEmail);

    if (error) {
      return NextResponse.json({ error: 'Failed to remove logo' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
