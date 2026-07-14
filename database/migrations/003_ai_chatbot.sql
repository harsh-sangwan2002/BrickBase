-- ============================================================
-- Migration 003: AI chatbot (assistant conversations + history)
-- Run this once in the Supabase SQL editor against a DB that already has
-- database/schema.sql and migrations 002 applied.
-- ============================================================

create table ai_chat_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_ai_chat_sessions_user on ai_chat_sessions(user_id, updated_at desc);

create table ai_chat_messages (
  id bigint generated always as identity primary key,
  session_id bigint not null references ai_chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  -- Set when the assistant's reply maps to an in-app page, e.g. {"type":"navigate","path":"/search?city=Pune","label":"View results"}.
  action jsonb,
  created_at timestamptz not null default now()
);
create index idx_ai_chat_messages_session on ai_chat_messages(session_id, created_at);

alter table ai_chat_sessions enable row level security;
alter table ai_chat_messages enable row level security;

create policy "Users manage own chat sessions" on ai_chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users view own chat messages" on ai_chat_messages
  for select using (
    exists (select 1 from ai_chat_sessions s where s.id = ai_chat_messages.session_id and s.user_id = auth.uid())
  );

create policy "Users insert own chat messages" on ai_chat_messages
  for insert with check (
    exists (select 1 from ai_chat_sessions s where s.id = ai_chat_messages.session_id and s.user_id = auth.uid())
  );
