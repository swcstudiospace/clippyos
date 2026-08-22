import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { D as usePrefersReducedMotion, O as cn } from "./router-DRtNPEcw.mjs";
import { i as useScroll, n as useSpring } from "../_libs/framer-motion+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/scroll-progress-C1dB__k8.js
var import_jsx_runtime = require_jsx_runtime();
function ScrollProgress({ className }) {
	const reduced = usePrefersReducedMotion();
	const { scrollYProgress } = useScroll();
	const scaleX = useSpring(scrollYProgress, {
		stiffness: 140,
		damping: 30,
		restDelta: .001
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		"aria-hidden": "true",
		className: cn("pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-linear-to-r from-teal via-accent to-purple", className),
		style: { scaleX: reduced ? 0 : scaleX }
	});
}
//#endregion
export { ScrollProgress as t };
