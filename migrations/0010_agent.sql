-- AI Clipping Agent runs + skill version history / artifacts.

create table if not exists agent_runs (
  id               text primary key,
  goal             text not null,
  preset           text not null,
  client_id        text,
  skill_id         text,
  status           text not null,
  model            text not null default 'grok-4.6',
  provider         text,
  summary          text,
  error_code       text,
  iteration_count  integer not null default 0,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       text
);

create index if not exists agent_runs_started_idx on agent_runs (started_at desc);
create index if not exists agent_runs_client_idx on agent_runs (client_id);

create table if not exists agent_iterations (
  id                   text primary key,
  run_id               text not null,
  idx                  integer not null,
  kind                 text not null,
  tool_name            text,
  args_summary         text,
  result_summary       text,
  screenshot_ref       text,
  screenshot_data_url  text,
  status               text not null default 'ok',
  created_at           timestamptz not null default now()
);

create index if not exists agent_iterations_run_idx on agent_iterations (run_id, idx);

create table if not exists skill_versions (
  id           text primary key,
  skill_id     text not null,
  version      text not null,
  skill_md     text not null,
  scripts_json text not null default '{}',
  refs_json    text not null default '{}',
  templates_json text not null default '{}',
  created_at   timestamptz not null default now(),
  created_by   text
);

create index if not exists skill_versions_skill_idx on skill_versions (skill_id, created_at desc);

alter table skills add column if not exists refs_json text not null default '{}';
alter table skills add column if not exists templates_json text not null default '{}';
alter table skill_runs add column if not exists artifacts_json text;
