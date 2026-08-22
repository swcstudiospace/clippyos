import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { sanitizeText } from "@/lib/sanitize";
import { parseDemoEmail, parseDemoName, DEMO_ROLES, type DemoRole } from "@/lib/demo";
import { parseProxyCountry } from "@/lib/social-machine";
import { demoConfirmationEmail } from "@/lib/demo-email";
import { sendTransactionalEmail } from "@/lib/server/mail.server";

const SCHEMA = `
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
)`;

let ready: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    try {
      const sql = await localSql();
      await sql.query(`${SCHEMA};`);
    } catch {
      /* supabase-only hosts skip local DDL */
    }
  })();
  return ready;
}

const hits = new Map<string, number>();

function rateLimit(key: string): void {
  const last = hits.get(key) ?? 0;
  if (Date.now() - last < 8000) throw new Error("DEMO_RATE_LIMIT");
  hits.set(key, Date.now());
}

export async function submitDemoRequest(input: {
  name: unknown;
  email: unknown;
  company?: unknown;
  role?: unknown;
  country?: unknown;
  message?: unknown;
  ip?: string;
}): Promise<{ ok: true; emailed: boolean }> {
  rateLimit(input.ip || String(input.email));
  const name = parseDemoName(input.name);
  const email = parseDemoEmail(input.email);
  if (!name || !email) throw new Error("VALIDATION");
  const company = sanitizeText(String(input.company ?? "")).slice(0, 120);
  const roleRaw = String(input.role ?? "other").trim().toLowerCase();
  const role: DemoRole = (DEMO_ROLES as readonly string[]).includes(roleRaw)
    ? (roleRaw as DemoRole)
    : "other";
  const country = parseProxyCountry(input.country);
  const message = sanitizeText(String(input.message ?? "")).slice(0, 2000);
  const id = crypto.randomUUID();
  const stamp = new Date().toISOString();
  await ensureSchema();
  const payload = {
    id,
    name,
    email,
    company: company || null,
    role,
    country,
    message: message || null,
    emailed: "0",
    created_at: stamp,
  };
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("demo_requests").insert(payload);
    if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  } else {
    const sql = await localSql();
    await sql.query(
      `insert into demo_requests (id, name, email, company, role, country, message, emailed, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, name, email, company || null, role, country, message || null, "0", stamp],
    );
  }
  const mail = demoConfirmationEmail({ name, company });
  const sent = await sendTransactionalEmail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  if (sent.sent) {
    if (admin) {
      await admin.from("demo_requests").update({ emailed: "1" }).eq("id", id).then(() => undefined);
    } else {
      const sql = await localSql();
      await sql.query(`update demo_requests set emailed = '1' where id = $1`, [id]);
    }
  }
  return { ok: true, emailed: sent.sent };
}
