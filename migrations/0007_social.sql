-- Social distribution via Daytona Computer Use.
-- SocialPost is an activity/audit record, not a second pipeline source of truth.

create table if not exists social_posts (
  id               text primary key,
  client_id        text not null references clients (id) on delete restrict,
  platform         text not null check (platform in ('instagram', 'x', 'tiktok')),
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
