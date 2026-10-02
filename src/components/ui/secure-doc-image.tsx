'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SecureDocImageProps {
  /** The URL saved in the database when the document was uploaded */
  url: string;
  alt: string;
  className?: string;
}

/**
 * Verification documents (IDs, selfies) live in a PRIVATE storage bucket, so the saved URL
 * cannot be opened directly. This asks Supabase for a temporary signed link (1 hour) instead.
 * Only the owner of the file and admins are allowed to get one (see migration 002).
 */
export function SecureDocImage({ url, alt, className }: SecureDocImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);

    const marker = '/documents/';
    const index = url.indexOf(marker);
    if (index === -1) {
      setSrc(url);
      return;
    }
    const path = decodeURIComponent(url.slice(index + marker.length).split('?')[0]);

    createClient()
      .storage.from('documents')
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) setFailed(true);
        else setSrc(data.signedUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 p-2 text-center">
        Could not load document
      </div>
    );
  }
  if (!src) return <div className="w-full h-full animate-pulse bg-slate-200" />;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
