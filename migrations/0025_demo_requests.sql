-- Public demo requests from the ClippyOS landing page.

create table if not exists demo_requests (
  id          text primary key,
  name        text not null,
  email       text not null,
  company     text,
  role        text,
  country     text,
  message     text,
  emailed     text not null default '0',
  created_at  timestamptz not null default now()
);

create index if not exists demo_requests_created_idx on demo_requests (created_at desc);
create index if not exists demo_requests_email_idx on demo_requests (email);
