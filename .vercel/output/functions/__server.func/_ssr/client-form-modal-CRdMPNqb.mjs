import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as PLAN_TYPES } from "./mappers-Bmic_hyw.mjs";
import { d as todayIsoDate } from "./format-DaT2NYM9.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { d as DEFAULT_MONTHLY_FEE, f as DEFAULT_SETUP_FEE, g as PLAN_LABELS } from "./dashboard-Dk6DLyWe.mjs";
import { t as parseYouTubeChannelUrl } from "./youtube-ChiY6UIu.mjs";
import { m as saveClient, t as analyzeChannel } from "./clients-CmcyBPZd.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { O as cn, m as userFacingErrorMessage, p as captureClientError, w as Button } from "./router-DRtNPEcw.mjs";
import { n as Textarea, t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { t as AIFallbackPanel } from "./ai-fallback-panel-KjxISs65.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-form-modal-CRdMPNqb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function emptyValues() {
	return {
		name: "",
		channelUrl: "",
		channelThumbnail: "",
		channelSummary: "",
		offers: "",
		contentStrategy: "",
		planType: "TEAM_ONLY",
		customPlanLabel: "",
		setupFee: DEFAULT_SETUP_FEE,
		monthlyFee: DEFAULT_MONTHLY_FEE.TEAM_ONLY,
		startDate: todayIsoDate(),
		notes: ""
	};
}
function fromClient(client) {
	return {
		id: client.id,
		name: client.name,
		channelUrl: client.channelUrl ?? "",
		channelThumbnail: client.channelThumbnail ?? "",
		channelSummary: client.channelSummary ?? "",
		offers: client.offers ?? "",
		contentStrategy: client.contentStrategy ?? "",
		planType: client.planType,
		customPlanLabel: client.customPlanLabel ?? "",
		setupFee: Number(client.setupFee) || 3e4,
		monthlyFee: Number(client.monthlyFee) || DEFAULT_MONTHLY_FEE[client.planType],
		startDate: client.startDate ?? todayIsoDate(),
		notes: client.notes ?? ""
	};
}
var ANALYZE_STEPS = [
	"Analyzing channel…",
	"Fetching latest videos…",
	"Generating strategy…"
];
function ClientFormModal({ open, onOpenChange, client, aiReady, onSaved }) {
	const isEdit = Boolean(client);
	const [step, setStep] = (0, import_react.useState)(client ? "review" : "url");
	const [values, setValues] = (0, import_react.useState)(emptyValues);
	const [baseline, setBaseline] = (0, import_react.useState)(emptyValues);
	const [urlError, setUrlError] = (0, import_react.useState)(null);
	const [formError, setFormError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [analyzeHint, setAnalyzeHint] = (0, import_react.useState)(ANALYZE_STEPS[0]);
	const [skipAi, setSkipAi] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const next = client ? fromClient(client) : emptyValues();
		setValues(next);
		setBaseline(next);
		setStep(client ? "review" : "url");
		setUrlError(null);
		setFormError(null);
		setBusy(false);
		setSkipAi(false);
	}, [open, client]);
	const dirty = (0, import_react.useMemo)(() => JSON.stringify(values) !== JSON.stringify(baseline), [values, baseline]);
	function patch(partial) {
		setValues((current) => {
			const next = {
				...current,
				...partial
			};
			if (partial.planType && partial.planType !== current.planType) {
				next.monthlyFee = DEFAULT_MONTHLY_FEE[partial.planType];
				if (partial.planType !== "CUSTOM") next.customPlanLabel = "";
			}
			return next;
		});
	}
	function requestClose() {
		if (busy) return;
		if (dirty && !window.confirm("Discard unsaved changes?")) return;
		onOpenChange(false);
	}
	async function onAnalyze(event) {
		event.preventDefault();
		const parsed = parseYouTubeChannelUrl(values.channelUrl);
		if (!parsed.ok) {
			setUrlError(parsed.error);
			return;
		}
		setUrlError(null);
		patch({ channelUrl: parsed.canonical });
		if (!aiReady) {
			setSkipAi(true);
			setStep("review");
			if (!values.name) patch({
				channelUrl: parsed.canonical,
				name: parsed.kind === "handle" ? parsed.value.slice(1) : parsed.value
			});
			return;
		}
		setStep("analyze");
		setBusy(true);
		let tick = 0;
		const timer = window.setInterval(() => {
			tick = (tick + 1) % ANALYZE_STEPS.length;
			setAnalyzeHint(ANALYZE_STEPS[tick]);
		}, 1600);
		try {
			const result = await analyzeChannel({ data: parsed.canonical });
			patch({
				name: result.name || values.name,
				channelUrl: result.channelUrl,
				channelThumbnail: result.channelThumbnail ?? "",
				channelSummary: result.channelSummary,
				offers: result.offers,
				contentStrategy: result.contentStrategy
			});
			setStep("review");
		} catch (error) {
			captureClientError(error, { source: "analyze-channel" });
			const message = error instanceof Error && error.message === "AI_RATE_LIMIT" ? "The analysis service is busy. Retry in a moment." : error instanceof Error && error.message === "AI_UNAVAILABLE" ? "Analysis isn’t available right now. You can still add the client by hand." : userFacingErrorMessage(error);
			toast.error(message);
			setSkipAi(true);
			setStep("review");
		} finally {
			window.clearInterval(timer);
			setBusy(false);
		}
	}
	async function onSave(event) {
		event.preventDefault();
		setFormError(null);
		if (!values.name.trim()) {
			setFormError("Name is required.");
			return;
		}
		if (values.planType === "CUSTOM") {
			if (!values.customPlanLabel.trim()) {
				setFormError("Add a custom plan label.");
				return;
			}
			if (values.monthlyFee % 1e3 !== 0 || values.monthlyFee < 0 || values.monthlyFee > 2e4) {
				setFormError("Custom monthly fee must be a multiple of 1,000 between 0 and 20,000.");
				return;
			}
		}
		setBusy(true);
		try {
			const result = await saveClient({ data: {
				id: values.id,
				name: values.name.trim(),
				channelUrl: values.channelUrl.trim() || null,
				channelThumbnail: values.channelThumbnail.trim() || null,
				channelSummary: values.channelSummary || null,
				offers: values.offers || null,
				contentStrategy: values.contentStrategy || null,
				planType: values.planType,
				customPlanLabel: values.customPlanLabel.trim() || null,
				setupFee: values.setupFee,
				monthlyFee: values.monthlyFee,
				startDate: values.startDate || todayIsoDate(),
				notes: values.notes || null
			} });
			toast.success(isEdit ? "Client updated" : "Client added");
			setBaseline(values);
			onSaved(result.id);
			onOpenChange(false);
		} catch (error) {
			captureClientError(error, { source: "save-client" });
			setFormError(userFacingErrorMessage(error));
			toast.error(userFacingErrorMessage(error));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (next) => next ? onOpenChange(true) : requestClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "flex max-h-[min(90dvh,44rem)] w-[min(100%-2rem,42rem)] flex-col overflow-hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: isEdit ? "Edit Client" : "Add Client" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: step === "url" ? "Paste a YouTube channel URL to start." : step === "analyze" ? "We’re reading the channel and drafting a strategy. Review everything before saving." : "Review and edit every field, then save." }),
				step === "url" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: (event) => void onAnalyze(event),
					className: "mt-4 flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "channel-url",
							children: "YouTube channel URL"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "channel-url",
							value: values.channelUrl,
							onChange: (event) => {
								patch({ channelUrl: event.target.value });
								setUrlError(null);
							},
							placeholder: "https://www.youtube.com/@handle",
							autoComplete: "off",
							required: true
						}),
						urlError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-danger",
							role: "alert",
							children: urlError
						}) : null,
						!aiReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, {}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: busy,
								children: aiReady ? "Analyze channel" : "Continue without analysis"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								onClick: () => {
									setSkipAi(true);
									setStep("review");
								},
								children: "Enter details manually"
							})]
						})
					]
				}) : null,
				step === "analyze" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-col items-center gap-3 py-10 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "coming-soon-pulse size-2 rounded-full bg-accent",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body",
						children: analyzeHint
					})]
				}) : null,
				step === "review" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: (event) => void onSave(event),
					className: "mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1",
					children: [
						skipAi && !aiReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, {}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Name",
							htmlFor: "client-name",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "client-name",
								value: values.name,
								onChange: (event) => patch({ name: event.target.value }),
								required: true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Channel URL",
							htmlFor: "client-url",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "client-url",
								value: values.channelUrl,
								onChange: (event) => patch({ channelUrl: event.target.value })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Thumbnail URL",
							htmlFor: "client-thumb",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "client-thumb",
								value: values.channelThumbnail,
								onChange: (event) => patch({ channelThumbnail: event.target.value })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Channel summary",
							htmlFor: "client-summary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "client-summary",
								value: values.channelSummary,
								onChange: (event) => patch({ channelSummary: event.target.value })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Offers",
							htmlFor: "client-offers",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "client-offers",
								value: values.offers,
								onChange: (event) => patch({ offers: event.target.value })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Content strategy",
							htmlFor: "client-strategy",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "client-strategy",
								className: "min-h-36",
								value: values.contentStrategy,
								onChange: (event) => patch({ contentStrategy: event.target.value })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "text-caption font-medium",
							children: "Plan"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3",
							children: PLAN_TYPES.map((plan) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: cn("min-h-11 rounded-control border border-border px-3 text-caption font-medium", values.planType === plan ? "bg-accent text-accent-fg" : "bg-secondary-surface text-fg"),
								"aria-pressed": values.planType === plan,
								onClick: () => patch({ planType: plan }),
								children: PLAN_LABELS[plan]
							}, plan))
						})] }),
						values.planType === "CUSTOM" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Custom plan label",
							htmlFor: "plan-label",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "plan-label",
								maxLength: 120,
								value: values.customPlanLabel,
								onChange: (event) => patch({ customPlanLabel: event.target.value }),
								placeholder: "$3,000 — ideation and channel management"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Monthly fee",
							htmlFor: "monthly-fee",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "monthly-fee",
								type: "number",
								min: 0,
								max: 2e4,
								step: 1e3,
								value: values.monthlyFee,
								onChange: (event) => patch({ monthlyFee: Number(event.target.value) || 0 })
							})
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Monthly fee",
							htmlFor: "monthly-fee",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "monthly-fee",
								type: "number",
								min: 0,
								step: 100,
								value: values.monthlyFee,
								onChange: (event) => patch({ monthlyFee: Number(event.target.value) || 0 })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Setup fee",
								htmlFor: "setup-fee",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "setup-fee",
									type: "number",
									min: 0,
									value: values.setupFee,
									onChange: (event) => patch({ setupFee: Number(event.target.value) || 0 })
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Start date",
								htmlFor: "start-date",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "start-date",
									type: "date",
									value: values.startDate,
									onChange: (event) => patch({ startDate: event.target.value })
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Notes",
							htmlFor: "client-notes",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "client-notes",
								value: values.notes,
								onChange: (event) => patch({ notes: event.target.value })
							})
						}),
						formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-danger",
							role: "alert",
							children: formError
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sticky bottom-0 flex gap-2 bg-elevated/80 py-3 backdrop-blur-md",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: busy,
								children: busy ? "Saving…" : isEdit ? "Save changes" : "Save client"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "ghost",
								onClick: requestClose,
								disabled: busy,
								children: "Cancel"
							})]
						})
					]
				}) : null
			]
		})
	});
}
function Field({ label, htmlFor, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor,
			children: label
		}), children]
	});
}
//#endregion
export { ClientFormModal as t };
