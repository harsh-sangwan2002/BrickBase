import { Building2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-navy-100 bg-navy-50/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white">
              <Building2 size={16} />
            </span>
            <span className="font-bold text-navy-900">
              Brick<span className="text-gradient">Base</span>
            </span>
          </div>
          <p className="text-sm text-navy-400">© {new Date().getFullYear()} BrickBase. Find plots, homes & commercial spaces.</p>
        </div>
      </div>
    </footer>
  );
}
