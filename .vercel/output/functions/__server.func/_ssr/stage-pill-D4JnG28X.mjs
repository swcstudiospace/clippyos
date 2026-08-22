import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { C as STAGE_TONES, S as STAGE_LABELS, b as SOURCE_LABELS, x as SOURCE_TONES } from "./dashboard-Dk6DLyWe.mjs";
import { t as Badge } from "./badge-CDaEWAH4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stage-pill-D4JnG28X.js
var import_jsx_runtime = require_jsx_runtime();
function StagePill({ stage }) {
	if (!stage) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: "neutral",
		className: "font-medium",
		children: "Not started"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: STAGE_TONES[stage],
		className: "font-medium",
		children: STAGE_LABELS[stage]
	});
}
function SourceBadge({ source }) {
	if (!source) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: SOURCE_TONES[source],
		children: SOURCE_LABELS[source]
	});
}
//#endregion
export { StagePill as n, SourceBadge as t };
