import { getAgencyAdmin, localSql } from "@/lib/server/agency-db.server";
import { isMissingTable } from "@/lib/server/mappers";
import { ForbiddenError } from "@/lib/server/access";
import {
  deleteOperatorSecret,
  getSecretScope,
  isWorkspaceControlKey,
  readOperatorSecret,
  readOperatorSecretsMap,
  readsWorkspaceSecrets,
  secretWriteTarget,
  writeOperatorSecret,
} from "@/lib/server/secret-scope.server";
import {
  decryptSecret,
  encryptSecret,
  isEncryptedSettingKey,
} from "@/lib/server/secret-crypto.server";

function nowIso(): string {
  return new Date().toISOString();
}

function decodeSetting(key: string, value: string): string | null {
  if (!isEncryptedSettingKey(key)) return value;
  try {
    return decryptSecret(value);
  } catch {
    return null;
  }
}

function encodeSetting(key: string, value: string): string {
  return isEncryptedSettingKey(key) ? encryptSecret(value) : value;
}

async function readWorkspaceSettingsMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const admin = await getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("app_settings").select("key,value");
    if (!error) {
      for (const row of data ?? []) {
        const record = row as { key?: string; value?: string | null };
        if (record.key && record.value) {
          const plain = decodeSetting(record.key, record.value);
          if (plain) map.set(record.key, plain);
        }
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
      if (row.key && row.value) {
        const plain = decodeSetting(row.key, row.value);
        if (plain) map.set(row.key, plain);
      }
    }
  } catch {
    /* empty */
  }
  return map;
}

async function readWorkspaceSetting(key: string): Promise<string | null> {
  const map = await readWorkspaceSettingsMap();
  return map.get(key) ?? null;
}

async function writeWorkspaceSetting(key: string, value: string): Promise<void> {
  const now = nowIso();
  const id = crypto.randomUUID();
  const stored = encodeSetting(key, value);
  const admin = await getAgencyAdmin();
  if (admin) {
    const { error } = await admin.from("app_settings").upsert(
      {
        id,
        key,
        value: stored,
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
          .update({ value: stored, updated_at: now })
          .eq("id", (existing.data as { id: string }).id);
      } else if (!existing.error || isMissingTable(existing.error)) {
        await admin.from("app_settings").insert({
          id,
          key,
          value: stored,
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
      [id, key, stored, now, now],
    );
  } catch {
    /* local store may be unavailable */
  }
}

async function deleteWorkspaceSetting(key: string): Promise<void> {
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

export async function readAppSettingsMap(): Promise<Map<string, string>> {
  const workspace = await readWorkspaceSettingsMap();
  const scope = getSecretScope();
  if (readsWorkspaceSecrets(scope)) return workspace;
  const personal = await readOperatorSecretsMap(scope!.userId);
  const map = new Map<string, string>();
  for (const [key, value] of workspace) {
    if (isWorkspaceControlKey(key)) map.set(key, value);
  }
  for (const [key, value] of personal) map.set(key, value);
  return map;
}

export async function readAppSetting(key: string): Promise<string | null> {
  if (isWorkspaceControlKey(key)) return readWorkspaceSetting(key);
  const scope = getSecretScope();
  if (readsWorkspaceSecrets(scope)) return readWorkspaceSetting(key);
  return readOperatorSecret(scope!.userId, key);
}

export async function writeAppSetting(key: string, value: string): Promise<void> {
  if (isWorkspaceControlKey(key)) {
    await writeWorkspaceSetting(key, value);
    return;
  }
  const target = secretWriteTarget(getSecretScope());
  if (target === "forbidden") throw new ForbiddenError();
  if (target === "operator") {
    await writeOperatorSecret(getSecretScope()!.userId, key, value);
    return;
  }
  await writeWorkspaceSetting(key, value);
}

export async function deleteAppSetting(key: string): Promise<void> {
  if (isWorkspaceControlKey(key)) {
    await deleteWorkspaceSetting(key);
    return;
  }
  const target = secretWriteTarget(getSecretScope());
  if (target === "forbidden") throw new ForbiddenError();
  if (target === "operator") {
    await deleteOperatorSecret(getSecretScope()!.userId, key);
    return;
  }
  await deleteWorkspaceSetting(key);
}
