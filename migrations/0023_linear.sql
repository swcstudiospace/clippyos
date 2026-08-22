-- Linear issue bridge: agency entities ↔ Linear issues, plus a retry queue.
-- Secrets never stored here. Empty by design.

create table if not exists linear_links (
  id                   text primary key,
  workspace_id         text not null default 'default',
  agency_entity_type   text not null,
  agency_entity_id     text not null,
  linear_issue_id      text not null,
  linear_identifier    text,
  linear_url           text,
  last_state_id        text,
  last_synced_at       timestamptz,
  created_at           timestamptz not null default now(),
  created_by           text
);
create unique index if not exists linear_links_entity_uidx
  on linear_links (agency_entity_type, agency_entity_id);
create index if not exists linear_links_issue_idx on linear_links (linear_issue_id);

create table if not exists linear_sync_queue (
  id               text primary key,
  kind             text not null,
  payload          text not null default '{}',
  attempts         integer not null default 0,
  next_attempt_at  timestamptz not null default now(),
  last_error       text,
  created_at       timestamptz not null default now()
);
create index if not exists linear_sync_queue_due_idx
  on linear_sync_queue (next_attempt_at);
