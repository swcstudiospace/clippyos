import { g as PROGRESS_STAGES } from "./mappers-Bmic_hyw.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { S as STAGE_LABELS } from "./dashboard-Dk6DLyWe.mjs";
import { Et as Check } from "../_libs/lucide-react.mjs";
import { O as cn } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pipeline-tracker-sk9R9pKX.js
var import_jsx_runtime = require_jsx_runtime();
function PipelineTracker({ current, onSelect, disabled }) {
	const currentIndex = current ? PROGRESS_STAGES.indexOf(current) : -1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "-mx-1 flex flex-row gap-0 overflow-x-auto pb-1 snap-x snap-mandatory md:flex-wrap md:overflow-visible",
		children: PROGRESS_STAGES.map((stage, index) => {
			const done = currentIndex >= 0 && index < currentIndex;
			const active = stage === current;
			const upcoming = currentIndex < 0 || index > currentIndex;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "relative flex min-w-[9.5rem] snap-start md:min-w-[25%] md:flex-1 md:flex-col",
				children: [index < PROGRESS_STAGES.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("absolute bg-border top-4 right-0 left-8 h-px w-auto", done && "bg-accent"),
					"aria-hidden": "true"
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: disabled || !onSelect,
					onClick: () => onSelect?.(stage),
					className: cn("relative z-10 flex min-h-11 w-full flex-col items-start gap-2 px-1 py-2 text-left", (disabled || !onSelect) && "cursor-default"),
					"aria-current": active ? "step" : void 0,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("grid size-8 shrink-0 place-items-center rounded-full border text-caption font-medium", done && "border-accent bg-accent text-accent-fg", active && "border-accent bg-accent/15 text-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_22%,transparent)]", upcoming && "border-border bg-secondary-surface text-muted"),
						children: done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							className: "size-4",
							"aria-hidden": "true"
						}) : index + 1
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("text-caption md:pr-3", active ? "font-medium text-fg" : "text-muted"),
						children: STAGE_LABELS[stage]
					})]
				})]
			}, stage);
		})
	});
}
//#endregion
export { PipelineTracker as t };
