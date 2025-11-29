import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (!slug) {
            return NextResponse.json({ error: 'Slug parameter required' }, { status: 400 });
        }

        // Check if slug exists in non-deleted files
        const { data, error } = await supabaseAdmin
            .from('files')
            .select('id')
            .eq('slug', slug)
            .is('deleted_at', null)
            .maybeSingle();

        if (error) {
            console.error('Slug check error:', error);
            return NextResponse.json({ error: 'Failed to check slug' }, { status: 500 });
        }

        // If data exists, slug is taken; otherwise it's available
        return NextResponse.json({ available: !data });
    } catch (error) {
        console.error('Slug check error:', error);
        return NextResponse.json({ error: 'Failed to check slug' }, { status: 500 });
    }
}
