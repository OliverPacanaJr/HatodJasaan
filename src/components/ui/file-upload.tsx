'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  preview?: string | null;
  onClear?: () => void;
  error?: string;
  hint?: string;
}

export function FileUpload({
  label,
  accept = 'image/*',
  maxSizeMB = 5,
  onFileSelect,
  preview,
  onClear,
  error,
  hint,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setLocalError(null);
      if (file.size > maxSizeMB * 1024 * 1024) {
        setLocalError(`File too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }
      onFileSelect(file);
    },
    [maxSizeMB, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const displayError = error || localError;

  if (preview) {
    return (
      <div className="w-full">
        {label && <p className="label-field">{label}</p>}
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <div className="relative w-full h-48">
            <Image src={preview} alt="Preview" fill className="object-cover" />
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg shadow-sm hover:bg-white transition-colors"
            >
              <XMarkIcon className="h-4 w-4 text-slate-600" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && <p className="label-field">{label}</p>}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
          dragActive
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-300 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50',
          displayError && 'border-red-300 bg-red-50'
        )}
      >
        <div className="flex flex-col items-center gap-2 p-4 text-center">
          <CloudArrowUpIcon className={cn('h-8 w-8', dragActive ? 'text-brand-500' : 'text-slate-400')} />
          <div>
            <p className="text-sm font-medium text-slate-600">
              <span className="text-brand-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {hint || `PNG, JPG up to ${maxSizeMB}MB`}
            </p>
          </div>
        </div>
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
        />
      </label>
      {displayError && <p className="mt-1.5 text-xs text-red-500">{displayError}</p>}
    </div>
  );
}
