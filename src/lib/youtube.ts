/** Client-safe YouTube channel URL parsing. No network. */

const CHANNEL_ID = /^UC[\w-]{21,}$/;
const HANDLE = /^@[\w.-]{2,30}$/;

export type ParsedYouTubeUrl =
  | {
      ok: true;
      canonical: string;
      kind: "handle" | "channel" | "user" | "c" | "video";
      value: string;
    }
  | { ok: false; error: string };

function stripWww(host: string): string {
  return host.replace(/^www\./i, "").replace(/^m\./i, "").replace(/^music\./i, "");
}

export function parseYouTubeChannelUrl(raw: string): ParsedYouTubeUrl {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Paste a YouTube channel URL." };
  if (CHANNEL_ID.test(trimmed)) {
    return {
      ok: true,
      kind: "channel",
      value: trimmed,
      canonical: `https://www.youtube.com/channel/${trimmed}`,
    };
  }
  if (trimmed.startsWith("@") && HANDLE.test(trimmed)) {
    return {
      ok: true,
      kind: "handle",
      value: trimmed,
      canonical: `https://www.youtube.com/${trimmed}`,
    };
  }
  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, error: "That doesn’t look like a valid URL." };
  }
  const host = stripWww(url.hostname.toLowerCase());
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0] ?? "";
    if (!id) return { ok: false, error: "That youtu.be link is missing a video id." };
    return {
      ok: true,
      kind: "video",
      value: id,
      canonical: `https://www.youtube.com/watch?v=${id}`,
    };
  }
  if (host !== "youtube.com") {
    return { ok: false, error: "Use a youtube.com or youtu.be link." };
  }
  const parts = url.pathname.split("/").filter(Boolean);
  const first = parts[0] ?? "";
  if (first.startsWith("@")) {
    const handle = first.startsWith("@") ? first : `@${first}`;
    if (!HANDLE.test(handle)) {
      return { ok: false, error: "That channel handle doesn’t look valid." };
    }
    return {
      ok: true,
      kind: "handle",
      value: handle,
      canonical: `https://www.youtube.com/${handle}`,
    };
  }
  if (first === "channel" && parts[1]) {
    if (!CHANNEL_ID.test(parts[1])) {
      return { ok: false, error: "That /channel/ id doesn’t look valid." };
    }
    return {
      ok: true,
      kind: "channel",
      value: parts[1],
      canonical: `https://www.youtube.com/channel/${parts[1]}`,
    };
  }
  if (first === "c" && parts[1]) {
    return {
      ok: true,
      kind: "c",
      value: parts[1],
      canonical: `https://www.youtube.com/c/${parts[1]}`,
    };
  }
  if (first === "user" && parts[1]) {
    return {
      ok: true,
      kind: "user",
      value: parts[1],
      canonical: `https://www.youtube.com/user/${parts[1]}`,
    };
  }
  if (first === "watch") {
    const id = url.searchParams.get("v") ?? "";
    if (!id) return { ok: false, error: "That watch URL is missing a video id." };
    return {
      ok: true,
      kind: "video",
      value: id,
      canonical: `https://www.youtube.com/watch?v=${id}`,
    };
  }
  if (first === "shorts" && parts[1]) {
    return {
      ok: true,
      kind: "video",
      value: parts[1],
      canonical: `https://www.youtube.com/watch?v=${parts[1]}`,
    };
  }
  return {
    ok: false,
    error: "Use a youtube.com/@, /channel/, /c/, /user/, or video URL.",
  };
}

export function isYouTubeChannelUrl(raw: string): boolean {
  return parseYouTubeChannelUrl(raw).ok;
}
