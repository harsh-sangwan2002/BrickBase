import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi, type SearchFilters } from '@/api/properties';
import { metaApi } from '@/api/meta';
import { FilterBar } from '@/features/properties/FilterBar';
import { PropertyCard } from '@/features/properties/PropertyCard';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';

export function Search() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get('q') ?? undefined,
    property_type: searchParams.get('property_type') ?? undefined,
    sort: 'newest',
    limit: 12,
  });
  const [cursorStack, setCursorStack] = useState<string[]>([]);

  useEffect(() => {
    setCursorStack([]);
  }, [filters.q, filters.property_type, filters.listing_type, filters.city, filters.min_price, filters.max_price, filters.bhk]);

  const { data: citiesData } = useQuery({ queryKey: ['cities'], queryFn: metaApi.cities });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertiesApi.search(filters),
  });

  function goNext() {
    if (data?.next_cursor) {
      setCursorStack((s) => [...s, filters.cursor ?? '']);
      setFilters((f) => ({ ...f, cursor: data.next_cursor ?? undefined }));
    }
  }

  function goPrev() {
    const prev = cursorStack[cursorStack.length - 1];
    setCursorStack((s) => s.slice(0, -1));
    setFilters((f) => ({ ...f, cursor: prev || undefined }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-900">Browse properties</h1>
      <p className="mt-1 text-sm text-navy-400">{data?.items.length ?? 0} results on this page</p>

      <div className="mt-6">
        <FilterBar filters={filters} onChange={setFilters} cities={citiesData?.items ?? []} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : data?.items.length === 0 ? (
        <div className="mt-16 text-center text-navy-400">No properties match your filters yet.</div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.items.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Button variant="secondary" size="sm" disabled={cursorStack.length === 0} onClick={goPrev}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={!data?.next_cursor || isFetching} onClick={goNext}>
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
