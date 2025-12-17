'use client';

import { useRouter } from 'next/navigation';
import CreateLinkPage from '@/components/dashboard/CreateLinkPage';

export default function UploadPage() {
  const router = useRouter();

  return (
    <CreateLinkPage
      defaultTab="file"
      onSuccess={() => {}}
      onNavigateToMyLinks={() => router.push('/dashboard/links')}
      onTabChange={(tab) => router.push(tab === 'file' ? '/dashboard/upload' : '/dashboard/track')}
    />
  );
}
