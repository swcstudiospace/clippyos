-- Agency Admin workspace schema for Supabase.
-- Paste into the Supabase SQL editor (SQL → New query) and run.
-- Safe to re-run: CREATE IF NOT EXISTS + ENABLE ROW LEVEL SECURITY.
--
-- Empty by design: no seed or placeholder rows.
--
-- Access model:
--   * Workspace sign-in (Google / X / email) is verified in server functions.
--   * Those functions talk to Postgres with the project's secret API key, which
--     bypasses RLS.
--   * RLS is enabled with no anon / authenticated policies so the public
--     publishable key cannot read or write fees, payments, or other agency data.

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
  source      text not null check (source in ('MANUAL', 'AI_DISCORD', 'AGENT')),
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
                       'CLIENT_IDEAS',
                       'CLIENT_CLIPPING'
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

create table if not exists app_settings (
  id          text primary key,
  key         text not null unique,
  value       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text
);

create unique index if not exists app_settings_key_idx on app_settings (key);

create table if not exists app_profiles (
  user_id     text primary key,
  role        text not null default 'member' check (role in ('admin', 'member')),
  status      text not null default 'ACTIVE' check (status in ('ACTIVE', 'REVOKED')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'clients',
    'payments',
    'team_members',
    'client_progress',
    'analytics_snapshots',
    'ideation_threads',
    'ideation_messages',
    'thumbnail_sessions',
    'thumbnail_messages',
    'knowledge_entries',
    'leads',
    'app_settings',
    'app_profiles',
    'api_keys',
    'agent_audit_log',
    'webhook_deliveries',
    'agent_jobs',
    'agent_idempotency',
    'social_posts',
    'skills',
    'skill_runs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

alter table if exists public.clients add column if not exists suggested_titles text;
alter table if exists public.clients add column if not exists suggested_ideas text;
alter table if exists public.clients add column if not exists suggested_titles_at timestamptz;
alter table if exists public.clients add column if not exists suggested_ideas_at timestamptz;

alter table if exists public.client_progress drop constraint if exists client_progress_source_check;
alter table if exists public.client_progress add constraint client_progress_source_check
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
  playbook_id  text,
  run_id       text,
  created_at   timestamptz not null default now()
);

create index if not exists agent_audit_log_created_idx on agent_audit_log (created_at desc);
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

create table if not exists social_posts (
  id               text primary key,
  client_id        text not null references clients (id) on delete restrict,
  platform         text not null check (platform in ('instagram', 'x', 'tiktok', 'youtube')),
  status           text not null check (status in (
                     'queued',
                     'running',
                     'needs_attention',
                     'succeeded',
                     'failed'
                   )),
  content_ref      text,
  media_url        text,
  caption          text,
  external_url     text,
  screenshot_url   text,
  source           text not null default 'DAYTONA',
  attention_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       text
);

create index if not exists social_posts_client_idx on social_posts (client_id);
create index if not exists social_posts_created_idx on social_posts (created_at desc);
create index if not exists social_posts_status_idx on social_posts (status);

alter table social_posts add column if not exists job_id text;
alter table social_posts add column if not exists rail text;
alter table social_posts add column if not exists external_post_id text;
alter table social_posts add column if not exists tiktok_post_mode text;
alter table social_posts add column if not exists ig_container_id text;
alter table social_posts add column if not exists upload_percent integer;
alter table social_posts add column if not exists upload_phase text;
alter table social_posts add column if not exists resumable_session_id text;

create table if not exists social_upload_sessions (
  id                   text primary key,
  job_id               text,
  post_id              text,
  platform             text not null,
  source_url           text not null,
  total_bytes          integer not null default 0,
  chunk_size_bytes     integer not null default 0,
  mime_type            text,
  external_session_id  text,
  external_upload_url  text,
  next_segment_index   integer not null default 0,
  bytes_uploaded       integer not null default 0,
  status               text not null,
  last_error           text,
  attempt_count        integer not null default 0,
  platform_extras      text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists social_jobs (
  id               text primary key,
  client_id        text not null,
  asset_id         text,
  caption          text,
  mode             text not null default 'draft',
  status           text not null,
  platforms        text not null,
  idempotency_key  text,
  error_code       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       text
);

alter table social_jobs add column if not exists preferred_rail text;
alter table social_jobs add column if not exists fallback_to_browser text;
alter table social_jobs add column if not exists options text;

create index if not exists social_jobs_client_idx on social_jobs (client_id);
create index if not exists social_jobs_created_idx on social_jobs (created_at desc);

alter table if exists public.social_posts enable row level security;

create table if not exists skills (
  id              text primary key,
  slug            text not null unique,
  name            text not null,
  description     text not null,
  version         text not null,
  tags            text not null default '[]',
  category        text,
  provenance      text not null,
  status          text not null,
  permissions     text not null default '[]',
  runtime_json    text not null default '{}',
  inputs_schema   text,
  outputs_schema  text,
  skill_md        text not null,
  scripts_json    text not null default '{}',
  enabled         boolean not null default true,
  parent_id       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      text
);

create index if not exists skills_status_idx on skills (status);
create index if not exists skills_slug_idx on skills (slug);

create table if not exists skill_runs (
  id           text primary key,
  skill_id     text not null,
  version      text not null,
  status       text not null,
  actor        text,
  args_json    text,
  stdout       text,
  stderr       text,
  exit_code    integer,
  duration_ms  integer,
  error_code   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists skill_runs_skill_idx on skill_runs (skill_id, created_at desc);

alter table skills add column if not exists refs_json text not null default '{}';
alter table skills add column if not exists templates_json text not null default '{}';
alter table skill_runs add column if not exists artifacts_json text;

create table if not exists skill_versions (
  id             text primary key,
  skill_id       text not null,
  version        text not null,
  skill_md       text not null,
  scripts_json   text not null default '{}',
  refs_json      text not null default '{}',
  templates_json text not null default '{}',
  created_at     timestamptz not null default now(),
  created_by     text
);
create index if not exists skill_versions_skill_idx on skill_versions (skill_id, created_at desc);

create table if not exists agent_runs (
  id               text primary key,
  goal             text not null,
  preset           text not null,
  client_id        text,
  skill_id         text,
  status           text not null,
  model            text not null default 'grok-4.6',
  provider         text,
  summary          text,
  error_code       text,
  iteration_count  integer not null default 0,
  plan_json        text,
  outputs_json     text,
  idempotency_key  text,
  cancel_requested boolean not null default false,
  deadline_at      timestamptz,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       text
);
create index if not exists agent_runs_started_idx on agent_runs (started_at desc);
create index if not exists agent_runs_idempotency_idx on agent_runs (idempotency_key);

create table if not exists agent_iterations (
  id                   text primary key,
  run_id               text not null,
  idx                  integer not null,
  kind                 text not null,
  tool_name            text,
  args_summary         text,
  result_summary       text,
  screenshot_ref       text,
  screenshot_data_url  text,
  step_id              text,
  duration_ms          integer,
  status               text not null default 'ok',
  created_at           timestamptz not null default now()
);
create index if not exists agent_iterations_run_idx on agent_iterations (run_id, idx);

alter table if exists public.skills enable row level security;
alter table if exists public.skill_runs enable row level security;
alter table if exists public.skill_versions enable row level security;
alter table if exists public.agent_runs enable row level security;
alter table if exists public.agent_iterations enable row level security;

alter table clients add column if not exists onboarding_checklist text;

create table if not exists workspace_subscriptions (
  id                       text primary key,
  status                   text not null default 'none',
  plan_key                 text,
  price_id                 text,
  external_customer_id     text,
  external_subscription_id text,
  external_checkout_id     text,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  last_invoice_status      text,
  last_invoice_at          timestamptz,
  mrr                      numeric(12, 2),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table if not exists billing_invoices (
  id            text primary key,
  external_id   text unique,
  amount        numeric(12, 2) not null default 0,
  currency      text not null default 'USD',
  status        text not null,
  hosted_url    text,
  period_start  timestamptz,
  period_end    timestamptz,
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists billing_invoices_created_idx on billing_invoices (created_at desc);

create table if not exists password_reset_tokens (
  id          text primary key,
  user_id     text not null,
  token_hash  text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table if exists public.workspace_subscriptions enable row level security;
alter table if exists public.billing_invoices enable row level security;
alter table if exists public.password_reset_tokens enable row level security;

create table if not exists media_assets (
  id                  text primary key,
  workspace_id        text not null default 'default',
  client_id           text,
  kind                text not null,
  title               text not null,
  description         text,
  source              text not null,
  source_ref          text,
  status              text not null,
  duration_sec        double precision,
  width               integer,
  height              integer,
  aspect_ratio        text,
  mime_type           text,
  byte_size           integer,
  checksum            text,
  current_version_id  text,
  parent_asset_id     text,
  tags                text not null default '[]',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          text
);
create index if not exists media_assets_client_idx on media_assets (client_id, created_at desc);

create table if not exists media_asset_versions (
  id              text primary key,
  asset_id        text not null,
  version_number  integer not null,
  storage_key     text not null,
  file_url        text,
  mime_type       text,
  byte_size       integer,
  checksum        text,
  note            text,
  created_at      timestamptz not null default now()
);

create table if not exists caption_tracks (
  id           text primary key,
  asset_id     text not null,
  language     text not null default 'en',
  status       text not null,
  format       text not null default 'JSON_CUES',
  storage_key  text,
  cues         text,
  engine       text not null,
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists caption_styles (
  id          text primary key,
  client_id   text,
  name        text not null,
  font        text,
  size        integer,
  position    text,
  outline     text,
  created_at  timestamptz not null default now()
);

create table if not exists render_jobs (
  id                 text primary key,
  workspace_id       text not null default 'default',
  client_id          text,
  source_asset_id    text not null,
  source_version_id  text,
  caption_track_id   text,
  preset             text not null,
  options            text not null default '{}',
  status             text not null,
  progress_percent   integer not null default 0,
  output_asset_id    text,
  error              text,
  attempts           integer not null default 0,
  worker             text not null default 'BASE44_FN',
  created_at         timestamptz not null default now(),
  started_at         timestamptz,
  finished_at        timestamptz,
  created_by         text
);

alter table social_jobs add column if not exists media_asset_id text;
alter table social_jobs add column if not exists options text;

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

create table if not exists notification_preferences (
  user_id           text primary key,
  muted_categories  text not null default '[]',
  email_enabled     text not null default '0',
  updated_at        timestamptz not null default now()
);

alter table if exists public.media_assets enable row level security;
alter table if exists public.media_asset_versions enable row level security;
alter table if exists public.caption_tracks enable row level security;
alter table if exists public.caption_styles enable row level security;
alter table if exists public.render_jobs enable row level security;
alter table if exists public.approval_requests enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.audit_events enable row level security;
alter table if exists public.notification_preferences enable row level security;

alter table knowledge_entries drop constraint if exists knowledge_entries_scope_check;
alter table knowledge_entries add constraint knowledge_entries_scope_check
  check (scope in (
    'THUMBNAIL_GLOBAL',
    'VIDEO_GLOBAL',
    'CLIENT_TITLES',
    'CLIENT_IDEAS',
    'CLIENT_CLIPPING'
  ));

create table if not exists post_performance (
  id                      text primary key,
  workspace_id            text not null default 'default',
  client_id               text,
  social_job_id           text,
  social_post_id          text,
  platform                text not null,
  external_post_id        text not null,
  external_url            text,
  media_asset_id          text,
  stream_clip_id          text,
  published_at            timestamptz,
  metrics                 text not null default '{}',
  metrics_source          text not null,
  captured_at             timestamptz not null,
  captured_day            text not null,
  "window"                text not null,
  score                   integer,
  views_percentile        double precision,
  engagement_percentile   double precision,
  engagement_rate         double precision,
  verdict                 text,
  raw                     text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              text
);
create unique index if not exists post_performance_idemp_uidx
  on post_performance (external_post_id, "window", captured_day);
create index if not exists post_performance_client_idx
  on post_performance (client_id, captured_at desc);

create table if not exists asset_performance_rollups (
  asset_id                text primary key,
  workspace_id            text not null default 'default',
  client_id               text,
  best_platform           text,
  best_external_post_id   text,
  score                   integer,
  views_total             bigint,
  engagement_rate         double precision,
  sample_count            integer not null default 0,
  winner_count            integer not null default 0,
  updated_at              timestamptz not null default now()
);

create table if not exists knowledge_proposals (
  id                      text primary key,
  workspace_id            text not null default 'default',
  client_id               text,
  status                  text not null,
  suggested_scope         text not null,
  source                  text not null,
  source_refs             text not null default '{}',
  user_input_draft        text not null,
  learned_principle_draft text not null,
  principle_hash          text,
  confidence              double precision,
  created_at              timestamptz not null default now(),
  reviewed_by             text,
  reviewed_at             timestamptz,
  decision_note           text,
  merged_entry_id         text,
  created_by              text
);
create index if not exists knowledge_proposals_status_idx
  on knowledge_proposals (status, created_at desc);

create table if not exists performance_fetch_queue (
  id               text primary key,
  social_post_id   text,
  external_post_id text not null,
  platform         text not null,
  "window"         text not null,
  run_at           timestamptz not null,
  status           text not null default 'PENDING',
  attempts         integer not null default 0,
  last_error       text,
  created_at       timestamptz not null default now()
);
create index if not exists performance_fetch_queue_due_idx
  on performance_fetch_queue (status, run_at);

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

alter table if exists public.post_performance enable row level security;
alter table if exists public.asset_performance_rollups enable row level security;
alter table if exists public.knowledge_proposals enable row level security;
alter table if exists public.performance_fetch_queue enable row level security;
alter table if exists public.client_portal_users enable row level security;
alter table if exists public.client_portal_sessions enable row level security;

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

alter table if exists public.linear_links enable row level security;
alter table if exists public.linear_sync_queue enable row level security;

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

alter table if exists public.channel_threads enable row level security;
alter table if exists public.channel_messages enable row level security;

create table if not exists demo_requests (
  id          text primary key,
  name        text not null,
  email       text not null,
  company     text,
  role        text,
  country     text,
  message     text,
  emailed     text not null default '0',
  created_at  timestamptz not null default now()
);
create index if not exists demo_requests_created_idx on demo_requests (created_at desc);
create index if not exists demo_requests_email_idx on demo_requests (email);
alter table if exists public.demo_requests enable row level security;







