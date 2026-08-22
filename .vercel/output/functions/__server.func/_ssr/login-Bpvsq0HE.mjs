import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link, x as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, S as OrbsBackground, b as ClippyMark, m as userFacingErrorMessage, p as captureClientError, r as Route$13, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { t as ShineBorder } from "./shine-border-CYiRLf3h.mjs";
import { t as ThemeToggle } from "./theme-toggle-NsNUnV6r.mjs";
import { t as AuroraText } from "./aurora-text-Bfo7HLWM.mjs";
import { t as Particles } from "./particles-BTfMTUNP.mjs";
import { h as setPortalBearerToken } from "./portal-BZQkNPFJ.mjs";
import { c as peekPortalInviteFn, l as portalLoginFn, t as activatePortalInviteFn } from "./portal-fns-Arkyj22-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-Bpvsq0HE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PortalLoginPage() {
	const router = useRouter();
	const { invite } = Route$13.useSearch();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [formError, setFormError] = (0, import_react.useState)(null);
	const preview = useQuery({
		queryKey: ["portal-invite", invite],
		queryFn: () => peekPortalInviteFn({ data: { token: invite } }),
		enabled: Boolean(invite),
		retry: false
	});
	(0, import_react.useEffect)(() => {
		if (preview.data?.email) setEmail(preview.data.email);
	}, [preview.data?.email]);
	async function onSubmit(event) {
		event.preventDefault();
		setFormError(null);
		if (password.length < 8) {
			setFormError("Use a password of at least 8 characters.");
			return;
		}
		setBusy(true);
		try {
			const result = invite ? await activatePortalInviteFn({ data: {
				token: invite,
				password,
				name: name.trim() || void 0
			} }) : await portalLoginFn({ data: {
				email: email.trim(),
				password
			} });
			setPortalBearerToken(result.token);
			await router.navigate({ to: "/portal/home" });
		} catch (error) {
			captureClientError(error, { source: "portal-login" });
			setFormError(userFacingErrorMessage(error));
			toast.error(userFacingErrorMessage(error));
			setBusy(false);
		}
	}
	const agency = preview.data?.agencyName ?? "Client portal";
	const inviteMode = Boolean(invite);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative flex min-h-dvh items-center justify-center bg-bg px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbsBackground, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Particles, { quantity: 28 }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-3 right-3 z-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
				className: "relative z-10 w-full max-w-sm overflow-hidden px-6 py-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-[1] mb-6 flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClippyMark, { size: 40 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-section font-semibold tracking-tight",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuroraText, { children: agency })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: inviteMode ? `Activate access for ${preview.data?.clientName ?? "your brand"}` : "Brand portal — production updates only"
						})] })]
					}),
					preview.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "relative z-[1] mb-4 text-caption text-danger",
						children: [userFacingErrorMessage(preview.error), " This invite may have expired. Ask your producer for a new link."]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "relative z-[1] flex flex-col gap-4",
						onSubmit,
						children: [
							inviteMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "portal-name",
									children: "Your name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "portal-name",
									value: name,
									onChange: (e) => setName(e.target.value),
									autoComplete: "name",
									placeholder: "Optional"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "portal-email",
									children: "Email"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "portal-email",
									value: email,
									readOnly: true
								})]
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "portal-email",
									children: "Email"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "portal-email",
									type: "email",
									value: email,
									onChange: (e) => setEmail(e.target.value),
									autoComplete: "username",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "portal-password",
									children: inviteMode ? "Set a password" : "Password"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "portal-password",
									type: "password",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									autoComplete: inviteMode ? "new-password" : "current-password",
									required: true,
									minLength: 8
								})]
							}),
							formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-danger",
								children: formError
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: busy || inviteMode && preview.isError,
								children: busy ? "Working…" : inviteMode ? "Activate access" : "Open portal"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "relative z-[1] mt-6 text-center text-caption text-muted",
						children: [
							"Agency team?",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/login",
								className: "text-fg underline-offset-4 hover:underline",
								children: "Staff sign in"
							})
						]
					})
				]
			})
		]
	});
}
//#endregion
export { PortalLoginPage as component };
