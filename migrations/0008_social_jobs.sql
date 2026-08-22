-- Upload jobs for Hermes Social / Daytona tools.
-- SocialPost remains the per-platform result; jobs group those rows.

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

create index if not exists social_jobs_client_idx on social_jobs (client_id);
create index if not exists social_jobs_created_idx on social_jobs (created_at desc);
create index if not exists social_jobs_status_idx on social_jobs (status);

alter table social_posts add column if not exists job_id text;
create index if not exists social_posts_job_idx on social_posts (job_id);
