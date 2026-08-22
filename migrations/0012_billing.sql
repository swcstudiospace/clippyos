-- SaaS billing, client onboarding checklist, password-reset tokens.
-- Workspace subscription is one row per deploy (id = 'default').

create table if not exists workspace_subscriptions (
  id                       text primary key,
  status                   text not null default 'none',
  plan_key                 text,
  price_id                 text,
  external_customer_id     text,
  external_subscription_id text,
  external_checkout_id     text,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  last_invoice_status      text,
  last_invoice_at          timestamptz,
  mrr                      numeric(12, 2),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table if not exists billing_invoices (
  id            text primary key,
  external_id   text unique,
  amount        numeric(12, 2) not null default 0,
  currency      text not null default 'USD',
  status        text not null,
  hosted_url    text,
  period_start  timestamptz,
  period_end    timestamptz,
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists billing_invoices_created_idx on billing_invoices (created_at desc);

create table if not exists password_reset_tokens (
  id          text primary key,
  user_id     text not null,
  token_hash  text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists password_reset_tokens_user_idx on password_reset_tokens (user_id);

alter table clients add column if not exists onboarding_checklist text;
