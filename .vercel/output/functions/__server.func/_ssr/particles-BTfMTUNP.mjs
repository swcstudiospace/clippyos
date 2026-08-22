import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { D as usePrefersReducedMotion, O as cn } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/particles-BTfMTUNP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Particles({ className, quantity = 46 }) {
	const reduced = usePrefersReducedMotion();
	const dots = (0, import_react.useMemo)(() => Array.from({ length: quantity }, (_, index) => ({
		id: index,
		left: `${(index * 17 + 3) % 100}%`,
		top: `${(index * 29 + 11) % 100}%`,
		size: 2 + index % 3,
		delay: `${index % 12 * .35}s`,
		duration: `${6 + index % 5}s`
	})), [quantity]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": "true",
		className: cn("pointer-events-none absolute inset-0 overflow-hidden", className),
		children: dots.map((dot) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("absolute rounded-full bg-fg/30", !reduced && "animate-particle"),
			style: {
				left: dot.left,
				top: dot.top,
				width: dot.size,
				height: dot.size,
				animationDelay: dot.delay,
				animationDuration: dot.duration
			}
		}, dot.id))
	});
}
//#endregion
export { Particles as t };
