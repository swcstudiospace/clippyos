import { r as __exportAll } from "../_runtime.mjs";
import { d as __exportAll$1 } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/linear-CrgEmECq.js
var linear_CrgEmECq_exports = /* @__PURE__ */ __exportAll({
	a: () => LINEAR_DEFAULT_MILESTONES,
	c: () => LINEAR_LINKS_QUERY_KEY,
	d: () => isLinearColumn,
	f: () => isLinearEntityType,
	i: () => LINEAR_COLUMN_LABELS,
	l: () => LINEAR_QUERY_KEY,
	n: () => EMPTY_STATE_MAP,
	o: () => LINEAR_ENTITY_TYPES,
	p: () => linear_exports,
	r: () => LINEAR_COLUMN_HINTS,
	s: () => LINEAR_KANBAN_COLUMNS,
	t: () => DEFAULT_LINEAR_FLAGS,
	u: () => guessColumnFromType
});
var linear_exports = /* @__PURE__ */ __exportAll$1({
	DEFAULT_LINEAR_FLAGS: () => DEFAULT_LINEAR_FLAGS,
	EMPTY_STATE_MAP: () => EMPTY_STATE_MAP,
	LINEAR_COLUMN_HINTS: () => LINEAR_COLUMN_HINTS,
	LINEAR_COLUMN_LABELS: () => LINEAR_COLUMN_LABELS,
	LINEAR_DEFAULT_MILESTONES: () => LINEAR_DEFAULT_MILESTONES,
	LINEAR_ENTITY_TYPES: () => LINEAR_ENTITY_TYPES,
	LINEAR_KANBAN_COLUMNS: () => LINEAR_KANBAN_COLUMNS,
	LINEAR_LINKS_QUERY_KEY: () => LINEAR_LINKS_QUERY_KEY,
	LINEAR_QUERY_KEY: () => LINEAR_QUERY_KEY,
	guessColumnFromName: () => guessColumnFromName,
	guessColumnFromType: () => guessColumnFromType,
	isLinearColumn: () => isLinearColumn,
	isLinearEntityType: () => isLinearEntityType
});
/** Client-safe Linear Kanban bridge. Secrets never live here. */
var LINEAR_QUERY_KEY = ["linear"];
var LINEAR_LINKS_QUERY_KEY = ["linear-links"];
var LINEAR_ENTITY_TYPES = [
	"AgentRun",
	"RenderJob",
	"SocialUploadJob",
	"KnowledgeProposal",
	"ApprovalRequest",
	"Milestone"
];
var LINEAR_KANBAN_COLUMNS = [
	"backlog",
	"ready",
	"inProgress",
	"inReview",
	"done"
];
var LINEAR_COLUMN_LABELS = {
	backlog: "Backlog",
	ready: "Ready",
	inProgress: "In Progress",
	inReview: "In Review",
	done: "Done"
};
var LINEAR_COLUMN_HINTS = {
	backlog: "Not scheduled",
	ready: "Specced, unblocked",
	inProgress: "Active build / running job",
	inReview: "PR / approval / client review",
	done: "Shipped / job succeeded"
};
var LINEAR_DEFAULT_MILESTONES = [
	"M1",
	"M2",
	"M3",
	"M4",
	"M5",
	"M6",
	"M7"
];
var EMPTY_STATE_MAP = {
	backlog: null,
	ready: null,
	inProgress: null,
	inReview: null,
	done: null
};
var DEFAULT_LINEAR_FLAGS = {
	enabled: false,
	syncJobs: false,
	autoIssueOnFail: true,
	autoIssueOnProposal: false,
	membersCanCreate: false,
	failColumn: "inProgress"
};
function isLinearEntityType(value) {
	return typeof value === "string" && LINEAR_ENTITY_TYPES.includes(value);
}
function isLinearColumn(value) {
	return typeof value === "string" && LINEAR_KANBAN_COLUMNS.includes(value);
}
function guessColumnFromName(name) {
	const n = name.trim().toLowerCase();
	if (n === "backlog" || n === "triage") return "backlog";
	if (n === "ready" || n === "todo" || n === "to do" || n === "unstarted") return "ready";
	if (n === "in progress" || n === "in-progress" || n === "started" || n === "doing") return "inProgress";
	if (n === "in review" || n === "in-review" || n === "review" || n === "in qa") return "inReview";
	if (n === "done" || n === "completed" || n === "shipped" || n === "closed") return "done";
	return null;
}
function guessColumnFromType(type, name) {
	const fromName = guessColumnFromName(name);
	if (fromName) return fromName;
	switch (type) {
		case "backlog":
		case "triage": return "backlog";
		case "unstarted": return "ready";
		case "started": return "inProgress";
		case "completed": return "done";
		default: return null;
	}
}
//#endregion
export { LINEAR_DEFAULT_MILESTONES as a, LINEAR_LINKS_QUERY_KEY as c, isLinearColumn as d, isLinearEntityType as f, LINEAR_COLUMN_LABELS as i, LINEAR_QUERY_KEY as l, EMPTY_STATE_MAP as n, LINEAR_ENTITY_TYPES as o, linear_CrgEmECq_exports as p, LINEAR_COLUMN_HINTS as r, LINEAR_KANBAN_COLUMNS as s, DEFAULT_LINEAR_FLAGS as t, guessColumnFromType as u };
