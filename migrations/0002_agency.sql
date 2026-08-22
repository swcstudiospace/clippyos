-- Agency Admin workspace schema.
-- Empty by design: no seed or placeholder rows.
--
-- Production data lives in the connected Supabase project (see
-- supabase/schema.sql). This file still applies to the local preview store
-- used for workspace sign-in sessions.
--
-- Security (RLS/FLS analogue — enforced in server functions, not the DB owner):
--   * Every server function uses authMiddleware. Unauthenticated callers get 401.
--   * Workspace entities are shared among authenticated operators (agency-wide).
--   * app_settings.value is admin-only (FLS). Clients never receive raw secrets.
--   * Soft-deleted rows (deleted_at IS NOT NULL) are excluded from default reads.
--   * created_by stores the verified user id of the inserting operator.

create table if not exists clients (
  id                   text primary key,
  name                 text not null,
  channel_url          text,
  channel_thumbnail    text,
  channel_summary      text,
  offers               text,
  content_strategy     text,
  plan_type            text not null check (plan_type in ('TEAM_ONLY', 'PERSONAL_INVOLVED', 'CUSTOM')),
  custom_plan_label    text,
  setup_fee            numeric(12, 2) not null default 30000,
  monthly_fee          numeric(12, 2),
  start_date           date,
  status               text not null default 'ACTIVE' check (status in ('ACTIVE', 'CHURNED')),
  discord_server_id    text,
  google_account_email text,
  notes                text,
  suggested_titles     text,
  suggested_ideas      text,
  suggested_titles_at  timestamptz,
  suggested_ideas_at   timestamptz,
  onboarding_checklist text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           text,
  deleted_at           timestamptz
);

create index if not exists clients_status_idx on clients (status);
create index if not exists clients_start_date_idx on clients (start_date);
create index if not exists clients_active_idx on clients (id) where deleted_at is null;

create table if not exists payments (
  id          text primary key,
  client_id   text not null references clients (id) on delete restrict,
  amount      numeric(12, 2) not null,
  type        text not null check (type in ('SETUP', 'MONTHLY')),
  due_date    date not null,
  paid_date   date,
  status      text not null check (status in ('PENDING', 'PAID', 'OVERDUE')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create index if not exists payments_client_id_idx on payments (client_id);
create index if not exists payments_status_idx on payments (status);
create index if not exists payments_due_date_idx on payments (due_date);

create table if not exists team_members (
  id          text primary key,
  client_id   text not null references clients (id) on delete restrict,
  role        text not null check (role in (
                'CHANNEL_MANAGER',
                'SHORT_FORM_EDITOR',
                'LONG_FORM_EDITOR',
                'THUMBNAIL_DESIGNER'
              )),
  name        text not null,
  cost        numeric(12, 2),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text,
  deleted_at  timestamptz
);

create index if not exists team_members_client_id_idx on team_members (client_id);
create index if not exists team_members_active_idx on team_members (id) where deleted_at is null;

create table if not exists client_progress (
  id          text primary key,
  client_id   text not null references clients (id) on delete restrict,
  stage       text not null check (stage in (
                'WAITING_FOR_FOOTAGE',
                'FILMING',
                'EDITING_SHORT_FORM',
                'EDITING_LONG_FORM',
                'DESIGNING_THUMBNAIL',
                'IN_REVIEW',
                'UPLOADING',
                'PUBLISHED'
              )),
  source      text not null check (source in ('MANUAL', 'AI_DISCORD')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create index if not exists client_progress_client_id_idx on client_progress (client_id);
create index if not exists client_progress_stage_idx on client_progress (stage);
create index if not exists client_progress_updated_at_idx on client_progress (updated_at);

create table if not exists analytics_snapshots (
  id               text primary key,
  client_id        text not null references clients (id) on delete restrict,
  date             date not null,
  views            numeric,
  subscribers      numeric,
  watch_hours      numeric,
  impressions_ctr  numeric,
  top_videos       jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       text
);

create index if not exists analytics_snapshots_client_id_idx on analytics_snapshots (client_id);
create index if not exists analytics_snapshots_date_idx on analytics_snapshots (date);
create unique index if not exists analytics_snapshots_client_date_uidx on analytics_snapshots (client_id, date);


create table if not exists ideation_threads (
  id          text primary key,
  title       text not null,
  client_id   text references clients (id) on delete set null,
  status      text not null default 'ACTIVE' check (status in ('ACTIVE', 'ARCHIVED')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create index if not exists ideation_threads_client_id_idx on ideation_threads (client_id);
create index if not exists ideation_threads_status_idx on ideation_threads (status);

create table if not exists ideation_messages (
  id          text primary key,
  thread_id   text not null references ideation_threads (id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  timestamp   timestamptz not null,
  metadata    jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create index if not exists ideation_messages_thread_id_idx on ideation_messages (thread_id);
create index if not exists ideation_messages_timestamp_idx on ideation_messages (timestamp);

create table if not exists thumbnail_sessions (
  id          text primary key,
  client_id   text not null references clients (id) on delete restrict,
  title       text not null,
  status      text not null default 'ACTIVE' check (status in ('ACTIVE', 'ARCHIVED')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create index if not exists thumbnail_sessions_client_id_idx on thumbnail_sessions (client_id);
create index if not exists thumbnail_sessions_status_idx on thumbnail_sessions (status);

create table if not exists thumbnail_messages (
  id          text primary key,
  session_id  text not null references thumbnail_sessions (id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  image_url   text,
  rating      integer check (rating is null or (rating >= 1 and rating <= 5)),
  timestamp   timestamptz not null,
  metadata    jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create index if not exists thumbnail_messages_session_id_idx on thumbnail_messages (session_id);
create index if not exists thumbnail_messages_timestamp_idx on thumbnail_messages (timestamp);

create table if not exists knowledge_entries (
  id                 text primary key,
  scope              text not null check (scope in (
                       'THUMBNAIL_GLOBAL',
                       'VIDEO_GLOBAL',
                       'CLIENT_TITLES',
                       'CLIENT_IDEAS'
                     )),
  client_id          text references clients (id) on delete set null,
  user_input         text not null,
  learned_principle  text not null,
  status             text not null default 'ACTIVE' check (status in ('ACTIVE', 'DEPRECATED')),
  tags               jsonb,
  timestamp          timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         text,
  deleted_at         timestamptz
);

create index if not exists knowledge_entries_client_id_idx on knowledge_entries (client_id);
create index if not exists knowledge_entries_scope_idx on knowledge_entries (scope);
create index if not exists knowledge_entries_status_idx on knowledge_entries (status);
create index if not exists knowledge_entries_active_idx on knowledge_entries (id) where deleted_at is null;

create table if not exists leads (
  id                 text primary key,
  name               text not null,
  channel_url        text,
  notes              text,
  status             text not null check (status in (
                       'TO_CONTACT',
                       'CONTACTED',
                       'IN_TALKS',
                       'CLOSED',
                       'LOST'
                     )),
  upfront_cash       numeric(12, 2),
  monthly_recurring  numeric(12, 2),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         text,
  deleted_at         timestamptz
);

create index if not exists leads_status_idx on leads (status);
create index if not exists leads_active_idx on leads (id) where deleted_at is null;

-- Secrets store. value is field-level protected: admin role only.
create table if not exists app_settings (
  id          text primary key,
  key         text not null unique,
  value       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create unique index if not exists app_settings_key_idx on app_settings (key);

-- Operator roles for admin-gated surfaces (AppSetting FLS, destructive deletes).
create table if not exists app_profiles (
  user_id     text primary key,
  role        text not null default 'member' check (role in ('admin', 'member')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
