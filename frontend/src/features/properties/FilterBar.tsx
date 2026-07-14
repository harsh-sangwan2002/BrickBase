import { RotateCcw, Search } from 'lucide-react';
import type { SearchFilters } from '@/api/properties';
import { Button } from '@/components/Button';

interface FilterBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
  cities: string[];
}

// Keys that count as an "active filter" — sort/limit/cursor are UI/pagination state, not filters.
const FILTER_KEYS: (keyof SearchFilters)[] = [
  'q',
  'property_type',
  'listing_type',
  'city',
  'min_price',
  'max_price',
  'min_area',
  'max_area',
  'bhk',
];

export function FilterBar({ filters, onChange, onReset, cities }: FilterBarProps) {
  function set<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    onChange({ ...filters, [key]: value, cursor: undefined });
  }

  const activeCount = FILTER_KEYS.filter((key) => filters[key] !== undefined && filters[key] !== '').length;

  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-4 card-shadow">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-navy-700">
          Filters {activeCount > 0 && <span className="text-navy-400">({activeCount} active)</span>}
        </span>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw size={13} /> Reset filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
          <input
            value={filters.q ?? ''}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Search by title, city, description..."
            className="w-full rounded-lg border border-navy-100 py-2.5 pl-9 pr-3 text-sm focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100"
          />
        </div>

        <select
          value={filters.property_type ?? ''}
          onChange={(e) => set('property_type', e.target.value || undefined)}
          className="rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
        >
          <option value="">All types</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="land">Plot/Land</option>
        </select>

        <select
          value={filters.listing_type ?? ''}
          onChange={(e) => set('listing_type', e.target.value || undefined)}
          className="rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
        >
          <option value="">Sale or rent</option>
          <option value="sale">For sale</option>
          <option value="rent">For rent</option>
        </select>

        <select
          value={filters.city ?? ''}
          onChange={(e) => set('city', e.target.value || undefined)}
          className="rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          value={filters.sort ?? 'newest'}
          onChange={(e) => set('sort', e.target.value)}
          className="rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="area">Area</option>
        </select>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <input
          type="number"
          placeholder="Min price"
          value={filters.min_price ?? ''}
          onChange={(e) => set('min_price', e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-400 focus:outline-none"
        />
        <input
          type="number"
          placeholder="Max price"
          value={filters.max_price ?? ''}
          onChange={(e) => set('max_price', e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-400 focus:outline-none"
        />
        <input
          type="number"
          placeholder="BHK"
          value={filters.bhk ?? ''}
          onChange={(e) => set('bhk', e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-400 focus:outline-none"
        />
        <input
          type="number"
          placeholder="Min area (sqft)"
          value={filters.min_area ?? ''}
          onChange={(e) => set('min_area', e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-lg border border-navy-100 px-3 py-2 text-sm focus:border-navy-400 focus:outline-none"
        />
      </div>
    </div>
  );
}
