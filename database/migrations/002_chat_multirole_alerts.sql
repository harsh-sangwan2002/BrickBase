-- ============================================================
-- Migration 002: in-app chat, saved-search alerts
-- Run this once in the Supabase SQL editor against a DB that already has
-- database/schema.sql applied.
-- ============================================================

-- ============================================================
-- IN-APP CHAT
-- ============================================================
create table conversations (
  id bigint generated always as identity primary key,
  property_id bigint references properties(id) on delete set null,
  buyer_id uuid not null references profiles(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (property_id, buyer_id, owner_id)
);
create index idx_conversations_buyer on conversations(buyer_id, last_message_at desc);
create index idx_conversations_owner on conversations(owner_id, last_message_at desc);

create table messages (
  id bigint generated always as identity primary key,
  conversation_id bigint not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_messages_conversation on messages(conversation_id, created_at);

alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Participants can view their conversations" on conversations
  for select using (auth.uid() = buyer_id or auth.uid() = owner_id);

create policy "Participants can view messages" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

create policy "Participants can send messages" on messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- Enables realtime subscriptions on new messages (frontend listens per conversation_id).
alter publication supabase_realtime add table messages;

-- ============================================================
-- SAVED-SEARCH ALERTS
-- ============================================================
alter table saved_searches add column if not exists last_notified_at timestamptz not null default now();
