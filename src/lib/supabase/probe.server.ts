import type { AppRole } from "@/lib/entities";
import {
  AGENCY_TABLES,
  SUPABASE_JWKS_URL,
  SUPABASE_PROJECT_REF,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "./public";
import { agencySchemaSql } from "./schema";
import {
  createPublishableClient,
  hasSupabaseSecret,
  tryCreateAdminClient,
} from "./clients.server";

export type TableProbe = {
  name: (typeof AGENCY_TABLES)[number];
  exists: boolean;
};

export type SupabaseStatus = {
  url: string;
  projectRef: string;
  authHealth: boolean;
  jwksHealth: boolean;
  adminConfigured: boolean;
  tables: TableProbe[];
  schemaReady: boolean;
  operatorRole: AppRole | null;
  schemaSql: string;
};

async function ping(url: string, headers?: Record<string, string>): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(4000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function probeOneTable(
  client: ReturnType<typeof createPublishableClient>,
  name: (typeof AGENCY_TABLES)[number],
): Promise<TableProbe> {
  try {
    const { error } = await client.from(name).select("*").limit(0);
    return { name, exists: !error };
  } catch {
    return { name, exists: false };
  }
}

async function probeTables(): Promise<TableProbe[]> {
  const admin = tryCreateAdminClient();
  const client = admin ?? createPublishableClient();
  const chunkSize = 4;
  const results: TableProbe[] = [];
  for (let i = 0; i < AGENCY_TABLES.length; i += chunkSize) {
    const chunk = AGENCY_TABLES.slice(i, i + chunkSize);
    const probed = await Promise.all(chunk.map((name) => probeOneTable(client, name)));
    results.push(...probed);
  }
  return results;
}

async function ensureOperatorProfile(userId: string): Promise<AppRole | null> {
  const { getUserRole } = await import("@/lib/server/access");
  return getUserRole(userId);
}

export async function probeSupabase(userId: string): Promise<SupabaseStatus> {
  const [authHealth, jwksHealth, tables] = await Promise.all([
    ping(`${SUPABASE_URL}/auth/v1/health`, { apikey: SUPABASE_PUBLISHABLE_KEY }),
    ping(SUPABASE_JWKS_URL),
    probeTables(),
  ]);
  const operatorRole = await ensureOperatorProfile(userId);
  return {
    url: SUPABASE_URL,
    projectRef: SUPABASE_PROJECT_REF,
    authHealth,
    jwksHealth,
    adminConfigured: hasSupabaseSecret(),
    tables,
    schemaReady: tables.every((table) => table.exists),
    operatorRole,
    schemaSql: agencySchemaSql,
  };
}
