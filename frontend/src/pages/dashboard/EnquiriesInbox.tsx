import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enquiriesApi } from '@/api/enquiries';
import { Spinner } from '@/components/Spinner';
import { Badge } from '@/components/Badge';
import type { EnquiryStatus } from '@/types';

const STATUS_TONE: Record<EnquiryStatus, 'navy' | 'green' | 'red' | 'amber'> = {
  new: 'amber',
  contacted: 'navy',
  closed: 'green',
  spam: 'red',
};

export function EnquiriesInbox() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['enquiries'], queryFn: enquiriesApi.list });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => enquiriesApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enquiries'] }),
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Enquiries</h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !data?.items.length ? (
        <div className="mt-8 rounded-2xl border border-dashed border-navy-200 py-16 text-center text-navy-400">
          No enquiries yet.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {data.items.map((e) => (
            <div key={e.id} className="rounded-xl border border-navy-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-900">{e.name}</p>
                  <p className="text-xs text-navy-400">
                    {e.email} · {e.phone}
                  </p>
                  {e.properties && <p className="mt-1 text-xs text-navy-500">Property: {e.properties.title}</p>}
                </div>
                <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-navy-600">{e.message}</p>
              <div className="mt-3 flex gap-2">
                {(['contacted', 'closed', 'spam'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => statusMutation.mutate({ id: e.id, status })}
                    className="rounded-full border border-navy-100 px-3 py-1 text-xs font-medium text-navy-500 hover:border-navy-300"
                  >
                    Mark {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
