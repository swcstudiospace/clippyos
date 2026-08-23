-- ClippyOS Remote MCP connector tokens reuse api_keys with prefix cos_mcp_.
alter table if exists api_keys add column if not exists expires_at timestamptz;
alter table if exists agent_audit_log add column if not exists args_digest text;
