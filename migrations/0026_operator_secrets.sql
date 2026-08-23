-- Per-operator API isolation.
-- Workspace keys stay in app_settings (owners). Members store their own in
-- operator_secrets unless inherit_workspace_apis is set when the login is created.

alter table app_profiles
  add column if not exists inherit_workspace_apis boolean not null default false;

create table if not exists operator_secrets (
  user_id     text not null,
  key         text not null,
  value       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists operator_secrets_user_idx on operator_secrets (user_id);
