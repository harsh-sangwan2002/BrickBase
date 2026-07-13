import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Scale, X } from 'lucide-react';
import { propertiesApi } from '@/api/properties';
import { useCompareStore } from '@/store/compareStore';
import { Spinner } from '@/components/Spinner';
import { formatArea, formatPrice, propertyTypeLabel } from '@/utils/format';
import { Button } from '@/components/Button';

const ROWS: { label: string; key: string; format?: (v: unknown) => string }[] = [
  { label: 'Type', key: 'property_type', format: (v) => propertyTypeLabel(String(v)) },
  { label: 'Listing', key: 'listing_type' },
  { label: 'Price', key: 'price', format: (v) => formatPrice(Number(v)) },
  { label: 'City', key: 'city' },
  { label: 'BHK', key: 'bhk' },
  { label: 'Bathrooms', key: 'bathrooms' },
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
        <h1 className="text-2xl font-bold text-navy-900">Compare properties</h1>
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
          <table className="w-full min-w-[640px] border-separate border-spacing-0 overflow-hidden rounded-xl border border-navy-100">
            <thead>
              <tr>
                <th className="w-32 bg-navy-50 p-3 text-left text-sm font-semibold text-navy-500"></th>
                {data?.items.map((p) => (
                  <th key={p.id} className="min-w-[200px] bg-navy-50 p-3 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/properties/${p.id}`} className="font-semibold text-navy-900 hover:underline">
                        {p.title}
                      </Link>
                      <button onClick={() => toggle(p.id)} className="text-navy-300 hover:text-navy-600">
                        <X size={14} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="border-t border-navy-100 p-3 text-sm font-medium text-navy-500">{row.label}</td>
                  {data?.items.map((p) => {
                    const raw = (p as unknown as Record<string, unknown>)[row.key];
                    return (
                      <td key={p.id} className="border-t border-navy-100 p-3 text-sm text-navy-800">
                        {raw == null ? '—' : row.format ? row.format(raw) : String(raw)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="border-t border-navy-100 p-3 text-sm font-medium text-navy-500">Area</td>
                {data?.items.map((p) => (
                  <td key={p.id} className="border-t border-navy-100 p-3 text-sm text-navy-800">
                    {formatArea(p.area_value, p.area_unit)}
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
