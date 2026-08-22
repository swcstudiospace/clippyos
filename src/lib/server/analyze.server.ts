import { sanitizeText } from "@/lib/sanitize";
import { serializeStrategy } from "@/lib/strategy";
import type { ChannelSnapshot } from "@/lib/server/youtube.server";
import { llmAvailable } from "@/lib/server/xai.server";
import { routedText } from "@/lib/server/llm-router.server";

export type AnalysisResult = {
  name: string;
  channelUrl: string;
  channelThumbnail: string | null;
  channelSummary: string;
  offers: string;
  contentStrategy: string;
  subscriberCount: string | null;
};

export { llmAvailable };

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function synthesizeChannel(
  snapshot: ChannelSnapshot,
): Promise<Pick<AnalysisResult, "channelSummary" | "offers" | "contentStrategy">> {
  if (!(await llmAvailable())) throw new Error("AI_UNAVAILABLE");

  const videoLines = snapshot.videos
    .slice(0, 20)
    .map((video) => {
      const dur =
        video.durationSeconds == null
          ? "duration unknown"
          : `${Math.round(video.durationSeconds / 60)}m ${video.form}`;
      return `- ${video.title} (${dur})`;
    })
    .join("\n");

  const prompt = `You analyze YouTube channels for a content agency. Classify long-form as duration >= 4 minutes; short-form is under 4 minutes. Ignore YouTube's Shorts tab.

Channel: ${snapshot.title}
URL: ${snapshot.canonicalUrl}
Subscribers: ${snapshot.subscriberCount ?? "unknown"}
Description: ${snapshot.description.slice(0, 1200)}

Recent uploads:
${videoLines || "(none)"}

Return JSON only:
{
  "channelSummary": "2-4 sentence summary of the channel",
  "offers": "what they sell or monetize, or 'Unclear' if unknown",
  "style": "content style in one sentence",
  "growth": "one growth opportunity",
  "strategy": [{"bullet": "one-sentence actionable recommendation", "reasoning": "2-4 sentences of why"}]
}
Give 4 to 6 strategy bullets. No markdown. No extra keys.`;

  const text = await routedText({
    feature: "system",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    maxTokens: 1400,
    timeoutMs: 45000,
  });
  const json = extractJson(text) ?? {};
  const strategyRaw = Array.isArray(json.strategy) ? json.strategy : [];
  const bullets = strategyRaw
    .map((item) => {
      const row = item as { bullet?: string; title?: string; reasoning?: string };
      return {
        title: sanitizeText(String(row.bullet ?? row.title ?? "").trim()),
        reasoning: sanitizeText(String(row.reasoning ?? "").trim()),
      };
    })
    .filter((item) => item.title);

  return {
    channelSummary: sanitizeText(String(json.channelSummary ?? "").trim()),
    offers: sanitizeText(String(json.offers ?? "").trim()),
    contentStrategy: serializeStrategy({
      bullets,
      growth: sanitizeText(String(json.growth ?? "").trim()),
      style: sanitizeText(String(json.style ?? "").trim()),
    }),
  };
}
