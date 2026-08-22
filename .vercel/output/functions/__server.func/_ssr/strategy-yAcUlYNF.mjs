//#region node_modules/.nitro/vite/services/ssr/assets/strategy-yAcUlYNF.js
function parseStrategy(raw) {
	if (!raw?.trim()) return { bullets: [] };
	const trimmed = raw.trim();
	try {
		const parsed = JSON.parse(trimmed);
		const source = parsed.bullets ?? parsed.strategy ?? [];
		if (Array.isArray(source) && source.length > 0) return {
			bullets: source.map((item) => ({
				title: String(item.title ?? item.bullet ?? "").trim(),
				reasoning: String(item.reasoning ?? "").trim()
			})).filter((item) => item.title),
			growth: parsed.growth,
			style: parsed.style
		};
	} catch {}
	return { bullets: trimmed.split(/\n+/).map((line) => line.replace(/^[-*•]\s+/, "").trim()).filter(Boolean).map((title) => ({
		title,
		reasoning: ""
	})) };
}
function serializeStrategy(doc) {
	return JSON.stringify(doc);
}
//#endregion
export { serializeStrategy as n, parseStrategy as t };
