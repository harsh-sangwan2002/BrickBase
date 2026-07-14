import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BellPlus, CheckCircle2 } from 'lucide-react';
import { propertiesApi, type SearchFilters } from '@/api/properties';
import { metaApi } from '@/api/meta';
import { savedSearchesApi } from '@/api/savedSearches';
import { FilterBar } from '@/features/properties/FilterBar';
import { PropertyCard } from '@/features/properties/PropertyCard';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';

export function Search() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
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

  function resetFilters() {
    setFilters({ sort: 'newest', limit: 12 });
    setCursorStack([]);
  }

  const saveSearchMutation = useMutation({
    mutationFn: () => {
      const { sort: _sort, limit: _limit, cursor: _cursor, ...savedFilters } = filters;
      void _sort;
      void _limit;
      void _cursor;
      return savedSearchesApi.create(savedFilters);
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Browse properties</h1>
          <p className="mt-1 text-sm text-navy-400">{data?.items.length ?? 0} results on this page</p>
        </div>
        {session && (
          <div className="flex items-center gap-2">
            {saveSearchMutation.isSuccess ? (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 size={15} /> Search saved
              </span>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => saveSearchMutation.mutate()} disabled={saveSearchMutation.isPending}>
                <BellPlus size={14} /> Save this search
              </Button>
            )}
            <Link to="/saved-searches" className="text-xs font-semibold text-navy-500 hover:underline">
              Manage saved searches
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6">
        <FilterBar filters={filters} onChange={setFilters} onReset={resetFilters} cities={citiesData?.items ?? []} />
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
