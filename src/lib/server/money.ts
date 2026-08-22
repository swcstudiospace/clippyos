import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { Client, Payment, TeamMember } from "@/lib/entities";
import type { MoneySnapshot } from "@/lib/money";
import {
  isMissingTable,
  mapClient,
  mapPayment,
  mapTeamMember,
} from "@/lib/server/mappers";

async function load_agency_db() {
  return import("@/lib/server/agency-db.server");
}

export async function readClients(): Promise<Client[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin.from("clients").select("*").order("name");
    if (!error) return (data ?? []).map((row) => mapClient(row as Record<string, unknown>));
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from clients order by name",
  );
  return rows.map(mapClient);
}

export async function readPayments(): Promise<Payment[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("payments")
      .select("*")
      .order("due_date", { ascending: false });
    if (!error) return (data ?? []).map((row) => mapPayment(row as Record<string, unknown>));
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from payments order by due_date desc",
  );
  return rows.map(mapPayment);
}

export async function readTeamMembers(): Promise<TeamMember[]> {
  const admin = await (await load_agency_db()).getAgencyAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("team_members")
      .select("*")
      .is("deleted_at", null);
    if (!error) {
      return (data ?? []).map((row) => mapTeamMember(row as Record<string, unknown>));
    }
    if (!isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
  }
  const sql = await (await load_agency_db()).localSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from team_members where deleted_at is null",
  );
  return rows.map(mapTeamMember);
}

export const getMoneySnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<MoneySnapshot> => {
    const [clients, payments, teamMembers] = await Promise.all([
      readClients(),
      readPayments(),
      readTeamMembers(),
    ]);
    return { clients, payments, teamMembers };
  });
