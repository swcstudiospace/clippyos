/** Pull operator-visible media and copy out of an Agent run. */

import type { AgentRunDetail } from "@/lib/agent";

export type AgentResultMedia = {
  url: string;
  kind: "video" | "image" | "audio" | "link";
  label: string;
};

export type AgentVisualResults = {
  media: AgentResultMedia[];
  ideas: { title: string; rationale?: string }[];
  titles: string[];
  summary: string | null;
  empty: boolean;
};

const URL_RE = /https:\/\/[^\s"'<>]+/g;

function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function classify(url: string): AgentResultMedia["kind"] {
  const lower = url.toLowerCase();
  if (/\.(mp4|webm|mov)(\?|$)/.test(lower) || /\/video\./.test(lower) || lower.includes("cdn-crayo.com") && lower.includes("video")) {
    return "video";
  }
  if (/\.(png|jpe?g|webp|gif)(\?|$)/.test(lower) || lower.includes("thumbnail") || lower.includes("/image")) {
    return "image";
  }
  if (/\.(mp3|wav|m4a)(\?|$)/.test(lower)) return "audio";
  return "link";
}

function pushUrl(acc: AgentResultMedia[], url: string, label: string) {
  const clean = url.replace(/[),.;]+$/, "");
  if (!isHttps(clean)) return;
  if (acc.some((row) => row.url === clean)) return;
  acc.push({ url: clean, kind: classify(clean), label: label.slice(0, 80) });
}

function walk(value: unknown, acc: AgentResultMedia[], ideas: AgentVisualResults["ideas"], titles: string[], depth = 0) {
  if (depth > 8 || value == null) return;
  if (typeof value === "string") {
    const matches = value.match(URL_RE) ?? [];
    for (const url of matches) pushUrl(acc, url, "Result");
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walk(item, acc, ideas, titles, depth + 1);
    return;
  }
  if (typeof value !== "object") return;
  const row = value as Record<string, unknown>;
  if (typeof row.title === "string" && typeof row.rationale === "string") {
    ideas.push({ title: row.title, rationale: row.rationale });
  }
  if (Array.isArray(row.alternatives)) {
    for (const alt of row.alternatives) {
      if (typeof alt === "string" && alt.trim()) titles.push(alt.trim());
    }
  }
  for (const [key, child] of Object.entries(row)) {
    if (typeof child === "string" && /url|href|thumbnail/i.test(key) && child.startsWith("https://")) {
      pushUrl(acc, child, key);
    } else {
      walk(child, acc, ideas, titles, depth + 1);
    }
  }
}

export function collectAgentVisualResults(detail: AgentRunDetail): AgentVisualResults {
  const media: AgentResultMedia[] = [];
  const ideas: AgentVisualResults["ideas"] = [];
  const titles: string[] = [];
  walk(detail.run.outputs, media, ideas, titles);
  walk(detail.run.summary, media, ideas, titles);
  for (const item of detail.iterations) {
    walk(item.resultSummary, media, ideas, titles);
  }
  const summary = detail.run.summary?.trim() || null;
  return {
    media,
    ideas: ideas.slice(0, 12),
    titles: titles.slice(0, 24),
    summary,
    empty: media.length === 0 && ideas.length === 0 && titles.length === 0 && !summary,
  };
}
