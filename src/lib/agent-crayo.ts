/** Client-safe Crayo Agent composer helpers. No secrets. */

export function buildCrayoShortGoal(input: {
  topic: string;
  script: string;
  clientName?: string | null;
}): string {
  const topic = input.topic.trim();
  const script = input.script.trim();
  const client = input.clientName?.trim();
  const lines = [
    "Make a 9:16 Crayo short via api.crayo.ai.",
    client ? `Client: ${client}` : "No client pinned.",
    topic ? `Topic / hook: ${topic}` : "Invent a tight spoken hook from the client niche if known, otherwise ask is not available — use a generic personal-brand authority hook.",
    script ? `Spoken script:\n${script}` : "Write a 12–20 second spoken hook, then generate_voiceover from it.",
    "Pipeline: crayo.run_short (image + voice + project + export) then crayo.ingest_to_library so the mp4 lands in the Filebase library with tags crayo,agent.",
    "Return the library asset id, preview URL, and Crayo video URL. Never start the Social Machine. Never echo the API key. Never invent URLs.",
  ];
  return lines.join("\n\n");
}

export function isCrayoMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === "cdn-crayo.com" ||
      host.endsWith(".cdn-crayo.com") ||
      host === "crayo.ai" ||
      host.endsWith(".crayo.ai")
    );
  } catch {
    return false;
  }
}

export function crayoShortFieldsFromGoal(goal: string): { prompt: string; script: string } {
  const topic = /Topic \/ hook:\s*(.+)/i.exec(goal)?.[1]?.trim() ?? "";
  const scriptBlock = /Spoken script:\s*\n([\s\S]*?)(?:\n\nPipeline:|\n\nReturn |\n\nNever )/i.exec(goal)?.[1]?.trim() ?? "";
  const fallback = goal.replace(/\s+/g, " ").trim().slice(0, 400);
  return { prompt: topic || fallback, script: scriptBlock };
}

export function crayoAutoclipFieldsFromGoal(goal: string): { url: string; clipCount: number } {
  const url = /https:\/\/[^\s)]+/i.exec(goal)?.[0] ?? "";
  const count = Number(/clip_count=(\d+)/i.exec(goal)?.[1] ?? 5);
  return { url, clipCount: Number.isFinite(count) ? Math.min(20, Math.max(2, Math.floor(count))) : 5 };
}

export function buildCrayoAutoclipGoal(input: { url: string; clipCount: number }): string {
  const url = input.url.trim();
  const count = Number.isFinite(input.clipCount) ? Math.min(20, Math.max(2, Math.floor(input.clipCount))) : 5;
  return [
    "AutoClip a long-form video in Crayo.",
    `Source URL (https): ${url || "(paste a public https video URL)"}`,
    `clip_count=${count} clip_length=60 edit_level=full`,
    "Steps: crayo.run_autoclip (import + AutoClip + poll). Ingest each thumbnail_url with crayo.ingest_to_library. List project_id + library asset ids.",
    "Never invent URLs. Never start the Social Machine. Never echo the API key.",
  ].join("\n\n");
}
