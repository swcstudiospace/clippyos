import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { t as Badge } from "./badge-CDaEWAH4.mjs";
import { h as VERDICT_LABELS } from "./performance-Cj9pmeSi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/score-badge-IJk18-LU.js
var import_jsx_runtime = require_jsx_runtime();
function ScoreBadge({ score, verdict }) {
	if (score == null && (!verdict || verdict === "UNKNOWN")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: "neutral",
		children: "No score yet"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
		tone: verdict === "WINNER" ? "green" : verdict === "WEAK" ? "red" : verdict === "NEUTRAL" ? "blue" : "neutral",
		children: [score != null ? `Score ${score}` : "", verdict && verdict !== "UNKNOWN" ? `${score != null ? " · " : ""}${VERDICT_LABELS[verdict]}` : ""]
	});
}
//#endregion
export { ScoreBadge as t };
