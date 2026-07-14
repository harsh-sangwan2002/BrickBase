import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Award, Scale, X } from 'lucide-react';
import { propertiesApi } from '@/api/properties';
import { useCompareStore } from '@/store/compareStore';
import { Spinner } from '@/components/Spinner';
import { coverImage, formatArea, formatPrice, propertyTypeLabel } from '@/utils/format';
import { Button } from '@/components/Button';
import type { PropertyDetail } from '@/types';
import clsx from 'clsx';

// Normalize every area unit to sqft so price-per-area is comparable across listings.
const SQFT_PER_UNIT: Record<string, number> = { sqft: 1, sqyd: 9, acre: 43560, sqm: 10.7639 };

function pricePerSqft(p: PropertyDetail): number {
  const factor = SQFT_PER_UNIT[p.area_unit] ?? 1;
  const areaInSqft = p.area_value * factor;
  return areaInSqft > 0 ? p.price / areaInSqft : Infinity;
}

type Direction = 'lower' | 'higher';

function bestIndex(values: (number | null | undefined)[], direction: Direction): number | null {
  let best: number | null = null;
  values.forEach((v, i) => {
    if (v == null || Number.isNaN(v)) return;
    if (best === null) {
      best = i;
      return;
    }
    const better = direction === 'lower' ? v < (values[best] as number) : v > (values[best] as number);
    if (better) best = i;
  });
  // Not meaningful to highlight a "best" when every value is identical.
  const distinct = new Set(values.filter((v): v is number => v != null && !Number.isNaN(v)));
  return distinct.size > 1 ? best : null;
}

interface RowDef {
  label: string;
  key: keyof PropertyDetail;
  format?: (v: unknown) => string;
  direction?: Direction;
}

const ROWS: RowDef[] = [
  { label: 'Type', key: 'property_type', format: (v) => propertyTypeLabel(String(v)) },
  { label: 'Listing', key: 'listing_type' },
  { label: 'Price', key: 'price', format: (v) => formatPrice(Number(v)), direction: 'lower' },
  { label: 'City', key: 'city' },
  { label: 'BHK', key: 'bhk', direction: 'higher' },
  { label: 'Bathrooms', key: 'bathrooms', direction: 'higher' },
  { label: 'Furnishing', key: 'furnishing_status' },
];

export function Compare() {
  const ids = useCompareStore((s) => s.ids);
  const clear = useCompareStore((s) => s.clear);
  const toggle = useCompareStore((s) => s.toggle);

  const { data, isLoading } = useQuery({
    queryKey: ['compare', ids],
    queryFn: () => propertiesApi.compare(ids),
    enabled: ids.length > 0,
  });

  const items = data?.items ?? [];

  const pricePerSqftValues = useMemo(() => items.map(pricePerSqft), [items]);
  const bestValueIndex = useMemo(() => bestIndex(pricePerSqftValues, 'lower'), [pricePerSqftValues]);
  const bestPriceIndex = useMemo(() => bestIndex(items.map((p) => p.price), 'lower'), [items]);
  const bestAreaIndex = useMemo(
    () => bestIndex(items.map((p) => p.area_value * (SQFT_PER_UNIT[p.area_unit] ?? 1)), 'higher'),
    [items]
  );

  if (ids.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Scale className="mx-auto text-navy-300" size={32} />
        <h1 className="mt-4 text-xl font-bold text-navy-900">Nothing to compare yet</h1>
        <p className="mt-2 text-navy-400">Add up to 4 properties from search results to compare them side-by-side.</p>
        <Link to="/search">
          <Button className="mt-6">Browse properties</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Compare properties</h1>
          {bestValueIndex !== null && items[bestValueIndex] && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-navy-500">
              <Award size={15} className="text-amber-500" />
              Best value: <span className="font-semibold text-navy-800">{items[bestValueIndex].title}</span> at{' '}
              {formatPrice(pricePerSqftValues[bestValueIndex])}/sq.ft
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear all
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 overflow-hidden rounded-xl border border-navy-100">
            <thead>
              <tr>
                <th className="w-36 bg-navy-50 p-3 text-left text-sm font-semibold text-navy-500"></th>
                {items.map((p, i) => {
                  const isBest = i === bestValueIndex;
                  return (
                    <th
                      key={p.id}
                      className={clsx(
                        'min-w-[220px] p-3 text-left align-top',
                        isBest ? 'bg-brand-gradient-soft ring-2 ring-inset ring-navy-500' : 'bg-navy-50'
                      )}
                    >
                      <div className="relative overflow-hidden rounded-lg">
                        <img src={coverImage(p.property_images)} alt={p.title} className="h-24 w-full object-cover" />
                        {isBest && (
                          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
                            <Award size={11} /> Best value
                          </span>
                        )}
                        <button
                          onClick={() => toggle(p.id)}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-navy-500 hover:text-navy-800"
                          aria-label="Remove from comparison"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <Link
                        to={`/properties/${p.id}`}
                        className="mt-2 block truncate font-semibold text-navy-900 hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-navy-400">{formatPrice(pricePerSqftValues[i])}/sq.ft</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const rawValues = items.map((p) => p[row.key] as unknown);
                const winner =
                  row.key === 'price'
                    ? bestPriceIndex
                    : row.direction
                      ? bestIndex(rawValues.map((v) => (v == null ? null : Number(v))), row.direction)
                      : null;

                return (
                  <tr key={row.key}>
                    <td className="border-t border-navy-100 p-3 text-sm font-medium text-navy-500">{row.label}</td>
                    {items.map((p, i) => {
                      const raw = rawValues[i];
                      const isWinner = winner === i;
                      return (
                        <td
                          key={p.id}
                          className={clsx(
                            'border-t border-navy-100 p-3 text-sm',
                            isWinner ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-navy-800',
                            i === bestValueIndex && 'bg-navy-50/60'
                          )}
                        >
                          {raw == null ? '—' : row.format ? row.format(raw) : String(raw)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr>
                <td className="border-t border-navy-100 p-3 text-sm font-medium text-navy-500">Area</td>
                {items.map((p, i) => (
                  <td
                    key={p.id}
                    className={clsx(
                      'border-t border-navy-100 p-3 text-sm',
                      i === bestAreaIndex ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-navy-800',
                      i === bestValueIndex && i !== bestAreaIndex && 'bg-navy-50/60'
                    )}
                  >
                    {formatArea(p.area_value, p.area_unit)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border-t border-navy-100 p-3 text-sm font-medium text-navy-500">Price / sq.ft</td>
                {items.map((p, i) => (
                  <td
                    key={p.id}
                    className={clsx(
                      'border-t border-navy-100 p-3 text-sm',
                      i === bestValueIndex ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-navy-800'
                    )}
                  >
                    {formatPrice(pricePerSqftValues[i])}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
