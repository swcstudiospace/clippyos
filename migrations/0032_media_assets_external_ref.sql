-- Idempotency key and clip thumbnail pointer for Crayo → library export.
alter table media_assets add column if not exists external_ref text;
alter table media_assets add column if not exists thumbnail_version_id text;
create index if not exists media_assets_external_ref_idx on media_assets (external_ref);
