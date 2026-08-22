import { localSql } from "@/lib/server/agency-db.server";

let schemaReady: Promise<void> | null = null;

const DDL = `
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
create index if not exists post_performance_post_idx
  on post_performance (social_post_id);
create index if not exists post_performance_asset_idx
  on post_performance (media_asset_id);
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
create index if not exists knowledge_proposals_hash_idx
  on knowledge_proposals (principle_hash);
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
`;

export async function ensurePerformanceSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    try {
      const sql = await localSql();
      for (const statement of DDL.split(";")
        .map((part) => part.trim())
        .filter(Boolean)) {
        try {
          await sql.query(`${statement};`);
        } catch {
          /* statement already applied or host is supabase-only */
        }
      }
    } catch {
      schemaReady = null;
    }
  })();
  return schemaReady;
}
