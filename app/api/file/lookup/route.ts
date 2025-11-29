import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');
    const slug = searchParams.get('slug');

    if (!domain || !slug) {
        return NextResponse.json({ error: 'Missing domain or slug' }, { status: 400 });
    }

    try {
        // 1. Find custom domain ID
        const { data: customDomain } = await supabaseAdmin
            .from('custom_domains')
            .select('id')
            .eq('full_domain', domain)
            .single();

        if (!customDomain) {
            return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
        }

        // 2. Find file by slug and custom_domain_id
        // Note: We check for slug match OR name match (if we use name as slug fallback)
        // But for now let's assume slug is populated.
        // Actually, we should check if 'slug' column exists or if we use 'name'.
        // Based on previous work, we added 'slug' column.

        const { data: file } = await supabaseAdmin
            .from('files')
            .select('*')
            .eq('slug', slug)
            .eq('custom_domain_id', customDomain.id)
            .is('deleted_at', null) // Only active files
            .single();

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        return NextResponse.json(file);
    } catch (error) {
        console.error('Lookup error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
