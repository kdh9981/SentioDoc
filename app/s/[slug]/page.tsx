import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import ViewerPage from '@/app/view/[id]/page';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ShareLinkPage({ params, searchParams }: Props) {
    const { slug } = await params;

    // Resolve slug to file ID
    const { data: bySlug } = await supabaseAdmin
        .from('files')
        .select('id')
        .eq('slug', slug)
        .is('deleted_at', null)
        .maybeSingle();

    let fileId = bySlug?.id;

    // Fallback: try by ID (for backward compatibility with UUID links)
    if (!fileId) {
        const { data: byId } = await supabaseAdmin
            .from('files')
            .select('id')
            .eq('id', slug)
            .is('deleted_at', null)
            .maybeSingle();

        fileId = byId?.id;
    }

    if (!fileId) {
        notFound();
    }

    // Render the ORIGINAL viewer with the resolved fileId
    // ViewerPage expects params as Promise<{ id: string }>
    return <ViewerPage params={Promise.resolve({ id: fileId })} />;
}
