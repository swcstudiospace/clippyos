-- Fix 3 (final review): external_ref's plain index let two concurrent inserts for the
-- same idempotency key (e.g. "crayo:project:<id>") both pass the findAssetByExternalRef
-- "not found" check and create two asset rows. A unique partial index makes the second
-- insert fail at the database instead. The old non-unique index is dropped since the
-- new unique index already serves equality lookups by external_ref.
drop index if exists media_assets_external_ref_idx;
create unique index if not exists media_assets_external_ref_unique on media_assets (external_ref) where external_ref is not null;
