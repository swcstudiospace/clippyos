import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/safety-schema.server-pGsE9nul.js
var schemaReady = null;
var DDL = `
create table if not exists approval_requests (
  id             text primary key,
  workspace_id   text not null default 'default',
  client_id      text,
  type           text not null,
  resource_type  text not null,
  resource_id    text not null,
  status         text not null,
  title          text not null,
  summary        text,
  payload        text not null default '{}',
  requested_by   text not null,
  assigned_to    text,
  reviewed_by    text,
  reviewed_at    timestamptz,
  decision_note  text,
  expires_at     timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists approval_requests_status_idx on approval_requests (status, created_at desc);
create table if not exists notifications (
  id            text primary key,
  workspace_id  text not null default 'default',
  user_id       text not null,
  category      text not null,
  severity      text not null,
  title         text not null,
  body          text not null,
  href          text,
  entity_type   text,
  entity_id     text,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);
create table if not exists audit_events (
  id             text primary key,
  workspace_id   text not null default 'default',
  at             timestamptz not null default now(),
  actor_user_id  text,
  actor_type     text not null,
  action         text not null,
  entity_type    text,
  entity_id      text,
  client_id      text,
  summary        text not null,
  metadata       text not null default '{}',
  request_id     text,
  job_id         text
);
create index if not exists audit_events_at_idx on audit_events (at desc);
create table if not exists notification_preferences (
  user_id           text primary key,
  muted_categories  text not null default '[]',
  email_enabled     text not null default '0',
  updated_at        timestamptz not null default now()
);
`;
async function ensureSafetySchema() {
	if (schemaReady) return schemaReady;
	schemaReady = (async () => {
		try {
			const sql = await localSql();
			for (const statement of DDL.split(";").map((part) => part.trim()).filter(Boolean)) await sql.query(`${statement};`);
		} catch {}
	})();
	return schemaReady;
}
async function listActiveOperatorIds(opts) {
	const ids = [];
	const admin = await getAgencyAdmin();
	if (admin) {
		const { data, error } = await admin.from("app_profiles").select("user_id,role,status");
		if (!error) {
			for (const row of data ?? []) {
				const rec = row;
				if (!rec.user_id || rec.status === "REVOKED") continue;
				if (opts?.adminsOnly && rec.role !== "admin") continue;
				ids.push(rec.user_id);
			}
			if (ids.length > 0) return [...new Set(ids)];
		}
		if (error && !isMissingTable(error)) return ids;
	}
	try {
		const rows = await (await localSql()).query("select user_id, role, status from app_profiles");
		for (const row of rows) {
			if (row.status === "REVOKED") continue;
			if (opts?.adminsOnly && row.role !== "admin") continue;
			ids.push(row.user_id);
		}
	} catch {}
	return [...new Set(ids)];
}
//#endregion
export { listActiveOperatorIds as n, ensureSafetySchema as t };
