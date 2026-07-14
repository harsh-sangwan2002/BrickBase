import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { conversationsApi } from '@/api/conversations';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';
import type { Message } from '@/types';
import clsx from 'clsx';

export function MessageThread() {
  const { id } = useParams();
  const conversationId = Number(id);
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationsApi.messages(conversationId),
    enabled: !Number.isNaN(conversationId),
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => conversationsApi.send(conversationId, body),
    onSuccess: () => setDraft(''),
  });

  // Realtime: new messages in this conversation (from either participant) land instantly.
  useEffect(() => {
    if (Number.isNaN(conversationId)) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          queryClient.setQueryData<{ items: Message[] } | undefined>(['messages', conversationId], (prev) => {
            if (!prev) return prev;
            if (prev.items.some((m) => m.id === (payload.new as Message).id)) return prev;
            return { items: [...prev.items, payload.new as Message] };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.items.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMutation.mutate(draft.trim());
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-6 sm:px-6">
      <h1 className="text-lg font-bold text-navy-900">Conversation</h1>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-navy-100 p-4 scrollbar-thin">
        {data?.items.map((m) => {
          const mine = m.sender_id === profile?.id;
          return (
            <div key={m.id} className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={clsx(
                  'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                  mine ? 'btn-gradient text-white' : 'bg-navy-50 text-navy-800'
                )}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-navy-100 px-3 py-2.5 text-sm focus:border-navy-400 focus:outline-none"
        />
        <Button type="submit" disabled={sendMutation.isPending || !draft.trim()}>
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
}
