import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { D as usePrefersReducedMotion, O as cn } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/typing-animation-ByKa0Iw8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TypingAnimation({ children, className, duration = 36 }) {
	const reduced = usePrefersReducedMotion();
	const [shown, setShown] = (0, import_react.useState)(reduced ? children : "");
	(0, import_react.useEffect)(() => {
		if (reduced) {
			setShown(children);
			return;
		}
		setShown("");
		let index = 0;
		const timer = window.setInterval(() => {
			index += 1;
			setShown(children.slice(0, index));
			if (index >= children.length) window.clearInterval(timer);
		}, duration);
		return () => window.clearInterval(timer);
	}, [
		children,
		duration,
		reduced
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("whitespace-pre-wrap", className),
		children: [shown, !reduced && shown.length < children.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-fg" }) : null]
	});
}
//#endregion
export { TypingAnimation as t };
