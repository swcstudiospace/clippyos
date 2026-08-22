import { getSql } from "@/lib/db";
import { isMissingTable } from "@/lib/server/mappers";

export async function getAgencyAdmin() {
  const { tryCreateAdminClient } = await import("@/lib/supabase/clients.server");
  return tryCreateAdminClient();
}

export async function supabaseTableReady(
  admin: NonNullable<Awaited<ReturnType<typeof getAgencyAdmin>>>,
  table: string,
): Promise<boolean> {
  const { error } = await admin.from(table).select("*").limit(0);
  return !error || !isMissingTable(error);
}

export async function localSql() {
  return getSql();
}
