import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { D as usePrefersReducedMotion } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cool-mode-Dv_rzTHj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function burst(x, y) {
	const colors = [
		"#0a84ff",
		"#64d2ff",
		"#bf5af2",
		"#30d158",
		"#ff9f0a"
	];
	for (let i = 0; i < 14; i += 1) {
		const node = document.createElement("span");
		const angle = Math.PI * 2 * i / 14;
		const dist = 36 + Math.random() * 28;
		node.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;width:6px;height:6px;border-radius:999px;
      background:${colors[i % colors.length]};pointer-events:none;z-index:80;
      transform:translate(-50%,-50%);
    `;
		document.body.appendChild(node);
		const anim = node.animate([{
			transform: "translate(-50%,-50%) scale(1)",
			opacity: 1
		}, {
			transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0)`,
			opacity: 0
		}], {
			duration: 620,
			easing: "cubic-bezier(0.22, 1, 0.36, 1)"
		});
		anim.onfinish = () => node.remove();
	}
}
function CoolMode({ children }) {
	const reduced = usePrefersReducedMotion();
	if (!(0, import_react.isValidElement)(children)) return children;
	if (reduced) return children;
	return (0, import_react.cloneElement)(children, { onClick: (event) => {
		burst(event.clientX, event.clientY);
		children.props.onClick?.(event);
	} });
}
//#endregion
export { CoolMode as t };
