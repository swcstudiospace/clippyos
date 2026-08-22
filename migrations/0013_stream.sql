-- Twitch / stream VOD + clip records. Soft-delete via status; no full VOD bytes.

create table if not exists stream_sources (
  id               text primary key,
  client_id        text not null,
  platform         text not null default 'TWITCH',
  broadcaster_id   text,
  login            text,
  display_name     text,
  status           text not null default 'ACTIVE',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       text
);

create index if not exists stream_sources_client_idx on stream_sources (client_id, platform);

create table if not exists stream_vods (
  id               text primary key,
  source_id        text not null,
  client_id        text not null,
  external_id      text not null,
  title            text not null,
  url              text,
  thumbnail_url    text,
  duration_sec     integer not null default 0,
  view_count       integer,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index if not exists stream_vods_external_idx on stream_vods (external_id);
create index if not exists stream_vods_client_idx on stream_vods (client_id, published_at desc);

create table if not exists stream_clips (
  id               text primary key,
  vod_id           text not null,
  client_id        text not null,
  external_id      text,
  url              text,
  edit_url         text,
  thumbnail_url    text,
  title            text,
  caption          text,
  notes            text,
  vod_offset_sec   integer not null default 0,
  duration_sec     integer not null default 30,
  status           text not null default 'PROCESSING',
  error            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       text
);

create index if not exists stream_clips_vod_idx on stream_clips (vod_id, created_at desc);
create index if not exists stream_clips_client_idx on stream_clips (client_id, created_at desc);
