-- AI teammates (Grok Bot / Hermes workers) live on team_members.
-- They never store MCP bearer secrets — only token id + display label.

alter table if exists team_members alter column client_id drop not null;

alter table if exists team_members drop constraint if exists team_members_role_check;
alter table if exists team_members add constraint team_members_role_check check (role in (
  'CHANNEL_MANAGER',
  'SHORT_FORM_EDITOR',
  'LONG_FORM_EDITOR',
  'THUMBNAIL_DESIGNER',
  'AUTOMATION'
));

alter table if exists team_members add column if not exists is_automation boolean not null default false;
alter table if exists team_members add column if not exists automation_kind text;
alter table if exists team_members add column if not exists bot_label text;
alter table if exists team_members add column if not exists bot_role_key text;
alter table if exists team_members add column if not exists mcp_token_id text;
alter table if exists team_members add column if not exists mcp_token_label text;
alter table if exists team_members add column if not exists runtime_hint text;
alter table if exists team_members add column if not exists is_active boolean not null default true;
alter table if exists team_members add column if not exists notes text;
alter table if exists team_members add column if not exists assigned_client_ids text;

alter table if exists team_members drop constraint if exists team_members_automation_kind_check;
alter table if exists team_members add constraint team_members_automation_kind_check check (
  automation_kind is null or automation_kind in ('GROK_BOT', 'HERMES_WORKER', 'OTHER')
);
alter table if exists team_members drop constraint if exists team_members_runtime_hint_check;
alter table if exists team_members add constraint team_members_runtime_hint_check check (
  runtime_hint is null or runtime_hint in ('HERMES', 'GROK_BOT', 'AUTO')
);

create index if not exists team_members_automation_idx
  on team_members (is_automation)
  where deleted_at is null;
