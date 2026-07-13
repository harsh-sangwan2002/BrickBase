import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Badge({ children, tone = 'navy' }: { children: ReactNode; tone?: 'navy' | 'green' | 'red' | 'amber' }) {
  return (
    <span
      className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', {
        'bg-navy-100 text-navy-700': tone === 'navy',
        'bg-emerald-100 text-emerald-700': tone === 'green',
        'bg-red-100 text-red-700': tone === 'red',
        'bg-amber-100 text-amber-700': tone === 'amber',
      })}
    >
      {children}
    </span>
  );
}
