import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/provider-BnICEAIZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var IntegrationsUi = (0, import_react.createContext)(null);
function IntegrationsProvider({ children }) {
	const [guide, setGuide] = (0, import_react.useState)(null);
	const value = (0, import_react.useMemo)(() => ({
		guide,
		openGuide: setGuide,
		closeGuide: () => setGuide(null)
	}), [guide]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntegrationsUi.Provider, {
		value,
		children
	});
}
function useIntegrationsUi() {
	const ctx = (0, import_react.useContext)(IntegrationsUi);
	if (!ctx) return {
		guide: null,
		openGuide: () => void 0,
		closeGuide: () => void 0
	};
	return ctx;
}
//#endregion
export { useIntegrationsUi as n, IntegrationsProvider as t };
