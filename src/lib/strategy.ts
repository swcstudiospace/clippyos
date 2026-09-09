export type StrategyBullet = {
  title: string;
  reasoning: string;
};

type StrategyDoc = {
  bullets: StrategyBullet[];
  growth?: string;
  style?: string;
};

/** Reverses sanitizeText's escaping. Only used as a fallback when a stored
 * strategy blob fails to parse as JSON, to recover rows written before the
 * over-sanitization bug (see src/lib/server/clients.ts) was fixed. */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function parseStrategy(raw: string | null | undefined): StrategyDoc {
  if (!raw?.trim()) return { bullets: [] };
  const trimmed = raw.trim();
  let parsed: {
    bullets?: Array<{ title?: string; bullet?: string; reasoning?: string }>;
    strategy?: Array<{ title?: string; bullet?: string; reasoning?: string }>;
    growth?: string;
    style?: string;
  } | null = null;
  for (const candidate of [trimmed, decodeHtmlEntities(trimmed)]) {
    try {
      parsed = JSON.parse(candidate);
      break;
    } catch {
      /* not JSON — try the next candidate, then fall back to markdown/plain */
    }
  }
  if (parsed) {
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

/** Renders a stored strategy doc (JSON or legacy plain text) as human-readable
 * text for editing: "- title" bullets with an indented reasoning line, plus
 * trailing "Style:" / "Growth:" lines. Inverse of `editableTextToStrategy`. */
export function strategyToEditableText(raw: string | null | undefined): string {
  const doc = parseStrategy(raw);
  const lines: string[] = [];
  for (const bullet of doc.bullets) {
    lines.push(`- ${bullet.title}`);
    if (bullet.reasoning) lines.push(`  ${bullet.reasoning}`);
  }
  if (doc.style) lines.push(`Style: ${doc.style}`);
  if (doc.growth) lines.push(`Growth: ${doc.growth}`);
  return lines.join("\n");
}

/** Parses the editable text produced by `strategyToEditableText` (or freehand
 * notes typed by a user) back into the serialized JSON strategy doc. Leaf
 * values are stored raw — every consumer (StrategyBullet, the client detail
 * page) renders them as plain React text, which already escapes on display,
 * so HTML-escaping here would corrupt what the user actually typed (e.g.
 * turn a literal `"` into a visible `&quot;`). Inverse of
 * `strategyToEditableText`. */
export function editableTextToStrategy(text: string): string {
  const bullets: StrategyBullet[] = [];
  let style = "";
  let growth = "";
  let current: StrategyBullet | null = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      current = null;
      continue;
    }
    const styleMatch = /^style:\s*(.*)$/i.exec(line);
    if (styleMatch) {
      style = styleMatch[1].trim();
      current = null;
      continue;
    }
    const growthMatch = /^growth:\s*(.*)$/i.exec(line);
    if (growthMatch) {
      growth = growthMatch[1].trim();
      current = null;
      continue;
    }
    const bulletMatch = /^[-*•]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      current = { title: bulletMatch[1].trim(), reasoning: "" };
      bullets.push(current);
      continue;
    }
    if (current) {
      current.reasoning = current.reasoning ? `${current.reasoning} ${line}` : line;
    } else {
      current = { title: line, reasoning: "" };
      bullets.push(current);
    }
  }
  return serializeStrategy({
    bullets,
    style: style || undefined,
    growth: growth || undefined,
  });
}
