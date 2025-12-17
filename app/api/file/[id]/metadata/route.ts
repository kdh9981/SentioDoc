import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paramId } = await params;

        // Check if paramId is a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paramId);

        let query = supabaseAdmin
            .from('files')
            .select('id, name, mime_type, size, slug, type, external_url, pdf_path, password_hash, expires_at, deleted_at, require_email, require_name, allow_download, allow_print');

        if (isUUID) {
            query = query.eq('id', paramId);
        } else {
            query = query.eq('slug', paramId);
        }

        const { data: file, error } = await query.single();

        if (error || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Check if soft deleted
        if (file.deleted_at) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Check expiration SERVER-SIDE
        if (file.expires_at && new Date(file.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Link expired', expired: true }, { status: 410 });
        }

        // Return metadata with hasPassword flag (don't expose actual hash)
        return NextResponse.json({
            ...file,
            hasPassword: !!file.password_hash,
            password_hash: undefined, // Remove actual hash from response
        });
    } catch (error) {
        console.error('Metadata fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }
}
