-- Optional audit: which automation seat triggered an agent run or social job.
-- Token secrets never live here.

alter table if exists agent_runs add column if not exists triggered_by_team_member_id text;
alter table if exists social_jobs add column if not exists triggered_by_team_member_id text;

alter table if exists team_members drop constraint if exists team_members_bot_role_key_check;
alter table if exists team_members add constraint team_members_bot_role_key_check check (
  bot_role_key is null or bot_role_key in (
    'CLIPPY_OPS',
    'PUBLISH_DESK',
    'CLIENT_SUCCESS',
    'ENG_BOT',
    'LEARNING_BOT',
    'REVENUE_OPS',
    'CUSTOM'
  )
);
