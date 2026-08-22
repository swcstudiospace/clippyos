import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { LEAD_STATUSES, type Lead } from "@/lib/entities";
import { sanitizeText } from "@/lib/sanitize";
import { isMissingTable, mapLead } from "@/lib/server/mappers";

async function load_agency_db() {
  return import("@/lib/server/agency-db.server");
}

export const SaveLeadSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(200),
  channelUrl: z.string().trim().max(500).nullable(),
  notes: z.string().max(20000).nullable(),
  status: z.enum(LEAD_STATUSES),
  upfrontCash: z.number().min(0).max(1_000_000),
  monthlyRecurring: z.number().min(0).max(1_000_000),
});

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function sanitizeNullable(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return sanitizeText(value);
}

export async function readLeads(): Promise<Lead[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("leads").select("*").order("updated_at", {
      ascending: false,
    });
    if (!error) return (data ?? []).map((row) => mapLead(row as Record<string, unknown>));
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from leads order by updated_at desc",
  );
  return rows.map(mapLead);
}

export async function internalSaveLead(
  data: z.infer<typeof SaveLeadSchema>,
  actorId: string,
): Promise<Lead> {
  const stamp = nowIso();
  const isInsert = !data.id;
  const id = data.id ?? newId();
  const payload = {
    id,
    name: sanitizeText(data.name),
    channel_url: sanitizeNullable(data.channelUrl),
    notes: sanitizeNullable(data.notes),
    status: data.status,
    upfront_cash: data.upfrontCash,
    monthly_recurring: data.monthlyRecurring,
    updated_at: stamp,
    created_at: stamp,
    created_by: actorId,
    deleted_at: null,
  };

  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    if (isInsert) {
      const { error } = await admin.from("leads").insert(payload);
      if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
      if (!error) {
        return mapLead(payload);
      }
    } else {
      const existing = await admin
        .from("leads")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (existing.error && !isMissingTable(existing.error)) {
        throw new Error("DATA_UNAVAILABLE");
      }
      if (!existing.error) {
        if (!existing.data) throw new Error("LEAD_MISSING");
        const { error } = await admin
          .from("leads")
          .update({
            name: payload.name,
            channel_url: payload.channel_url,
            notes: payload.notes,
            status: payload.status,
            upfront_cash: payload.upfront_cash,
            monthly_recurring: payload.monthly_recurring,
            updated_at: stamp,
          })
          .eq("id", id)
          .is("deleted_at", null);
        if (error) throw new Error("DATA_UNAVAILABLE");
        const current = await admin.from("leads").select("*").eq("id", id).maybeSingle();
        if (current.data) return mapLead(current.data as Record<string, unknown>);
      }
    }
  }

  const sql = await (await load_agency_db()).localSql();
  if (isInsert) {
    await sql.query(
      `insert into leads (
          id, name, channel_url, notes, status, upfront_cash, monthly_recurring,
          created_at, updated_at, created_by, deleted_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,null)`,
      [
        payload.id,
        payload.name,
        payload.channel_url,
        payload.notes,
        payload.status,
        payload.upfront_cash,
        payload.monthly_recurring,
        stamp,
        actorId,
      ],
    );
  } else {
    const existing = await sql.query<{ id: string }>(
      "select id from leads where id = $1 and deleted_at is null",
      [id],
    );
    if (!existing[0]) throw new Error("LEAD_MISSING");
    await sql.query(
      `update leads set
          name=$2, channel_url=$3, notes=$4, status=$5,
          upfront_cash=$6, monthly_recurring=$7, updated_at=$8
         where id=$1 and deleted_at is null`,
      [
        id,
        payload.name,
        payload.channel_url,
        payload.notes,
        payload.status,
        payload.upfront_cash,
        payload.monthly_recurring,
        stamp,
      ],
    );
  }
  const rows = await sql.query<Record<string, unknown>>(
    "select * from leads where id = $1",
    [id],
  );
  if (!rows[0]) throw new Error("LEAD_MISSING");
  return mapLead(rows[0]);
}

export const listLeads = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<Lead[]> => {
    const leads = await readLeads();
    return leads.filter((lead) => !lead.deletedAt);
  });

export const saveLead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => SaveLeadSchema.parse(input))
  .handler(async ({ context, data }): Promise<Lead> => {
    return internalSaveLead(data, context.userId);
  });

export const softDeleteLead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }) => {
    const stamp = nowIso();
    const admin = await (await load_agency_db()).getAgencyAdmin();
    if (admin) {
      const existing = await admin.from("leads").select("id").eq("id", id).maybeSingle();
      if (existing.error && !isMissingTable(existing.error)) {
        throw new Error("DATA_UNAVAILABLE");
      }
      if (!existing.error) {
        if (!existing.data) throw new Error("LEAD_MISSING");
        const { error } = await admin
          .from("leads")
          .update({ deleted_at: stamp, status: "LOST", updated_at: stamp })
          .eq("id", id);
        if (error) throw new Error("DATA_UNAVAILABLE");
        return { ok: true as const };
      }
    }
    const sql = await (await load_agency_db()).localSql();
    const updated = await sql.query<{ id: string }>(
      "update leads set deleted_at = $2, status = 'LOST', updated_at = $2 where id = $1 and deleted_at is null returning id",
      [id, stamp],
    );
    if (updated.length === 0) throw new Error("LEAD_MISSING");
    return { ok: true as const };
  });
