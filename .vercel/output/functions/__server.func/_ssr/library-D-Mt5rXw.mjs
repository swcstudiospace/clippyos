//#region node_modules/.nitro/vite/services/ssr/assets/library-D-Mt5rXw.js
var LIBRARY_QUERY_KEY = ["library"];
var LIBRARY_MEDIA_SETTINGS_KEY = ["library-media-settings"];
var ASSET_KINDS = [
	"VIDEO",
	"IMAGE",
	"AUDIO",
	"SUBTITLE",
	"OTHER"
];
var ASSET_SOURCES = [
	"UPLOAD",
	"TWITCH_CLIP",
	"YOUTUBE",
	"THUMBNAIL_GEN",
	"RENDER_OUTPUT",
	"URL_IMPORT",
	"AGENT"
];
var ASSET_STATUSES = [
	"PROCESSING",
	"READY",
	"FAILED",
	"ARCHIVED"
];
var CAPTION_STATUSES = [
	"PENDING",
	"TRANSCRIBING",
	"READY",
	"FAILED"
];
var CAPTION_FORMATS = [
	"JSON_CUES",
	"SRT",
	"VTT"
];
var CAPTION_ENGINES = [
	"WHISPER_LOCAL",
	"XAI_OR_PROVIDER",
	"MANUAL"
];
var RENDER_PRESETS = [
	"REELS_9x16",
	"SQUARE_1x1",
	"LANDSCAPE_16x9",
	"CUSTOM"
];
var RENDER_STATUSES = [
	"QUEUED",
	"RUNNING",
	"SUCCEEDED",
	"FAILED",
	"CANCELED"
];
var RENDER_WORKERS = ["BASE44_FN", "DAYTONA"];
var DEFAULT_RENDER_OPTIONS = {
	burnInCaptions: false,
	format: "mp4"
};
var PRESET_SIZE = {
	REELS_9x16: {
		width: 1080,
		height: 1920
	},
	SQUARE_1x1: {
		width: 1080,
		height: 1080
	},
	LANDSCAPE_16x9: {
		width: 1920,
		height: 1080
	}
};
var DEFAULT_MEDIA_SETTINGS = {
	transcriptionConfigured: false,
	transcriptionEngine: "MANUAL",
	transcriptionHint: "Connect transcription in Settings — or upload an SRT to caption manually.",
	defaultPreset: "REELS_9x16",
	maxUploadMb: 256,
	concurrentRenders: 1,
	daytonaRender: false,
	ffmpegAvailable: false,
	ffmpegVersion: null,
	libraryBackend: "local",
	libraryBackendHint: "Preview is using local disk. Connect immutable cloud storage so library files survive deploys. Do not store clips on the Social Machine.",
	s3Configured: false,
	s3Bucket: null,
	s3Endpoint: null,
	ipfsConfigured: false,
	ipfsGateway: null,
	ipfsLastCid: null,
	ipfsStrategy: "eager",
	ipfsStrategyHint: "Pins every new clip after it lands in immutable cloud storage."
};
var KIND_LABELS = {
	VIDEO: "Video",
	IMAGE: "Image",
	AUDIO: "Audio",
	SUBTITLE: "Subtitle",
	OTHER: "Other"
};
var SOURCE_LABELS = {
	UPLOAD: "Upload",
	TWITCH_CLIP: "Twitch",
	YOUTUBE: "YouTube",
	THUMBNAIL_GEN: "Thumbnail",
	RENDER_OUTPUT: "Render",
	URL_IMPORT: "URL",
	AGENT: "Agent"
};
var PRESET_LABELS = {
	REELS_9x16: "Reels 9:16",
	SQUARE_1x1: "Square 1:1",
	LANDSCAPE_16x9: "Landscape 16:9",
	CUSTOM: "Custom"
};
function formatDurationSec(value) {
	if (value == null || !Number.isFinite(value) || value <= 0) return "";
	const total = Math.round(value);
	const minutes = Math.floor(total / 60);
	const seconds = total % 60;
	if (minutes >= 60) return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
function formatBytes(value) {
	if (value == null || !Number.isFinite(value) || value < 0) return "";
	if (value < 1024) return `${value} B`;
	if (value < 1048576) return `${(value / 1024).toFixed(1)} KB`;
	if (value < 1073741824) return `${(value / 1048576).toFixed(1)} MB`;
	return `${(value / 1073741824).toFixed(1)} GB`;
}
function formatTimecode(ms) {
	const t = Math.max(0, Math.round(ms));
	const hours = Math.floor(t / 36e5);
	const minutes = Math.floor(t % 36e5 / 6e4);
	const seconds = Math.floor(t % 6e4 / 1e3);
	const hundredths = Math.floor(t % 1e3 / 10);
	if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
	return `${minutes}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}
function parseTimecode(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const match = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/.exec(trimmed);
	if (match) {
		const hours = Number(match[1] ?? 0);
		const minutes = Number(match[2]);
		const seconds = Number(match[3]);
		const ms = (match[4] ?? "").padEnd(3, "0").slice(0, 3);
		if (![
			hours,
			minutes,
			seconds
		].every(Number.isFinite) || minutes > 59 || seconds > 59) return null;
		return hours * 36e5 + minutes * 6e4 + seconds * 1e3 + Number(ms);
	}
	const asNumber = Number(trimmed);
	if (!Number.isFinite(asNumber) || asNumber < 0) return null;
	return Math.round(asNumber * 1e3);
}
function pad2(n) {
	return String(n).padStart(2, "0");
}
function cueStamp(ms, fractionalSep) {
	const t = Math.max(0, Math.round(ms));
	const hours = Math.floor(t / 36e5);
	const minutes = Math.floor(t % 36e5 / 6e4);
	const seconds = Math.floor(t % 6e4 / 1e3);
	const frac = t % 1e3;
	return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}${fractionalSep}${String(frac).padStart(3, "0")}`;
}
function cuesToSrt(cues) {
	return cues.map((cue, index) => {
		return `${index + 1}\n${cueStamp(cue.startMs, ",")} --> ${cueStamp(cue.endMs, ",")}\n${cue.text.trim()}\n`;
	}).join("\n");
}
function cuesToVtt(cues) {
	return `WEBVTT\n\n${cues.map((cue) => `${cueStamp(cue.startMs, ".")} --> ${cueStamp(cue.endMs, ".")}\n${cue.text.trim()}\n`).join("\n")}`;
}
//#endregion
export { parseTimecode as C, formatTimecode as S, SOURCE_LABELS as _, CAPTION_FORMATS as a, formatBytes as b, DEFAULT_RENDER_OPTIONS as c, LIBRARY_QUERY_KEY as d, PRESET_LABELS as f, RENDER_WORKERS as g, RENDER_STATUSES as h, CAPTION_ENGINES as i, KIND_LABELS as l, RENDER_PRESETS as m, ASSET_SOURCES as n, CAPTION_STATUSES as o, PRESET_SIZE as p, ASSET_STATUSES as r, DEFAULT_MEDIA_SETTINGS as s, ASSET_KINDS as t, LIBRARY_MEDIA_SETTINGS_KEY as u, cuesToSrt as v, formatDurationSec as x, cuesToVtt as y };
