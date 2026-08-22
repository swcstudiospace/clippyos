-- Agent orchestration: plan, outputs, idempotency, cancel, deadlines.

alter table agent_runs add column if not exists plan_json text;
alter table agent_runs add column if not exists outputs_json text;
alter table agent_runs add column if not exists idempotency_key text;
alter table agent_runs add column if not exists cancel_requested boolean not null default false;
alter table agent_runs add column if not exists deadline_at timestamptz;
create index if not exists agent_runs_idempotency_idx on agent_runs (idempotency_key);

alter table agent_iterations add column if not exists step_id text;
alter table agent_iterations add column if not exists duration_ms integer;
