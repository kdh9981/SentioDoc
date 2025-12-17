import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { password } = await request.json();
    const { id: fileId } = await params;

    const { data: file } = await supabaseAdmin
      .from('files')
      .select('password_hash')
      .eq('id', fileId)
      .single();

    if (!file) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!file.password_hash) {
      return NextResponse.json({ valid: true });
    }

    const valid = await bcrypt.compare(password, file.password_hash);
    return NextResponse.json({ valid });
  } catch (error) {
    console.error('Password verify error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
