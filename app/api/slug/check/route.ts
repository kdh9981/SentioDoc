import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        console.log('[SLUG CHECK] Checking slug:', slug);

        if (!slug) {
            return NextResponse.json({ error: 'Slug parameter required' }, { status: 400 });
        }

        // Check if slug exists in non-deleted files
        const { data, error } = await supabaseAdmin
            .from('files')
            .select('id, slug')
            .eq('slug', slug)
            .is('deleted_at', null)
            .maybeSingle();

        console.log('[SLUG CHECK] Query result - data:', data, 'error:', error);

        if (error) {
            console.error('[SLUG CHECK] Database error:', error);
            return NextResponse.json({ error: 'Failed to check slug' }, { status: 500 });
        }

        const available = !data;
        console.log('[SLUG CHECK] Result:', { slug, available, foundInDB: !!data });

        // If data exists, slug is taken; otherwise it's available
        return NextResponse.json({ available });
    } catch (error) {
        console.error('[SLUG CHECK] Exception:', error);
        return NextResponse.json({ error: 'Failed to check slug' }, { status: 500 });
    }
}
