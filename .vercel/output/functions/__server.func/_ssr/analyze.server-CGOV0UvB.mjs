import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { t as llmAvailable } from "./xai.server-D2IejPGx.mjs";
import { i as routedText } from "./llm-router.server-TNnMY3uU.mjs";
import { n as serializeStrategy } from "./strategy-yAcUlYNF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analyze.server-CGOV0UvB.js
function extractJson(text) {
	const start = text.indexOf("{");
	const end = text.lastIndexOf("}");
	if (start < 0 || end <= start) return null;
	try {
		return JSON.parse(text.slice(start, end + 1));
	} catch {
		return null;
	}
}
async function synthesizeChannel(snapshot) {
	if (!await llmAvailable()) throw new Error("AI_UNAVAILABLE");
	const videoLines = snapshot.videos.slice(0, 20).map((video) => {
		const dur = video.durationSeconds == null ? "duration unknown" : `${Math.round(video.durationSeconds / 60)}m ${video.form}`;
		return `- ${video.title} (${dur})`;
	}).join("\n");
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
	const json = extractJson(await routedText({
		feature: "system",
		messages: [{
			role: "user",
			content: prompt
		}],
		temperature: .4,
		maxTokens: 1400,
		timeoutMs: 45e3
	})) ?? {};
	const bullets = (Array.isArray(json.strategy) ? json.strategy : []).map((item) => {
		const row = item;
		return {
			title: sanitizeText(String(row.bullet ?? row.title ?? "").trim()),
			reasoning: sanitizeText(String(row.reasoning ?? "").trim())
		};
	}).filter((item) => item.title);
	return {
		channelSummary: sanitizeText(String(json.channelSummary ?? "").trim()),
		offers: sanitizeText(String(json.offers ?? "").trim()),
		contentStrategy: serializeStrategy({
			bullets,
			growth: sanitizeText(String(json.growth ?? "").trim()),
			style: sanitizeText(String(json.style ?? "").trim())
		})
	};
}
//#endregion
export { llmAvailable, synthesizeChannel };
