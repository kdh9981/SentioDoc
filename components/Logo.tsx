'use client';

import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
  className?: string;
}

const sizes = {
  sm: { full: { width: 120, height: 40 }, icon: { width: 32, height: 32 } },
  md: { full: { width: 150, height: 50 }, icon: { width: 40, height: 40 } },
  lg: { full: { width: 180, height: 60 }, icon: { width: 48, height: 48 } },
};

export default function Logo({
  variant = 'full',
  size = 'md',
  linkTo = '/',
  className = ''
}: LogoProps) {
  const dimensions = sizes[size][variant];
  const src = variant === 'full' ? '/logo.png' : '/logo-icon.png';

  const logo = (
    <img
      src={src}
      alt="LinkLens"
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      style={{ height: 'auto', maxHeight: dimensions.height }}
    />
  );

  if (linkTo) {
    return (
      <Link href={linkTo} style={{ display: 'inline-flex', alignItems: 'center' }}>
        {logo}
      </Link>
    );
  }

  return logo;
}
