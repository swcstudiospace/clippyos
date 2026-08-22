-- Unified asset library, caption tracks, and render/export queue.

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
create index if not exists media_assets_status_idx on media_assets (status);
create index if not exists media_assets_kind_idx on media_assets (kind);
create index if not exists media_assets_checksum_idx on media_assets (client_id, checksum);

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

create index if not exists media_asset_versions_asset_idx on media_asset_versions (asset_id, version_number desc);

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

create index if not exists caption_tracks_asset_idx on caption_tracks (asset_id, created_at desc);

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

create index if not exists render_jobs_status_idx on render_jobs (status, created_at desc);
create index if not exists render_jobs_source_idx on render_jobs (source_asset_id, created_at desc);

alter table social_jobs add column if not exists media_asset_id text;

alter table if exists public.media_assets enable row level security;
alter table if exists public.media_asset_versions enable row level security;
alter table if exists public.caption_tracks enable row level security;
alter table if exists public.caption_styles enable row level security;
alter table if exists public.render_jobs enable row level security;
