import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { conversationsApi } from '@/api/conversations';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/Spinner';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function Messages() {
  const { profile } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['conversations'], queryFn: conversationsApi.list });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-900">Messages</h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !data?.items.length ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-navy-200 py-16 text-center text-navy-400">
          <MessageCircle size={28} />
          <p>No conversations yet.</p>
          <p className="text-sm">Enquiries you send (or receive, as an owner/agent) start a conversation here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {data.items.map((c) => {
            const other = c.buyer_id === profile?.id ? c.owner : c.buyer;
            return (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className="flex items-center gap-3 rounded-xl border border-navy-100 p-4 hover:border-navy-300"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
                  {other?.full_name?.[0]?.toUpperCase() ?? '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy-900">{other?.full_name ?? 'Unknown user'}</p>
                  {c.properties && <p className="truncate text-sm text-navy-400">Re: {c.properties.title}</p>}
                </div>
                <span className="shrink-0 text-xs text-navy-400">{timeAgo(c.last_message_at)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
