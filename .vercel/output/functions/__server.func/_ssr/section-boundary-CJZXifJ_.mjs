import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/section-boundary-CJZXifJ_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SectionBoundary = class extends import_react.Component {
	state = { error: null };
	static getDerivedStateFromError(error) {
		return { error };
	}
	render() {
		if (this.state.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-0 flex-1 p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
				title: `${this.props.title} couldn’t load`,
				description: this.props.description ?? "The rest of this page is still available. Retry this section.",
				onRetry: () => this.setState({ error: null })
			})
		});
		return this.props.children;
	}
};
//#endregion
export { SectionBoundary as t };
