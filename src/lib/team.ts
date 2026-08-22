/** Live team allocation + capacity. Derived from Client + TeamMember only. */

import type { Client, TeamMember } from "@/lib/entities";
import { CAPACITY_OVERLOAD_THRESHOLD } from "@/lib/constants";
import { asMoney, isActiveClient } from "@/lib/money";

export type TeamLane = {
  clientId: string;
  clientName: string;
  members: TeamMember[];
  totalCost: number;
};

export type CapacityRow = {
  key: string;
  name: string;
  clientCount: number;
  clientNames: string[];
  overloaded: boolean;
};

export type TeamDerived = {
  lanes: TeamLane[];
  capacity: CapacityRow[];
  overallCost: number;
  assignedPeople: number;
  overloadedCount: number;
};

export function deriveTeam(
  clients: Client[],
  members: TeamMember[],
): TeamDerived {
  const active = clients.filter(isActiveClient);
  const nameById = new Map(active.map((client) => [client.id, client.name]));

  const lanes: TeamLane[] = active.map((client) => {
    const team = members.filter(
      (member) => member.clientId === client.id && !member.deletedAt,
    );
    team.sort((a, b) => a.name.localeCompare(b.name) || a.role.localeCompare(b.role));
    return {
      clientId: client.id,
      clientName: client.name,
      members: team,
      totalCost: team.reduce((sum, member) => sum + asMoney(member.cost), 0),
    };
  });
  lanes.sort((a, b) => a.clientName.localeCompare(b.clientName));

  const people = new Map<string, { name: string; clients: Set<string> }>();
  for (const member of members) {
    if (member.deletedAt) continue;
    const clientName = nameById.get(member.clientId);
    if (!clientName) continue;
    const key = member.name.trim().toLowerCase();
    if (!key) continue;
    const record = people.get(key) ?? {
      name: member.name.trim(),
      clients: new Set<string>(),
    };
    record.clients.add(clientName);
    people.set(key, record);
  }

  const capacity: CapacityRow[] = [...people.values()].map((person) => {
    const clientNames = [...person.clients].sort((a, b) => a.localeCompare(b));
    return {
      key: person.name.toLowerCase(),
      name: person.name,
      clientCount: clientNames.length,
      clientNames,
      overloaded: clientNames.length > CAPACITY_OVERLOAD_THRESHOLD,
    };
  });
  capacity.sort(
    (a, b) => b.clientCount - a.clientCount || a.name.localeCompare(b.name),
  );

  return {
    lanes,
    capacity,
    overallCost: lanes.reduce((sum, lane) => sum + lane.totalCost, 0),
    assignedPeople: capacity.length,
    overloadedCount: capacity.filter((row) => row.overloaded).length,
  };
}

export { CAPACITY_OVERLOAD_THRESHOLD };
