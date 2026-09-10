import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";

let schemaReady: Promise<void> | null = null;

const DDL = `
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

export async function ensureSafetySchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = await localSql();
    for (const statement of DDL.split(";").map((part) => part.trim()).filter(Boolean)) {
      await sql.query(`${statement};`);
    }
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

export async function listActiveOperatorIds(opts?: {
  adminsOnly?: boolean;
}): Promise<string[]> {
  const ids: string[] = [];
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("app_profiles").select("user_id,role,status");
    if (!error) {
      for (const row of data ?? []) {
        const rec = row as { user_id?: string; role?: string; status?: string };
        if (!rec.user_id || rec.status === "REVOKED") continue;
        if (opts?.adminsOnly && rec.role !== "admin") continue;
        ids.push(rec.user_id);
      }
      return [...new Set(ids)];
    }
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<{ user_id: string; role?: string; status?: string }>(
      "select user_id, role, status from app_profiles",
    );
    for (const row of rows) {
      if (row.status === "REVOKED") continue;
      if (opts?.adminsOnly && row.role !== "admin") continue;
      ids.push(row.user_id);
    }
  } catch {
    /* empty */
  }
  return [...new Set(ids)];
}
