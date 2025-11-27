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
            .select('id, name, mime_type, size, slug, type, external_url');

        if (isUUID) {
            query = query.eq('id', paramId);
        } else {
            query = query.eq('slug', paramId);
        }

        const { data: file, error } = await query.single();

        if (error || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        return NextResponse.json(file);
    } catch (error) {
        console.error('Metadata fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }
}
