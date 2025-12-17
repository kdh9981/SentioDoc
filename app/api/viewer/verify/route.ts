import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { fileId, email, name, password } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Get file settings including name and owner for denormalization
    const { data: file, error } = await supabaseAdmin
      .from('files')
      .select('id, name, user_email, type, mime_type, password_hash, require_email, require_name')
      .eq('id', fileId)
      .single();

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Verify password if required
    if (file.password_hash) {
      if (!password) {
        return NextResponse.json({ error: 'Password is required' }, { status: 401 });
      }
      // Simple comparison - in production use bcrypt
      if (file.password_hash !== password) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }
    }

    // Validate required fields
    if (file.require_email && !email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (file.require_name && !name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Determine file_type for icon display
    let fileType = 'file';
    if (file.type === 'url') {
      fileType = 'url';
    } else if (file.mime_type) {
      const mt = file.mime_type.toLowerCase();
      if (mt.includes('pdf')) fileType = 'pdf';
      else if (mt.includes('video') || mt.includes('mp4') || mt.includes('mov')) fileType = 'video';
      else if (mt.includes('presentation') || mt.includes('ppt')) fileType = 'pptx';
      else if (mt.includes('word') || mt.includes('doc')) fileType = 'docx';
      else if (mt.includes('sheet') || mt.includes('xls')) fileType = 'xlsx';
      else if (mt.includes('image')) fileType = 'image';
    }

    // Record viewer in access_logs with file_name and owner_email for Contact page
    const { data: accessLog, error: logError } = await supabaseAdmin
      .from('access_logs')
      .insert({
        file_id: fileId,
        file_name: file.name,              // Denormalized for Contact page
        owner_email: file.user_email,      // Denormalized for Contact page
        file_type: fileType,
        link_type: file.type || 'file',
        viewer_email: email?.trim() || null,
        viewer_name: name?.trim() || null,
        accessed_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      })
      .select('id')
      .single();

    return NextResponse.json({
      success: true,
      accessLogId: accessLog?.id || null
    });
  } catch (error) {
    console.error('Viewer verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
