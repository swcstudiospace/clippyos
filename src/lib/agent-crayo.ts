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
    topic
      ? `Topic / hook: ${topic}`
      : "Invent a tight spoken hook from the client niche if known, otherwise ask is not available — use a generic personal-brand authority hook.",
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
  const scriptBlock =
    /Spoken script:\s*\n([\s\S]*?)(?:\n\nPipeline:|\n\nReturn |\n\nNever )/i.exec(goal)?.[1]?.trim() ?? "";
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

export function buildCrayoVoiceoverGoal(input: {
  script: string;
  voiceId: string;
  title?: string;
}): string {
  const script = input.script.trim();
  const voiceId = input.voiceId.trim();
  const title = input.title?.trim().slice(0, 25) ?? "";
  return [
    "Generate a Crayo voiceover via api.crayo.ai.",
    script ? `Spoken script:\n${script}` : "Spoken script is required.",
    voiceId ? `voice_id=${voiceId}` : "Pick a voice_id from crayo.list_voices first.",
    title ? `title=${title}` : "",
    "Pipeline: crayo.generate_voiceover then return the audio URL. Ingest a Crayo CDN file with crayo.ingest_to_library when present.",
    "Never start the Social Machine. Never echo the API key. Never invent URLs.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function crayoVoiceoverFieldsFromGoal(goal: string): { script: string; voiceId: string; title: string } {
  const script =
    /Spoken script:\s*\n([\s\S]*?)(?:\n\nvoice_id=|\n\ntitle=|\n\nPipeline:|\n\nNever )/i.exec(goal)?.[1]?.trim() ??
    "";
  const voiceId = /voice_id=([^\s]+)/i.exec(goal)?.[1]?.trim() ?? "";
  const title = /title=([^\n]+)/i.exec(goal)?.[1]?.trim() ?? "";
  return { script, voiceId, title };
}

export function buildCrayoImageGoal(input: { prompt: string; aspectRatio?: string }): string {
  const prompt = input.prompt.trim();
  const aspect = (input.aspectRatio ?? "9:16").trim() || "9:16";
  return [
    "Generate a Crayo still via api.crayo.ai.",
    prompt ? `Prompt: ${prompt}` : "Prompt is required.",
    `aspect_ratio=${aspect}`,
    "Pipeline: crayo.generate_image then return the image URL. Ingest a Crayo CDN file with crayo.ingest_to_library when present.",
    "Never start the Social Machine. Never echo the API key. Never invent URLs.",
  ].join("\n\n");
}

export function crayoImageFieldsFromGoal(goal: string): { prompt: string; aspectRatio: string } {
  const prompt = /Prompt:\s*(.+)/i.exec(goal)?.[1]?.trim() ?? "";
  const aspectRatio = /aspect_ratio=([^\s]+)/i.exec(goal)?.[1]?.trim() || "9:16";
  return { prompt, aspectRatio };
}

export function buildCrayoImportGoal(input: { url: string; name?: string }): string {
  const url = input.url.trim();
  const name = input.name?.trim() ?? "";
  return [
    "Import a public https file into Crayo assets.",
    `Source URL (https): ${url || "(paste a public https URL, ≤100MB)"}`,
    name ? `name=${name}` : "",
    "Pipeline: crayo.import_asset. Return the asset id. Never start the Social Machine. Never echo the API key.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function crayoImportFieldsFromGoal(goal: string): { url: string; name: string } {
  const url = /https:\/\/[^\s)]+/i.exec(goal)?.[0] ?? "";
  const name = /name=([^\n]+)/i.exec(goal)?.[1]?.trim() ?? "";
  return { url, name };
}

export function buildCrayoExportGoal(input: { projectId: string }): string {
  const projectId = input.projectId.trim();
  return [
    "Export a Crayo project and poll until the file is ready.",
    projectId ? `project_id=${projectId}` : "project_id is required.",
    "Pipeline: crayo.export_project then crayo.get_export / poll. Return the video URL. Never invent URLs. Never start the Social Machine. Never echo the API key.",
  ].join("\n\n");
}

export function crayoExportFieldsFromGoal(goal: string): { projectId: string } {
  const projectId = /project_id=([^\s]+)/i.exec(goal)?.[1]?.trim() ?? "";
  return { projectId };
}

export function buildCrayoIngestGoal(input: { url: string; title?: string }): string {
  const url = input.url.trim();
  const title = input.title?.trim() ?? "";
  return [
    "Ingest a Crayo CDN https file into the Filebase library (source=AGENT).",
    `Source URL (https): ${url || "(paste a cdn-crayo.com or *.crayo.ai https URL)"}`,
    title ? `title=${title}` : "",
    "Pipeline: crayo.ingest_to_library. Reject non-Crayo hosts. Never start the Social Machine. Never echo the API key.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function crayoIngestFieldsFromGoal(goal: string): { url: string; title: string } {
  const url = /https:\/\/[^\s)]+/i.exec(goal)?.[0] ?? "";
  const title = /title=([^\n]+)/i.exec(goal)?.[1]?.trim() ?? "";
  return { url, title };
}
