-- Durable chunked upload sessions + progress on social posts.

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

alter table social_posts add column if not exists upload_percent integer;
alter table social_posts add column if not exists upload_phase text;
alter table social_posts add column if not exists resumable_session_id text;
