import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";

function nowIso(): string {
  return new Date().toISOString();
}

export async function readAppSettingsMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("app_settings").select("key,value");
    if (!error) {
      for (const row of data ?? []) {
        const record = row as { key?: string; value?: string | null };
        if (record.key && record.value) map.set(record.key, record.value);
      }
      return map;
    }
    if (!isMissingTable(error)) return map;
  }
  try {
    const sql = await localSql();
    const rows = await sql.query<{ key: string; value: string | null }>(
      "select key, value from app_settings",
    );
    for (const row of rows) {
      if (row.key && row.value) map.set(row.key, row.value);
    }
  } catch {
    /* empty */
  }
  return map;
}

export async function readAppSetting(key: string): Promise<string | null> {
  const map = await readAppSettingsMap();
  return map.get(key) ?? null;
}

export async function writeAppSetting(key: string, value: string): Promise<void> {
  const now = nowIso();
  const id = crypto.randomUUID();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("app_settings").upsert(
      {
        id,
        key,
        value,
        created_at: now,
        updated_at: now,
        created_by: null,
      },
      { onConflict: "key" },
    );
    if (error && !isMissingTable(error)) {
      const existing = await admin.from("app_settings").select("id").eq("key", key).maybeSingle();
      if (existing.data && typeof (existing.data as { id?: string }).id === "string") {
        await admin
          .from("app_settings")
          .update({ value, updated_at: now })
          .eq("id", (existing.data as { id: string }).id);
      } else if (!existing.error || isMissingTable(existing.error)) {
        await admin.from("app_settings").insert({
          id,
          key,
          value,
          created_at: now,
          updated_at: now,
          created_by: null,
        });
      }
    }
  }
  try {
    const sql = await localSql();
    await sql.query(
      `insert into app_settings (id, key, value, created_at, updated_at, created_by)
       values ($1, $2, $3, $4, $5, null)
       on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`,
      [id, key, value, now, now],
    );
  } catch {
    /* local store may be unavailable */
  }
}

export async function deleteAppSetting(key: string): Promise<void> {
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("app_settings").delete().eq("key", key);
    if (error && !isMissingTable(error)) {
      /* ignore — local fallback still runs */
    }
  }
  try {
    const sql = await localSql();
    await sql.query("delete from app_settings where key = $1", [key]);
  } catch {
    /* empty */
  }
}
