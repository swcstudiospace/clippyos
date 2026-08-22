-- Instagram Reels container id for Graph publish debugging.

alter table social_posts add column if not exists ig_container_id text;
