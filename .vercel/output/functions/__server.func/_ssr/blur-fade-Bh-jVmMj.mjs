import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { D as usePrefersReducedMotion, O as cn } from "./router-DRtNPEcw.mjs";
import { t as motion } from "../_libs/motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/blur-fade-Bh-jVmMj.js
var import_jsx_runtime = require_jsx_runtime();
function BlurFade({ children, className, delay = 0, duration = .35, yOffset = 10, inView = true }) {
	if (usePrefersReducedMotion()) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className,
		children
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		initial: {
			opacity: 0,
			y: yOffset,
			filter: "blur(6px)"
		},
		whileInView: inView ? {
			opacity: 1,
			y: 0,
			filter: "blur(0px)"
		} : void 0,
		animate: !inView ? {
			opacity: 1,
			y: 0,
			filter: "blur(0px)"
		} : void 0,
		viewport: {
			once: true,
			margin: "-40px"
		},
		transition: {
			duration,
			delay,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		className: cn(className),
		children
	});
}
//#endregion
export { BlurFade as t };
