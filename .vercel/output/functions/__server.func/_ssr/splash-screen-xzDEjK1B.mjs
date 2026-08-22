import { t as APP_NAME } from "./constants-CdtfzQP2.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { C as GlassCard, S as OrbsBackground, b as ClippyMark } from "./router-DRtNPEcw.mjs";
import { t as AuroraText } from "./aurora-text-Bfo7HLWM.mjs";
import { t as Particles } from "./particles-BTfMTUNP.mjs";
import { t as Ripple } from "./ripple-7-CEEHUm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/splash-screen-xzDEjK1B.js
var import_jsx_runtime = require_jsx_runtime();
function SplashScreen({ label = "Loading" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-dvh items-center justify-center bg-bg px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbsBackground, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Particles, { quantity: 36 }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
				className: "relative z-10 w-full max-w-sm overflow-hidden px-8 py-10 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ripple, {
					className: "opacity-60",
					mainCircleSize: 140
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-[1] flex flex-col items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size: 48 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-section font-semibold tracking-tight",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuroraText, { children: APP_NAME })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "coming-soon-pulse text-body text-muted",
							children: label
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { SplashScreen as t };
