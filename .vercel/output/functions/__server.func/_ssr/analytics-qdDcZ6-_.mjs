//#region node_modules/.nitro/vite/services/ssr/assets/analytics-qdDcZ6-_.js
var ANALYTICS_QUERY_KEY = ["analytics"];
var SNAPSHOT_JSON_CAP = 64e3;
function toNum(value) {
	if (value == null || value === "") return null;
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n) || n < 0) return null;
	return n;
}
function parseTopVideos(raw) {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		const out = [];
		for (const item of parsed.slice(0, 50)) {
			if (!item || typeof item !== "object") continue;
			const row = item;
			const videoId = String(row.videoId ?? "").trim();
			const title = String(row.title ?? "").trim();
			if (!videoId && !title) continue;
			const duration = toNum(row.durationSeconds);
			out.push({
				videoId,
				title: title.slice(0, 300),
				views: toNum(row.views),
				likes: toNum(row.likes),
				durationSeconds: duration,
				publishedAt: row.publishedAt == null ? null : String(row.publishedAt),
				thumbnail: row.thumbnail == null ? null : String(row.thumbnail),
				url: typeof row.url === "string" && row.url.startsWith("https://") ? row.url : videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
				isLongForm: row.isLongForm === true || duration != null && duration >= 240
			});
		}
		return out;
	} catch {
		return [];
	}
}
function parseSnapshot(row) {
	return {
		...row,
		viewsN: toNum(row.views),
		subscribersN: toNum(row.subscribers),
		watchHoursN: toNum(row.watchHours),
		ctrN: toNum(row.impressionsCtr),
		videos: parseTopVideos(row.topVideos)
	};
}
function latestByClient(snapshots) {
	const map = /* @__PURE__ */ new Map();
	const sorted = [...snapshots].sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
	for (const row of sorted) if (!map.has(row.clientId)) map.set(row.clientId, parseSnapshot(row));
	return map;
}
function snapshotsForClient(snapshots, clientId) {
	return snapshots.filter((row) => row.clientId === clientId).sort((a, b) => a.date < b.date ? -1 : 1).map(parseSnapshot);
}
function averageCtr(history) {
	const values = history.map((row) => row.ctrN).filter((n) => n != null);
	if (values.length === 0) return null;
	return values.reduce((sum, n) => sum + n, 0) / values.length;
}
function aggregateLatest(rows) {
	let subscribers = 0;
	let views = 0;
	let watchHours = 0;
	let ctrSum = 0;
	let subN = 0;
	let viewN = 0;
	let watchN = 0;
	let ctrN = 0;
	let clientsWithData = 0;
	for (const row of rows) {
		if (!row.latest) continue;
		clientsWithData += 1;
		if (row.latest.subscribersN != null) {
			subscribers += row.latest.subscribersN;
			subN += 1;
		}
		if (row.latest.viewsN != null) {
			views += row.latest.viewsN;
			viewN += 1;
		}
		if (row.latest.watchHoursN != null) {
			watchHours += row.latest.watchHoursN;
			watchN += 1;
		}
		if (row.latest.ctrN != null) {
			ctrSum += row.latest.ctrN;
			ctrN += 1;
		}
	}
	return {
		subscribers: subN ? subscribers : null,
		views: viewN ? views : null,
		watchHours: watchN ? watchHours : null,
		ctr: ctrN ? ctrSum / ctrN : null,
		clientsWithData
	};
}
//#endregion
export { latestByClient as a, averageCtr as i, SNAPSHOT_JSON_CAP as n, snapshotsForClient as o, aggregateLatest as r, ANALYTICS_QUERY_KEY as t };
