import { redirect, notFound } from 'next/navigation';
import { isReservedSlug } from '@/lib/reserved-slugs';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// This route handles backward compatibility for old URLs without /s/ prefix
// Redirects linklens.tech/my-slug → linklens.tech/s/my-slug
export default async function LegacySlugRedirect({ params, searchParams }: Props) {
    const { slug } = await params;
    const queryParams = await searchParams;

    // Skip reserved slugs - let them 404 (they're handled by their own routes)
    if (isReservedSlug(slug)) {
        notFound();
    }

    // Build query string to preserve UTM params
    const preserveParams = new URLSearchParams();
    if (queryParams.utm_source) preserveParams.set('utm_source', String(queryParams.utm_source));
    if (queryParams.utm_medium) preserveParams.set('utm_medium', String(queryParams.utm_medium));
    if (queryParams.utm_campaign) preserveParams.set('utm_campaign', String(queryParams.utm_campaign));
    if (queryParams.utm_term) preserveParams.set('utm_term', String(queryParams.utm_term));
    if (queryParams.utm_content) preserveParams.set('utm_content', String(queryParams.utm_content));

    const queryString = preserveParams.toString();

    // Redirect to new /s/ prefix format
    redirect(`/s/${slug}${queryString ? `?${queryString}` : ''}`);
}
