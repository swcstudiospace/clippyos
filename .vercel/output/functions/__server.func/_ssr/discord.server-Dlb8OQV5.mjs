import { r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
import { r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/discord.server-Dlb8OQV5.js
var discord_server_Dlb8OQV5_exports = /* @__PURE__ */ __exportAll({
	a: () => readRecentGuildMessages,
	i: () => loadDiscordToken,
	n: () => last4,
	r: () => listDiscordGuilds,
	t: () => discord_server_exports
});
var discord_server_exports = /* @__PURE__ */ __exportAll$1({
	last4: () => last4,
	listDiscordGuilds: () => listDiscordGuilds,
	loadDiscordToken: () => loadDiscordToken,
	readRecentGuildMessages: () => readRecentGuildMessages,
	testDiscordToken: () => testDiscordToken
});
var API = "https://discord.com/api/v10";
var TOKEN_KEYS = ["DISCORD_BOT_TOKEN", "DISCORD_TOKEN"];
function looksRedacted(value) {
	return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}
async function loadDiscordToken() {
	const env = process.env.DISCORD_BOT_TOKEN?.trim() || process.env.DISCORD_TOKEN?.trim() || "";
	if (env && !looksRedacted(env)) return env;
	for (const key of TOKEN_KEYS) {
		const value = (await readAppSetting(key))?.trim() ?? "";
		if (value && !looksRedacted(value)) return value;
	}
	return null;
}
async function discordGet(path, token) {
	const response = await fetch(`${API}${path}`, {
		headers: {
			Authorization: `Bot ${token}`,
			"User-Agent": "ClippyAdmin (read-only; +https://clippy.admin)"
		},
		signal: AbortSignal.timeout(15e3)
	});
	if (!response.ok) return {
		ok: false,
		status: response.status
	};
	return {
		ok: true,
		data: await response.json()
	};
}
async function testDiscordToken(token) {
	const me = await discordGet("/users/@me", token);
	if (!me.ok) {
		if (me.status === 401) return {
			ok: false,
			reason: "The bot token was rejected."
		};
		if (me.status === 429) return {
			ok: false,
			reason: "Discord is rate-limiting this bot. Retry shortly."
		};
		return {
			ok: false,
			reason: "Couldn’t reach Discord."
		};
	}
	const guilds = await discordGet("/users/@me/guilds", token);
	if (!guilds.ok) return {
		ok: true,
		guilds: 0
	};
	return {
		ok: true,
		guilds: Array.isArray(guilds.data) ? guilds.data.length : 0
	};
}
async function listDiscordGuilds(token) {
	const result = await discordGet("/users/@me/guilds", token);
	if (!result.ok || !Array.isArray(result.data)) return [];
	return result.data.filter((row) => row.id && row.name).map((row) => ({
		id: String(row.id),
		name: String(row.name)
	}));
}
async function readRecentGuildMessages(token, guildId, limitPerChannel = 20) {
	const channels = await discordGet(`/guilds/${guildId}/channels`, token);
	if (!channels.ok || !Array.isArray(channels.data)) return [];
	const text = channels.data.filter((row) => row.id && row.type === 0);
	const out = [];
	for (const channel of text.slice(0, 12)) {
		const messages = await discordGet(`/channels/${channel.id}/messages?limit=${limitPerChannel}`, token);
		if (!messages.ok || !Array.isArray(messages.data)) continue;
		for (const row of messages.data) {
			const content = typeof row.content === "string" ? row.content.trim() : "";
			if (!content) continue;
			out.push({
				id: String(row.id ?? ""),
				content,
				timestamp: String(row.timestamp ?? "")
			});
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	out.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
	return out;
}
function last4(value) {
	if (!value) return null;
	const trimmed = value.trim();
	if (trimmed.length < 4) return "••••";
	return `••••${trimmed.slice(-4)}`;
}
//#endregion
export { readRecentGuildMessages as a, loadDiscordToken as i, last4 as n, listDiscordGuilds as r, discord_server_Dlb8OQV5_exports as t };
