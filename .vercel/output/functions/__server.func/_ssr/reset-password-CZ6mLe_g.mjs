import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as useRouterState, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { n as completePasswordReset } from "./team-access-Di_NZ6Xd.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, S as OrbsBackground, b as ClippyMark, m as userFacingErrorMessage, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { t as ShineBorder } from "./shine-border-CYiRLf3h.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reset-password-CZ6mLe_g.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ResetPasswordPage() {
	const search = useRouterState({ select: (s) => s.location.searchStr });
	const token = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("token") ?? "";
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [done, setDone] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function onSubmit(event) {
		event.preventDefault();
		setError(null);
		if (password.length < 8) {
			setError("Use at least 8 characters.");
			return;
		}
		setBusy(true);
		try {
			await completePasswordReset({ data: {
				token,
				password
			} });
			setDone(true);
			toast.success("Password updated");
		} catch (err) {
			setError(userFacingErrorMessage(err));
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative flex min-h-dvh items-center justify-center bg-bg px-4 py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbsBackground, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
			className: "relative z-10 w-full max-w-sm overflow-hidden px-6 py-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-[1] mb-6 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size: 40 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-section font-semibold tracking-tight",
						children: "Reset password"
					})]
				}),
				done ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-[1] flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body text-muted",
						children: "Your password is updated. Sign in with the new one."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							children: "Sign in"
						})
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "relative z-[1] flex flex-col gap-3",
					onSubmit: (event) => void onSubmit(event),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: "Use the link an Owner copied from Team access. Links expire in one hour."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "new-password",
								children: "New password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "new-password",
								type: "password",
								autoComplete: "new-password",
								minLength: 8,
								value: password,
								onChange: (event) => setPassword(event.target.value),
								required: true
							})]
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-danger",
							role: "alert",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: busy || token.length < 16,
							children: busy ? "Saving…" : "Update password"
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { ResetPasswordPage as component };
