import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, BellOff, Search as SearchIcon, Trash2 } from 'lucide-react';
import { savedSearchesApi } from '@/api/savedSearches';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';

function filtersToSummary(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  if (filters.q) parts.push(`"${filters.q}"`);
  if (filters.property_type) parts.push(String(filters.property_type));
  if (filters.listing_type) parts.push(String(filters.listing_type));
  if (filters.city) parts.push(String(filters.city));
  if (filters.min_price || filters.max_price) {
    parts.push(`₹${filters.min_price ?? '0'}–${filters.max_price ?? '∞'}`);
  }
  if (filters.bhk) parts.push(`${filters.bhk} BHK`);
  return parts.length ? parts.join(' · ') : 'All properties';
}

function filtersToSearchLink(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `/search?${qs}` : '/search';
}

export function SavedSearches() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['saved-searches'], queryFn: savedSearchesApi.list });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => savedSearchesApi.setAlertEnabled(id, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => savedSearchesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-900">Saved searches</h1>
      <p className="mt-1 text-sm text-navy-400">
        Get notified when new listings match. Alerts are checked every 15 minutes.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !data?.items.length ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-navy-200 py-16 text-center text-navy-400">
          <SearchIcon size={28} />
          <p>No saved searches yet.</p>
          <Link to="/search" className="text-sm font-semibold text-navy-600 hover:underline">
            Browse and save a search
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {data.items.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-navy-100 p-4">
              <div className="min-w-0 flex-1">
                <Link to={filtersToSearchLink(s.filters)} className="font-medium text-navy-900 hover:underline">
                  {filtersToSummary(s.filters)}
                </Link>
                <p className="text-xs text-navy-400">Saved {new Date(s.created_at).toLocaleDateString()}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleMutation.mutate({ id: s.id, enabled: !s.alert_enabled })}
                title={s.alert_enabled ? 'Alerts on' : 'Alerts off'}
              >
                {s.alert_enabled ? <Bell size={15} className="text-navy-600" /> : <BellOff size={15} className="text-navy-300" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeMutation.mutate(s.id)}>
                <Trash2 size={15} className="text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
