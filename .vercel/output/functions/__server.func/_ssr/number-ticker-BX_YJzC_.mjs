import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { D as usePrefersReducedMotion, O as cn } from "./router-DRtNPEcw.mjs";
import { n as useSpring, r as useMotionValue, t as useInView } from "../_libs/framer-motion+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/number-ticker-BX_YJzC_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatNumber(value, decimalPlaces) {
	return Intl.NumberFormat("en-US", {
		minimumFractionDigits: decimalPlaces,
		maximumFractionDigits: decimalPlaces
	}).format(value);
}
function NumberTicker({ value, direction = "up", delay = 0, decimalPlaces = 0, className, prefix = "", suffix = "" }) {
	const ref = (0, import_react.useRef)(null);
	const reduced = usePrefersReducedMotion();
	const motionValue = useMotionValue(direction === "down" ? value : 0);
	const springValue = useSpring(motionValue, {
		damping: 60,
		stiffness: 90
	});
	const isInView = useInView(ref, {
		once: true,
		margin: "0px"
	});
	const safe = Number.isFinite(value) ? value : 0;
	(0, import_react.useEffect)(() => {
		const node = ref.current;
		if (!node) return;
		if (reduced) {
			node.textContent = `${prefix}${formatNumber(safe, decimalPlaces)}${suffix}`;
			return;
		}
		if (!isInView) return;
		const timer = window.setTimeout(() => {
			motionValue.set(direction === "down" ? 0 : safe);
		}, delay * 1e3);
		return () => window.clearTimeout(timer);
	}, [
		delay,
		decimalPlaces,
		direction,
		isInView,
		motionValue,
		prefix,
		reduced,
		safe,
		suffix
	]);
	(0, import_react.useEffect)(() => {
		return springValue.on("change", (latest) => {
			const node = ref.current;
			if (!node) return;
			node.textContent = `${prefix}${formatNumber(Number(latest.toFixed(decimalPlaces)), decimalPlaces)}${suffix}`;
		});
	}, [
		decimalPlaces,
		prefix,
		springValue,
		suffix
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		ref,
		className: cn("inline-block tabular-nums tracking-tight", className),
		children: [
			prefix,
			formatNumber(direction === "down" ? safe : 0, decimalPlaces),
			suffix
		]
	});
}
//#endregion
export { NumberTicker as t };
