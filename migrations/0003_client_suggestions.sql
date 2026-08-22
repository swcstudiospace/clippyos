-- Persist last Suggested Titles / Suggested Ideas JSON on Client.
-- Safe to re-run.

alter table clients add column if not exists suggested_titles text;
alter table clients add column if not exists suggested_ideas text;
alter table clients add column if not exists suggested_titles_at timestamptz;
alter table clients add column if not exists suggested_ideas_at timestamptz;
