export type StrategyBullet = {
  title: string;
  reasoning: string;
};

type StrategyDoc = {
  bullets: StrategyBullet[];
  growth?: string;
  style?: string;
};

export function parseStrategy(raw: string | null | undefined): StrategyDoc {
  if (!raw?.trim()) return { bullets: [] };
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as {
      bullets?: Array<{ title?: string; bullet?: string; reasoning?: string }>;
      strategy?: Array<{ title?: string; bullet?: string; reasoning?: string }>;
      growth?: string;
      style?: string;
    };
    const source = parsed.bullets ?? parsed.strategy ?? [];
    if (Array.isArray(source) && source.length > 0) {
      return {
        bullets: source
          .map((item) => ({
            title: String(item.title ?? item.bullet ?? "").trim(),
            reasoning: String(item.reasoning ?? "").trim(),
          }))
          .filter((item) => item.title),
        growth: parsed.growth,
        style: parsed.style,
      };
    }
  } catch {
    /* not JSON — treat as markdown/plain */
  }
  const lines = trimmed
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s+/, "").trim())
    .filter(Boolean);
  return {
    bullets: lines.map((title) => ({ title, reasoning: "" })),
  };
}

export function serializeStrategy(doc: StrategyDoc): string {
  return JSON.stringify(doc);
}
