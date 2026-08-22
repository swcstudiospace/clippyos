-- Dual-rail social publishing: native APIs + existing Computer Use.

alter table social_posts add column if not exists rail text;
alter table social_posts add column if not exists external_post_id text;

alter table social_jobs add column if not exists preferred_rail text;
alter table social_jobs add column if not exists fallback_to_browser text;
