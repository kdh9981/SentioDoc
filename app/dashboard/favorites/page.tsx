'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FavoritesPage from '@/components/dashboard/FavoritesPage';
import { usePeriodFilterContext } from '@/contexts/PeriodFilterContext';

export default function FavoritesRoutePage() {
  const router = useRouter();
  const { getApiParams, effectiveRange } = usePeriodFilterContext();
  const [key, setKey] = useState(0);

  // Force re-render when period changes
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [effectiveRange]);

  return (
    <FavoritesPage
      key={key}
      onFileClick={(fileId) => router.push(`/dashboard/files/${fileId}`)}
      periodParams={getApiParams()}
    />
  );
}
