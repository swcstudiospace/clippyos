-- Skills packages (SKILL.md + optional Python) and invoke audit.

create table if not exists skills (
  id              text primary key,
  slug            text not null unique,
  name            text not null,
  description     text not null,
  version         text not null,
  tags            text not null default '[]',
  category        text,
  provenance      text not null,
  status          text not null,
  permissions     text not null default '[]',
  runtime_json    text not null default '{}',
  inputs_schema   text,
  outputs_schema  text,
  skill_md        text not null,
  scripts_json    text not null default '{}',
  enabled         boolean not null default true,
  parent_id       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      text
);

create index if not exists skills_status_idx on skills (status);
create index if not exists skills_slug_idx on skills (slug);

create table if not exists skill_runs (
  id           text primary key,
  skill_id     text not null,
  version      text not null,
  status       text not null,
  actor        text,
  args_json    text,
  stdout       text,
  stderr       text,
  exit_code    integer,
  duration_ms  integer,
  error_code   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists skill_runs_skill_idx on skill_runs (skill_id, created_at desc);
