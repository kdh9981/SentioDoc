import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import QRCode from 'qrcode';

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

    const userEmail = user.email;
    const { id: fileId } = await params;

    // Verify ownership
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('user_email, slug')
      .eq('id', fileId)
      .single();

    if (!file || file.user_email !== userEmail) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check tier
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('tier')
      .eq('email', userEmail)
      .single();

    const tier = userData?.tier || 'free';

    if (tier === 'free') {
      return NextResponse.json(
        { error: 'QR code generation requires Starter or Pro plan' },
        { status: 403 }
      );
    }

    // Generate QR code
    const linkId = file.slug || fileId;
    const baseUrl = process.env.NEXTAUTH_URL || 'https://doc.sentio.ltd';
    const url = `${baseUrl}/${linkId}`;

    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return NextResponse.json({ qrCode: qrDataUrl, url });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
