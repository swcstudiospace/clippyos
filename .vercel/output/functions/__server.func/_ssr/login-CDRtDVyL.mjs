import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as signIn, i as setPreviewSessionToken, t as authClient } from "./client-C4IS_tWT.mjs";
import { n as APP_TAGLINE, t as APP_NAME } from "./constants-CdtfzQP2.mjs";
import { d as useRouterState, v as Link, x as useRouter, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { l as unlockSuperAdmin } from "./team-access-Di_NZ6Xd.mjs";
import { t as GROK_PROVIDERS } from "./server-C5l0fORE.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, S as OrbsBackground, b as ClippyMark, m as userFacingErrorMessage, p as captureClientError, w as Button } from "./router-DRtNPEcw.mjs";
import { n as useCurrentUserState } from "./use-current-user-Bsan92LK.mjs";
import { t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { t as ShineBorder } from "./shine-border-CYiRLf3h.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { t as ThemeToggle } from "./theme-toggle-NsNUnV6r.mjs";
import { t as AuroraText } from "./aurora-text-Bfo7HLWM.mjs";
import { t as Particles } from "./particles-BTfMTUNP.mjs";
import { t as SplashScreen } from "./splash-screen-xzDEjK1B.mjs";
import { t as CoolMode } from "./cool-mode-Dv_rzTHj.mjs";
import { t as Separator } from "./separator-DmLoB9bW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-CDRtDVyL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LoginPage() {
	const { user, isPending } = useCurrentUserState();
	const wantsAccess = useRouterState({ select: (s) => s.location.searchStr }).includes("intent=access");
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SplashScreen, { label: "Loading" });
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: wantsAccess ? "/billing" : "/home" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginForm, {});
}
function ProviderGlyph({ id }) {
	const letter = id.includes("google") ? "G" : "X";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "grid size-5 place-items-center text-caption font-semibold",
		"aria-hidden": "true",
		children: letter
	});
}
function LoginForm() {
	const router = useRouter();
	const wantsAccess = useRouterState({ select: (s) => s.location.searchStr }).includes("intent=access");
	const [mode, setMode] = (0, import_react.useState)(wantsAccess ? "signup" : "signin");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [oauthBusy, setOauthBusy] = (0, import_react.useState)(null);
	const [formError, setFormError] = (0, import_react.useState)(null);
	const [saOpen, setSaOpen] = (0, import_react.useState)(false);
	const [saPassword, setSaPassword] = (0, import_react.useState)("");
	const [saBusy, setSaBusy] = (0, import_react.useState)(false);
	const [saError, setSaError] = (0, import_react.useState)(null);
	async function onOauth(providerId) {
		setFormError(null);
		setOauthBusy(providerId);
		try {
			await signIn(providerId, {
				callbackURL: wantsAccess ? "/billing" : "/home",
				errorCallbackURL: "/login"
			});
		} catch (error) {
			captureClientError(error, { source: "oauth" });
			setFormError(userFacingErrorMessage(error));
			setOauthBusy(null);
		}
	}
	async function onSubmit(event) {
		event.preventDefault();
		setFormError(null);
		if (mode === "forgot") {
			if (!email.trim()) {
				setFormError("Enter the email for that account.");
				return;
			}
			setBusy(true);
			try {
				await import("./team-access-Di_NZ6Xd.mjs").then((n) => n.c).then((n) => n.c).then((mod) => mod.requestPasswordReset({ data: { email: email.trim() } }));
				toast.success("If that account exists, ask an Owner to copy a reset link from Settings → Team access.");
				setMode("signin");
			} catch (error) {
				captureClientError(error, { source: "email-auth" });
				setFormError(userFacingErrorMessage(error));
			}
			setBusy(false);
			return;
		}
		if (!email.trim() || password.length < 8) {
			setFormError("Enter a valid email and a password of at least 8 characters.");
			return;
		}
		setBusy(true);
		try {
			if (mode === "signup") {
				const { error } = await authClient.signUp.email({
					email: email.trim(),
					password,
					name: name.trim() || email.trim()
				});
				if (error) throw new Error("Could not create account");
			} else {
				const { error } = await authClient.signIn.email({
					email: email.trim(),
					password
				});
				if (error) throw new Error("Could not sign in");
			}
			await router.navigate({ to: mode === "signup" || wantsAccess ? "/billing" : "/home" });
			await router.invalidate();
		} catch (error) {
			captureClientError(error, { source: "email-auth" });
			setFormError(userFacingErrorMessage(error));
			toast.error(userFacingErrorMessage(error));
			setBusy(false);
		}
	}
	async function onSuperAdmin(event) {
		event.preventDefault();
		setSaError(null);
		if (saPassword.length < 8) {
			setSaError("Enter the Super Admin password.");
			return;
		}
		setSaBusy(true);
		try {
			const result = await unlockSuperAdmin({ data: { password: saPassword } });
			setPreviewSessionToken(result.token);
			try {
				await authClient.getSession();
			} catch {}
			await router.invalidate();
			await router.navigate({ to: "/home" });
		} catch (error) {
			captureClientError(error, { source: "super-admin" });
			setSaError(userFacingErrorMessage(error));
			toast.error(userFacingErrorMessage(error));
			setSaBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative flex min-h-dvh items-center justify-center bg-bg px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbsBackground, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Particles, { quantity: 42 }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-3 left-3 z-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "ghost",
					size: "sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						children: "Back to ClippyOS"
					})
				})
			}),
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
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuroraText, { children: APP_NAME })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: APP_TAGLINE
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "relative z-[1] mb-5 text-body text-muted",
						children: mode === "signup" || wantsAccess ? "Create your workspace, then choose a plan. ClippyOS is subscription-gated — Request a Demo on the landing if you want a walkthrough first." : "Sign in to the private OS. New teams subscribe on the next step."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative z-[1] flex flex-col gap-2",
						children: GROK_PROVIDERS.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							className: "w-full justify-center",
							disabled: oauthBusy !== null || busy || saBusy,
							onClick: () => void onOauth(provider.providerId),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderGlyph, { id: provider.providerId }), oauthBusy === provider.providerId ? "Connecting…" : `Continue with ${provider.label}`]
						}, provider.providerId))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-[1] my-5 flex items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "flex-1" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-caption text-muted",
								children: "or email"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "flex-1" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: (event) => void onSubmit(event),
						className: "relative z-[1] flex flex-col gap-3",
						children: [
							mode === "signup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "name",
									children: "Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "name",
									name: "name",
									autoComplete: "name",
									value: name,
									onChange: (event) => setName(event.target.value)
								})]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "email",
									children: "Email"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "email",
									name: "email",
									type: "email",
									autoComplete: "email",
									required: true,
									value: email,
									onChange: (event) => setEmail(event.target.value)
								})]
							}),
							mode !== "forgot" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "password",
									children: "Password"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "password",
									name: "password",
									type: "password",
									autoComplete: mode === "signup" ? "new-password" : "current-password",
									required: true,
									minLength: 8,
									value: password,
									onChange: (event) => setPassword(event.target.value)
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-muted",
								children: "Password reset emails aren’t sent from this workspace. An Owner can copy a one-hour reset link in Settings → Team access. Super Admin Access still works if you set that password."
							}),
							formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-danger",
								role: "alert",
								children: formError
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoolMode, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "mt-1 w-full",
								disabled: busy || oauthBusy !== null || saBusy,
								children: busy ? "Please wait…" : mode === "signup" ? "Continue to checkout" : mode === "forgot" ? "Request reset" : "Sign in"
							}) })
						]
					}),
					mode === "signin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "relative z-[1] mt-3 w-full text-center text-caption text-muted underline-offset-4 hover:text-fg hover:underline",
						onClick: () => {
							setMode("forgot");
							setFormError(null);
						},
						children: "Forgot password?"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "relative z-[1] mt-4 w-full text-center text-caption text-muted underline-offset-4 hover:text-fg hover:underline",
						onClick: () => {
							setMode((current) => current === "signin" ? "signup" : "signin");
							setFormError(null);
						},
						children: mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "relative z-[1] mt-3 text-center text-caption text-muted",
						children: [
							"Brand stakeholder?",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/portal/login",
								className: "text-fg underline-offset-4 hover:underline",
								children: "Open the client portal"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "relative z-[1] my-4" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "relative z-[1] w-full",
						disabled: busy || oauthBusy !== null || saBusy,
						onClick: () => {
							setSaError(null);
							setSaOpen(true);
						},
						children: "Super Admin Access"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: saOpen,
				onOpenChange: (open) => {
					setSaOpen(open);
					if (!open) {
						setSaPassword("");
						setSaError(null);
					}
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Super Admin Access" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Enter the Super Admin password from Settings → Team access. The password is never stored in the browser." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-4 flex flex-col gap-3",
						onSubmit: (event) => void onSuperAdmin(event),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "sa-login-password",
									children: "Password"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "sa-login-password",
									type: "password",
									autoComplete: "current-password",
									value: saPassword,
									onChange: (event) => setSaPassword(event.target.value),
									minLength: 8,
									required: true
								})]
							}),
							saError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-caption text-danger",
								role: "alert",
								children: saError
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									disabled: saBusy,
									children: saBusy ? "Checking…" : "Unlock"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "ghost",
									onClick: () => setSaOpen(false),
									children: "Cancel"
								})]
							})
						]
					})
				] })
			})
		]
	});
}
//#endregion
export { LoginPage as component };
