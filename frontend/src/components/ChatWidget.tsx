import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Bot, History, Loader2, Plus, Send, Trash2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { aiChatApi } from '@/api/aiChat';
import { Button } from '@/components/Button';
import type { AiChatAction } from '@/types';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ActionLink({ action, onNavigate }: { action: AiChatAction; onNavigate: (path: string) => void }) {
  return (
    <button
      onClick={() => onNavigate(action.path)}
      className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-accent-500 hover:underline"
    >
      {action.label ?? 'Take me there'} <ArrowRight size={12} />
    </button>
  );
}

export function ChatWidget() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sessionsQuery = useQuery({
    queryKey: ['ai-sessions'],
    queryFn: aiChatApi.listSessions,
    enabled: open && !!session,
  });

  const messagesQuery = useQuery({
    queryKey: ['ai-messages', activeSessionId],
    queryFn: () => aiChatApi.messages(activeSessionId!),
    enabled: open && !!session && activeSessionId !== null,
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) => aiChatApi.send(message, activeSessionId ?? undefined),
    onMutate: (message) => setPendingUserMessage(message),
    onSuccess: (data) => {
      setPendingUserMessage(null);
      setActiveSessionId(data.session.id);
      queryClient.invalidateQueries({ queryKey: ['ai-messages', data.session.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
      if (data.message.action) {
        setTimeout(() => navigate(data.message.action!.path), 900);
      }
    },
    onError: () => setPendingUserMessage(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aiChatApi.deleteSession(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
      if (activeSessionId === id) setActiveSessionId(null);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messagesQuery.data, pendingUserMessage, sendMutation.isPending]);

  function startNewChat() {
    setActiveSessionId(null);
    setView('chat');
  }

  function openSession(id: number) {
    setActiveSessionId(id);
    setView('chat');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;
    setInput('');
    sendMutation.mutate(trimmed);
  }

  const messages = messagesQuery.data?.items ?? [];
  const showEmptyState = view === 'chat' && !pendingUserMessage && !messages.length && !messagesQuery.isLoading;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg transition-all duration-150 hover:shadow-xl hover:-translate-y-0.5"
        aria-label={open ? 'Close chat assistant' : 'Open chat assistant'}
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[560px] max-h-[calc(100vh-8rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white card-shadow">
          <div className="flex items-center justify-between bg-brand-gradient px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Bot size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">BrickBase Assistant</p>
                <p className="text-xs leading-tight text-navy-200">Ask, and I'll take you there</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView((v) => (v === 'history' ? 'chat' : 'history'))}
                className="rounded-lg p-1.5 hover:bg-white/15"
                aria-label="Chat history"
                title="Chat history"
              >
                <History size={16} />
              </button>
              <button
                onClick={startNewChat}
                className="rounded-lg p-1.5 hover:bg-white/15"
                aria-label="New chat"
                title="New chat"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-white/15"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!session ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <Bot size={28} className="text-navy-300" />
              <p className="text-sm text-navy-500">Log in to chat with the assistant and save your conversation history.</p>
              <Button size="sm" onClick={() => navigate('/login')}>
                Log in
              </Button>
            </div>
          ) : view === 'history' ? (
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
              {sessionsQuery.isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-navy-300" />
                </div>
              ) : !sessionsQuery.data?.items.length ? (
                <p className="px-2 py-10 text-center text-sm text-navy-400">No past conversations yet.</p>
              ) : (
                <div className="space-y-2">
                  {sessionsQuery.data.items.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => openSession(s.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-navy-100 p-3 text-left hover:border-navy-300"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy-900">{s.title}</p>
                        <p className="text-xs text-navy-400">{timeAgo(s.updated_at)}</p>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(s.id);
                        }}
                        className="shrink-0 rounded-lg p-1.5 text-navy-300 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${s.title}`}
                      >
                        <Trash2 size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
              {showEmptyState && (
                <p className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-navy-50 px-3.5 py-2 text-sm text-navy-700">
                  Hi{profile ? `, ${profile.full_name.split(' ')[0]}` : ''}! Tell me what you're looking for — e.g. "2BHK
                  flat for rent in Pune under 50k" — and I'll take you straight there.
                </p>
              )}

              {messagesQuery.isLoading && activeSessionId !== null && (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-navy-300" />
                </div>
              )}

              {messages.map((m) =>
                m.role === 'user' ? (
                  <p
                    key={m.id}
                    className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-brand-gradient px-3.5 py-2 text-sm text-white"
                  >
                    {m.content}
                  </p>
                ) : (
                  <div key={m.id} className="mr-auto max-w-[80%]">
                    <p className="rounded-2xl rounded-bl-sm bg-navy-50 px-3.5 py-2 text-sm text-navy-800">{m.content}</p>
                    {m.action && <ActionLink action={m.action} onNavigate={navigate} />}
                  </div>
                )
              )}

              {pendingUserMessage && (
                <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-brand-gradient px-3.5 py-2 text-sm text-white">
                  {pendingUserMessage}
                </p>
              )}

              {sendMutation.isPending && (
                <div className="mr-auto flex max-w-[80%] items-center gap-1.5 rounded-2xl rounded-bl-sm bg-navy-50 px-3.5 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-300 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-300 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-300" />
                </div>
              )}

              {sendMutation.isError && (
                <p className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-red-50 px-3.5 py-2 text-sm text-red-600">
                  Sorry, something went wrong. Please try again.
                </p>
              )}
            </div>
          )}

          {session && view === 'chat' && (
            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-navy-100 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a property..."
                disabled={sendMutation.isPending}
                className="flex-1 rounded-full border border-navy-200 px-4 py-2 text-sm outline-none focus:border-navy-400 disabled:opacity-60"
              />
              <Button type="submit" size="sm" className="!rounded-full !px-3" disabled={!input.trim() || sendMutation.isPending}>
                <Send size={15} />
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
