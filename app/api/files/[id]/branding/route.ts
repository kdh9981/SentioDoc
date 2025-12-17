import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;

    // Check if fileId is a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileId);

    // Get file and owner info
    let query = supabaseAdmin
      .from('files')
      .select('user_email');

    if (isUUID) {
      query = query.eq('id', fileId);
    } else {
      query = query.eq('slug', fileId);
    }

    const { data: file } = await query.single();

    if (!file) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Get owner's tier and logo
    const { data: owner } = await supabaseAdmin
      .from('authorized_users')
      .select('tier, logo_url')
      .eq('email', file.user_email)
      .single();

    const tier = owner?.tier || 'free';
    const logoUrl = owner?.logo_url || null;

    // Free tier = show watermark, no custom logo
    // Starter/Pro = no watermark, can have custom logo
    return NextResponse.json({
      showWatermark: tier === 'free',
      logoUrl: tier !== 'free' ? logoUrl : null,
      tier,
    });
  } catch (error) {
    console.error('Branding error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
