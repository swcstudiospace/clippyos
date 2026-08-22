import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { D as usePrefersReducedMotion, O as cn } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ripple-7-CEEHUm.js
var import_jsx_runtime = require_jsx_runtime();
function Ripple({ className, mainCircleSize = 180, numCircles = 6 }) {
	const reduced = usePrefersReducedMotion();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": "true",
		className: cn("pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden", className),
		children: Array.from({ length: numCircles }, (_, index) => {
			const size = mainCircleSize + index * 56;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("absolute rounded-full border border-accent/25", !reduced && "animate-ripple"),
				style: {
					width: size,
					height: size,
					animationDelay: `${index * .18}s`,
					opacity: .42 - index * .05
				}
			}, index);
		})
	});
}
//#endregion
export { Ripple as t };
