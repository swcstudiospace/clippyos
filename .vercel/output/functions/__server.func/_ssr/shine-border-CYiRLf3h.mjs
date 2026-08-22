import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { O as cn } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shine-border-CYiRLf3h.js
var import_jsx_runtime = require_jsx_runtime();
function ShineBorder({ className, duration = 12, shineColor = [
	"var(--accent)",
	"var(--purple)",
	"var(--teal)"
], borderWidth = 1 }) {
	const colors = Array.isArray(shineColor) ? shineColor.join(",") : shineColor;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": "true",
		className: cn("pointer-events-none absolute inset-0 rounded-[inherit] will-change-[background-position] motion-safe:animate-shine", className),
		style: {
			padding: borderWidth,
			backgroundImage: `radial-gradient(transparent, transparent, ${colors}, transparent, transparent)`,
			backgroundSize: "300% 300%",
			WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
			WebkitMaskComposite: "xor",
			maskComposite: "exclude",
			animationDuration: `${duration}s`
		}
	});
}
//#endregion
export { ShineBorder as t };
