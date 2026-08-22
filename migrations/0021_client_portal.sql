-- Client portal (lite): brand stakeholder identity, isolated from staff auth.
-- Secrets (password/invite/session hashes) never leave this table set.

create table if not exists client_portal_users (
  id              text primary key,
  workspace_id    text not null default 'default',
  client_id       text not null,
  email           text not null,
  name            text,
  status          text not null,
  password_hash   text,
  invite_hash     text,
  invite_expires  timestamptz,
  last_login_at   timestamptz,
  can_approve     text not null default '1',
  created_at      timestamptz not null default now(),
  created_by      text
);

create unique index if not exists client_portal_users_email_uidx
  on client_portal_users (workspace_id, email);
create index if not exists client_portal_users_client_idx
  on client_portal_users (client_id, status);

create table if not exists client_portal_sessions (
  id           text primary key,
  user_id      text,
  client_id    text not null,
  token_hash   text not null,
  preview      text not null default '0',
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

create unique index if not exists client_portal_sessions_token_uidx
  on client_portal_sessions (token_hash);
create index if not exists client_portal_sessions_user_idx
  on client_portal_sessions (user_id);
create index if not exists client_portal_sessions_expiry_idx
  on client_portal_sessions (expires_at);

alter table if exists public.client_portal_users enable row level security;
alter table if exists public.client_portal_sessions enable row level security;
