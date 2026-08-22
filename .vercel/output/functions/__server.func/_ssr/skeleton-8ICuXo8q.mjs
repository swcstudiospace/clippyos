import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { O as cn } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/skeleton-8ICuXo8q.js
var import_jsx_runtime = require_jsx_runtime();
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("relative overflow-hidden rounded-control bg-secondary-surface before:absolute before:inset-0 before:animate-shimmer-slide before:bg-linear-to-r before:from-transparent before:via-fg/10 before:to-transparent motion-reduce:before:hidden motion-reduce:animate-none", className),
		...props
	});
}
//#endregion
export { Skeleton as t };
