import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '@/api/admin';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';
import { formatPrice, coverImage } from '@/utils/format';

export function AdminModeration() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['pending-properties'], queryFn: adminApi.pendingProperties });
  const [reasonDraft, setReasonDraft] = useState<Record<number, string>>({});

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveProperty(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-properties'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.rejectProperty(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-properties'] }),
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Listing moderation</h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !data?.items.length ? (
        <div className="mt-8 rounded-2xl border border-dashed border-navy-200 py-16 text-center text-navy-400">
          No listings pending review.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.items.map((p) => (
            <div key={p.id} className="rounded-xl border border-navy-100 p-4">
              <div className="flex gap-4">
                <img src={coverImage(p.property_images)} className="h-20 w-28 rounded-lg object-cover" alt={p.title} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy-900">{p.title}</p>
                  <p className="text-sm text-navy-400">{p.city}</p>
                  <p className="text-sm font-bold text-gradient">{formatPrice(p.price)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => approveMutation.mutate(p.id)}>
                  Approve
                </Button>
                <input
                  placeholder="Rejection reason"
                  value={reasonDraft[p.id] ?? ''}
                  onChange={(e) => setReasonDraft((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="min-w-[200px] flex-1 rounded-lg border border-navy-100 px-3 py-1.5 text-sm"
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => rejectMutation.mutate({ id: p.id, reason: reasonDraft[p.id] ?? '' })}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
