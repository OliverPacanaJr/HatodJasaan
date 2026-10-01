'use client';

import { cn, getInitials } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

const imgSizeMap = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', sizeMap[size], className)}>
        <Image src={src} alt={name} fill className="object-cover" sizes={`${imgSizeMap[size]}px`} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold flex-shrink-0',
        sizeMap[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
