-- ClippyOS MCP OAuth 2.1 (Grok connectors). Bearer API keys remain valid for Hermes.
create table if not exists mcp_oauth_clients (
  client_id text primary key,
  client_name text not null,
  redirect_uris text not null,
  token_endpoint_auth_method text not null default 'none',
  grant_types text not null,
  response_types text not null,
  scope text,
  client_uri text,
  software_id text,
  created_at timestamptz not null default now()
);

create table if not exists mcp_oauth_codes (
  code_hash text primary key,
  client_id text not null,
  user_id text not null,
  redirect_uri text not null,
  code_challenge text not null,
  code_challenge_method text not null,
  scope text not null,
  resource text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mcp_oauth_codes_expires_idx on mcp_oauth_codes (expires_at);

create table if not exists mcp_oauth_tokens (
  id text primary key,
  access_token_hash text not null,
  refresh_token_hash text,
  client_id text not null,
  user_id text not null,
  scope text not null,
  resource text not null,
  access_expires_at timestamptz not null,
  refresh_expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists mcp_oauth_tokens_access_uidx on mcp_oauth_tokens (access_token_hash);
create unique index if not exists mcp_oauth_tokens_refresh_uidx on mcp_oauth_tokens (refresh_token_hash) where refresh_token_hash is not null;
create index if not exists mcp_oauth_tokens_client_idx on mcp_oauth_tokens (client_id);
