import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';

interface Report {
  id: number;
  reason: string;
  status: string;
  created_at: string;
  properties?: { id: number; title: string };
}

export function ReportsAdmin() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-reports'], queryFn: adminApi.reports });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminApi.resolveReport(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  const items = (data?.items ?? []) as Report[];

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Reported listings</h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !items.length ? (
        <div className="mt-8 rounded-2xl border border-dashed border-navy-200 py-16 text-center text-navy-400">
          No reports to review.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-xl border border-navy-100 p-4">
              <p className="font-semibold text-navy-900">{r.properties?.title ?? `Property #${r.id}`}</p>
              <p className="mt-1 text-sm text-navy-600">{r.reason}</p>
              <p className="mt-1 text-xs uppercase text-navy-400">{r.status}</p>
              {r.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => resolveMutation.mutate({ id: r.id, status: 'reviewed' })}>
                    Mark reviewed
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => resolveMutation.mutate({ id: r.id, status: 'dismissed' })}>
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
