-- YouTube Data API v3 publish rail + job options JSON.

alter table social_jobs add column if not exists options text;

alter table social_posts drop constraint if exists social_posts_platform_check;
alter table social_posts add constraint social_posts_platform_check
  check (platform in ('instagram', 'x', 'tiktok', 'youtube'));
