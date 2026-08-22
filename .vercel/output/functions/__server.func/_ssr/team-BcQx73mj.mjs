import { i as asMoney, s as isActiveClient } from "./money-n66k7fz5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/team-BcQx73mj.js
function deriveTeam(clients, members) {
	const active = clients.filter(isActiveClient);
	const nameById = new Map(active.map((client) => [client.id, client.name]));
	const lanes = active.map((client) => {
		const team = members.filter((member) => member.clientId === client.id && !member.deletedAt);
		team.sort((a, b) => a.name.localeCompare(b.name) || a.role.localeCompare(b.role));
		return {
			clientId: client.id,
			clientName: client.name,
			members: team,
			totalCost: team.reduce((sum, member) => sum + asMoney(member.cost), 0)
		};
	});
	lanes.sort((a, b) => a.clientName.localeCompare(b.clientName));
	const people = /* @__PURE__ */ new Map();
	for (const member of members) {
		if (member.deletedAt) continue;
		const clientName = nameById.get(member.clientId);
		if (!clientName) continue;
		const key = member.name.trim().toLowerCase();
		if (!key) continue;
		const record = people.get(key) ?? {
			name: member.name.trim(),
			clients: /* @__PURE__ */ new Set()
		};
		record.clients.add(clientName);
		people.set(key, record);
	}
	const capacity = [...people.values()].map((person) => {
		const clientNames = [...person.clients].sort((a, b) => a.localeCompare(b));
		return {
			key: person.name.toLowerCase(),
			name: person.name,
			clientCount: clientNames.length,
			clientNames,
			overloaded: clientNames.length > 3
		};
	});
	capacity.sort((a, b) => b.clientCount - a.clientCount || a.name.localeCompare(b.name));
	return {
		lanes,
		capacity,
		overallCost: lanes.reduce((sum, lane) => sum + lane.totalCost, 0),
		assignedPeople: capacity.length,
		overloadedCount: capacity.filter((row) => row.overloaded).length
	};
}
//#endregion
export { deriveTeam as t };
