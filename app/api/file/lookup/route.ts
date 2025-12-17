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
        let file = null;

        if (domain === 'DEFAULT') {
            // For default domain (doc.sentio.ltd), look up files by slug only
            // These files either have no custom_domain_id or have the default domain
            const { data } = await supabaseAdmin
                .from('files')
                .select('*')
                .eq('slug', slug)
                .is('deleted_at', null)
                .single();

            file = data;

            // If not found by slug, try by file ID (backward compatibility)
            if (!file) {
                const { data: fileById } = await supabaseAdmin
                    .from('files')
                    .select('*')
                    .eq('id', slug)
                    .is('deleted_at', null)
                    .single();
                file = fileById;
            }
        } else {
            // For custom domains, find the domain first
            const { data: customDomain } = await supabaseAdmin
                .from('custom_domains')
                .select('id')
                .eq('full_domain', domain)
                .single();

            if (!customDomain) {
                return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
            }

            // Find file by slug and custom_domain_id
            const { data } = await supabaseAdmin
                .from('files')
                .select('*')
                .eq('slug', slug)
                .eq('custom_domain_id', customDomain.id)
                .is('deleted_at', null)
                .single();

            file = data;
        }

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        return NextResponse.json(file);
    } catch (error) {
        console.error('Lookup error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
