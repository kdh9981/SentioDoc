'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FilesPage from '@/components/dashboard/FilesPage';
import { usePeriodFilterContext } from '@/contexts/PeriodFilterContext';

interface FileRecord {
  id: string;
  name: string;
  slug: string;
  views: number;
  uniqueViewers?: number;
  avgEngagement?: number;
  hotLeads?: number;
  createdAt: string;
  lastViewedAt?: string;
  type: 'file' | 'url';
  fileType?: string;
  size?: number;
  isActive?: boolean;
  isFavorite?: boolean;
  tags?: string[];
}

export default function LinksPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Use global period filter
  const { getApiParams, effectiveRange } = usePeriodFilterContext();

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getApiParams();

      // Pass date params to API
      const res = await fetch(`/api/files?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
      const data = await res.json();

      if (data.files) {
        setFiles(data.files.map((f: FileRecord) => ({
          ...f,
          slug: f.slug || f.id,
          type: f.type || 'file',
        })));
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  }, [getApiParams]);

  // Refetch when period changes
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, effectiveRange]);

  const handleDeleteFile = async (fileId: string) => {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <FilesPage
      files={files}
      onUploadClick={() => router.push('/dashboard/upload')}
      onFileClick={(fileId) => router.push(`/dashboard/files/${fileId}`)}
      onDeleteFile={handleDeleteFile}
      onRefresh={fetchFiles}
    />
  );
}
