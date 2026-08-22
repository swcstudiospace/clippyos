import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { H as Moon, _ as Sun } from "../_libs/lucide-react.mjs";
import { v as useTheme, w as Button } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/theme-toggle-NsNUnV6r.js
var import_jsx_runtime = require_jsx_runtime();
function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === "dark";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		variant: "ghost",
		size: "icon",
		onClick: toggleTheme,
		"aria-label": isDark ? "Switch to light mode" : "Switch to dark mode",
		title: isDark ? "Light mode" : "Dark mode",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "relative inline-flex size-5 items-center justify-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: `absolute size-5 transition-[opacity,transform,filter] duration-(--motion-fast) ease-[var(--ease-out)] ${isDark ? "scale-[0.25] opacity-0 blur-sm" : "scale-100 opacity-100 blur-none"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: `absolute size-5 transition-[opacity,transform,filter] duration-(--motion-fast) ease-[var(--ease-out)] ${isDark ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-sm"}` })]
		})
	});
}
//#endregion
export { ThemeToggle as t };
