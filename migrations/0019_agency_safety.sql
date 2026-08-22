-- Agency safety: approvals, in-app notifications, append-only audit.
-- Empty by design. Secrets never stored in metadata.

create table if not exists approval_requests (
  id             text primary key,
  workspace_id   text not null default 'default',
  client_id      text,
  type           text not null,
  resource_type  text not null,
  resource_id    text not null,
  status         text not null,
  title          text not null,
  summary        text,
  payload        text not null default '{}',
  requested_by   text not null,
  assigned_to    text,
  reviewed_by    text,
  reviewed_at    timestamptz,
  decision_note  text,
  expires_at     timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists approval_requests_status_idx on approval_requests (status, created_at desc);
create index if not exists approval_requests_client_idx on approval_requests (client_id);
create index if not exists approval_requests_resource_idx on approval_requests (resource_type, resource_id);

create table if not exists notifications (
  id            text primary key,
  workspace_id  text not null default 'default',
  user_id       text not null,
  category      text not null,
  severity      text not null,
  title         text not null,
  body          text not null,
  href          text,
  entity_type   text,
  entity_id     text,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_user_idx on notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on notifications (user_id) where read_at is null;

create table if not exists audit_events (
  id             text primary key,
  workspace_id   text not null default 'default',
  at             timestamptz not null default now(),
  actor_user_id  text,
  actor_type     text not null,
  action         text not null,
  entity_type    text,
  entity_id      text,
  client_id      text,
  summary        text not null,
  metadata       text not null default '{}',
  request_id     text,
  job_id         text
);

create index if not exists audit_events_at_idx on audit_events (at desc);
create index if not exists audit_events_action_idx on audit_events (action);
create index if not exists audit_events_client_idx on audit_events (client_id);
create index if not exists audit_events_actor_idx on audit_events (actor_user_id);

create table if not exists notification_preferences (
  user_id           text primary key,
  muted_categories  text not null default '[]',
  email_enabled     text not null default '0',
  updated_at        timestamptz not null default now()
);
