-- Programmatic autonomy: API keys, audit log, webhook deliveries, jobs.
-- Also allow ClientProgress.source = AGENT (Hermes / API / inbound webhook).

alter table client_progress drop constraint if exists client_progress_source_check;
alter table client_progress add constraint client_progress_source_check
  check (source in ('MANUAL', 'AI_DISCORD', 'AGENT'));

create table if not exists api_keys (
  id           text primary key,
  name         text not null,
  key_hash     text not null,
  key_prefix   text not null,
  last4        text not null,
  scopes       text not null,
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   text
);

create unique index if not exists api_keys_hash_uidx on api_keys (key_hash);
create index if not exists api_keys_revoked_idx on api_keys (revoked_at);

create table if not exists agent_audit_log (
  id           text primary key,
  request_id   text not null,
  source       text not null check (source in ('api', 'mcp', 'webhook')),
  actor_key_id text,
  actor_label  text,
  action       text not null,
  entity_type  text,
  entity_id    text,
  result       text not null check (result in ('ok', 'error', 'denied')),
  error_code   text,
  created_at   timestamptz not null default now()
);

create index if not exists agent_audit_log_created_idx on agent_audit_log (created_at desc);
create index if not exists agent_audit_log_source_idx on agent_audit_log (source);

alter table agent_audit_log add column if not exists playbook_id text;
alter table agent_audit_log add column if not exists run_id text;
create index if not exists agent_audit_log_playbook_idx on agent_audit_log (playbook_id);

create table if not exists webhook_deliveries (
  id              text primary key,
  event_id        text not null,
  event_type      text not null,
  payload         text not null,
  destination     text not null,
  status          text not null check (status in ('pending', 'delivered', 'failed')),
  attempts        integer not null default 0,
  last_error      text,
  last_attempt_at timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists webhook_deliveries_event_idx on webhook_deliveries (event_id);
create index if not exists webhook_deliveries_created_idx on webhook_deliveries (created_at desc);

create table if not exists agent_jobs (
  id          text primary key,
  kind        text not null,
  client_id   text,
  status      text not null check (status in ('queued', 'running', 'completed', 'error')),
  result      text,
  error_code  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists agent_idempotency (
  id          text primary key,
  body        text not null,
  created_at  timestamptz not null default now()
);
