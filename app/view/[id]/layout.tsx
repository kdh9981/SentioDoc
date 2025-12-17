import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  // Fetch file and user data
  const { data: file } = await supabaseAdmin
    .from('files')
    .select('original_name, slug, og_title, og_description, og_image_type, og_image_url, user_email')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!file) {
    return {
      title: 'Link not found',
      description: 'This link does not exist or has expired.'
    };
  }

  // Get user's tier and company logo
  const { data: userData } = await supabaseAdmin
    .from('authorized_users')
    .select('tier, company_logo')
    .eq('email', file.user_email)
    .single();

  const userTier = userData?.tier || 'free';
  const isFreeTier = userTier === 'free';
  const companyLogo = userData?.company_logo || null;

  // Determine what to show based on tier
  const title = isFreeTier
    ? file.original_name || file.slug
    : (file.og_title || file.original_name || file.slug);

  const description = isFreeTier
    ? 'Powered by LinkLens'
    : (file.og_description || 'Shared via LinkLens');

  // Determine image URL
  let imageUrl = '/logo.png'; // LinkLens default

  if (!isFreeTier && file.og_image_type === 'custom' && file.og_image_url) {
    imageUrl = file.og_image_url;
  } else if (!isFreeTier && file.og_image_type === 'logo' && companyLogo) {
    imageUrl = companyLogo;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function ViewLayout({ children }: Props) {
  return <>{children}</>;
}
