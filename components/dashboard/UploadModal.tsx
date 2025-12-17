'use client';

import React from 'react';
import FileUpload from '@/components/FileUpload';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  defaultTab?: 'file' | 'site';
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess, defaultTab = 'file' }: UploadModalProps) {
  if (!isOpen) return null;

  const handleSuccess = () => {
    onUploadSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create new link</h2>
            <p className="text-sm text-slate-700 mt-1">Upload a file or track an external site</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <FileUpload onUploadSuccess={handleSuccess} defaultTab={defaultTab} />
        </div>
      </div>
    </div>
  );
}
