import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { propertiesApi } from '@/api/properties';
import { Spinner } from '@/components/Spinner';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { formatPrice, coverImage } from '@/utils/format';
import type { PropertyStatus } from '@/types';

const STATUS_TONE: Record<PropertyStatus, 'navy' | 'green' | 'red' | 'amber'> = {
  draft: 'navy',
  pending_review: 'amber',
  active: 'green',
  rejected: 'red',
  sold: 'navy',
  rented: 'navy',
  inactive: 'navy',
};

export function MyListings() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['my-listings'], queryFn: propertiesApi.mine });

  const submitMutation = useMutation({
    mutationFn: (id: number) => propertiesApi.submit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => propertiesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy-900">My Listings</h1>
        <Link to="/dashboard/listings/new">
          <Button size="sm">
            <Plus size={14} /> New listing
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !data?.items.length ? (
        <div className="mt-8 rounded-2xl border border-dashed border-navy-200 py-16 text-center text-navy-400">
          You haven't created any listings yet.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.items.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-navy-100 p-4">
              <img src={coverImage(p.property_images)} className="h-16 w-24 rounded-lg object-cover" alt={p.title} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-navy-900">{p.title}</p>
                  <Badge tone={STATUS_TONE[p.status]}>{p.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-navy-400">{p.city}</p>
                <p className="text-sm font-bold text-gradient">{formatPrice(p.price)}</p>
                {p.status === 'rejected' && p.rejection_reason && (
                  <p className="mt-1 text-xs text-red-600">Reason: {p.rejection_reason}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link to={`/dashboard/listings/${p.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                </Link>
                {p.status === 'draft' && (
                  <Button size="sm" onClick={() => submitMutation.mutate(p.id)}>
                    Submit for review
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  disabled={removeMutation.isPending}
                  onClick={() => {
                    if (confirm(`Remove "${p.title}"? It will no longer be visible to buyers.`)) {
                      removeMutation.mutate(p.id);
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
