-- Professional Telegram + WhatsApp liaison inbox. Never stored on the Windows VM.

create table if not exists channel_threads (
  id               text primary key,
  client_id        text,
  provider         text not null check (provider in ('telegram', 'whatsapp')),
  external_id      text not null,
  contact_name     text not null,
  contact_handle   text,
  last_message_at  timestamptz,
  last_preview     text,
  created_at       timestamptz not null default now()
);

create unique index if not exists channel_threads_provider_ext_uidx
  on channel_threads (provider, external_id);
create index if not exists channel_threads_last_idx
  on channel_threads (last_message_at desc);

create table if not exists channel_messages (
  id           text primary key,
  thread_id    text not null,
  direction    text not null check (direction in ('in', 'out')),
  body         text not null,
  status       text not null check (status in ('queued', 'sent', 'delivered', 'failed')),
  external_id  text,
  created_at   timestamptz not null default now(),
  created_by   text
);

create index if not exists channel_messages_thread_idx
  on channel_messages (thread_id, created_at);
