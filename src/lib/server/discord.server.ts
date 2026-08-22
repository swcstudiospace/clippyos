import { readAppSetting } from "@/lib/server/app-settings.server";

const API = "https://discord.com/api/v10";
const TOKEN_KEYS = ["DISCORD_BOT_TOKEN", "DISCORD_TOKEN"] as const;

export type DiscordGuild = { id: string; name: string };
export type DiscordMessage = { id: string; content: string; timestamp: string };

function looksRedacted(value: string): boolean {
  return /[•…]|\.{3}|YOUR_|changeme|placeholder/i.test(value);
}

export async function loadDiscordToken(): Promise<string | null> {
  const env = process.env.DISCORD_BOT_TOKEN?.trim() || process.env.DISCORD_TOKEN?.trim() || "";
  if (env && !looksRedacted(env)) return env;
  for (const key of TOKEN_KEYS) {
    const value = (await readAppSetting(key))?.trim() ?? "";
    if (value && !looksRedacted(value)) return value;
  }
  return null;
}

async function discordGet<T>(path: string, token: string): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bot ${token}`,
      "User-Agent": "ClippyAdmin (read-only; +https://clippy.admin)",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return { ok: false, status: response.status };
  return { ok: true, data: (await response.json()) as T };
}

export async function testDiscordToken(token: string): Promise<{ ok: true; guilds: number } | { ok: false; reason: string }> {
  const me = await discordGet<{ id?: string }>("/users/@me", token);
  if (!me.ok) {
    if (me.status === 401) return { ok: false, reason: "The bot token was rejected." };
    if (me.status === 429) return { ok: false, reason: "Discord is rate-limiting this bot. Retry shortly." };
    return { ok: false, reason: "Couldn’t reach Discord." };
  }
  const guilds = await discordGet<DiscordGuild[]>("/users/@me/guilds", token);
  if (!guilds.ok) {
    return { ok: true, guilds: 0 };
  }
  return { ok: true, guilds: Array.isArray(guilds.data) ? guilds.data.length : 0 };
}

export async function listDiscordGuilds(token: string): Promise<DiscordGuild[]> {
  const result = await discordGet<Array<{ id?: string; name?: string }>>("/users/@me/guilds", token);
  if (!result.ok || !Array.isArray(result.data)) return [];
  return result.data
    .filter((row) => row.id && row.name)
    .map((row) => ({ id: String(row.id), name: String(row.name) }));
}

type Channel = { id: string; type: number };

export async function readRecentGuildMessages(
  token: string,
  guildId: string,
  limitPerChannel = 20,
): Promise<DiscordMessage[]> {
  const channels = await discordGet<Array<{ id?: string; type?: number }>>(
    `/guilds/${guildId}/channels`,
    token,
  );
  if (!channels.ok || !Array.isArray(channels.data)) return [];
  const text = channels.data.filter((row) => row.id && row.type === 0) as Channel[];
  const out: DiscordMessage[] = [];
  for (const channel of text.slice(0, 12)) {
    const messages = await discordGet<Array<{ id?: string; content?: string; timestamp?: string }>>(
      `/channels/${channel.id}/messages?limit=${limitPerChannel}`,
      token,
    );
    if (!messages.ok || !Array.isArray(messages.data)) continue;
    for (const row of messages.data) {
      const content = typeof row.content === "string" ? row.content.trim() : "";
      if (!content) continue;
      out.push({
        id: String(row.id ?? ""),
        content,
        timestamp: String(row.timestamp ?? ""),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  out.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return out;
}

export function last4(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length < 4) return "••••";
  return `••••${trimmed.slice(-4)}`;
}
