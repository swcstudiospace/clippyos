import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { s as isActiveClient } from "./money-n66k7fz5.mjs";
import { c as listClients } from "./clients-CmcyBPZd.mjs";
import { pt as Download } from "../_libs/lucide-react.mjs";
import { n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, m as userFacingErrorMessage, p as captureClientError, w as Button } from "./router-DRtNPEcw.mjs";
import { t as ShineBorder } from "./shine-border-CYiRLf3h.mjs";
import { n as decodeBase64, r as downloadBinaryFile } from "./clipboard-Yt4ExP0v.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as ClientOnboardingChecklistCard } from "./client-checklist-giEw1nhx.mjs";
import { t as CoolMode } from "./cool-mode-Dv_rzTHj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-DNz0LIHV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var downloadClientAgreement = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("3b2ecd259ba82fff78d662e8ed92b4e731d24a7f4b963eef3e6e4896d9f04955"));
var SECTIONS = [
	{
		title: "1. Confirm the plan",
		body: "Agree Team only ($3,000 / mo), Personal involved ($5,000 / mo), or a custom retainer in $1,000 steps up to $20,000. Setup is $30,000 unless a custom note says otherwise. Record the start date on the client — Day 1 of the 30-day views guarantee is that date, inclusive."
	},
	{
		title: "2. Send the client agreement",
		body: "Download the ClippyOS client agreement and send it for signature before production starts. Paying the setup invoice also counts as acceptance. Keep the signed copy in the client’s Drive folder. Do not use a link the client emailed you — only this workspace’s trusted document."
	},
	{
		title: "3. Collect access",
		body: "YouTube Studio (or Brand Account) with permission to upload, edit, and read analytics. Footage Drive or Dropbox. Thumbnail references. Google account email on the client record. Without Studio access we cannot snapshot views for the guarantee."
	},
	{
		title: "4. Discord",
		body: "Invite the founder and their point of contact to the agency Discord. Create a client channel. Production stages (Waiting for footage → Published) are posted there. Store the server id on the client if you use the Discord bridge later."
	},
	{
		title: "5. Footage expectations",
		body: "Long-form is the source of truth. We only treat a video as long-form at 4 minutes or longer. Ask for clean audio, a stable frame, and enough runtime to cut a 4+ minute A-roll. B-roll and pickups should arrive within five business days of the request. Missing footage parks the lane on Waiting for footage."
	},
	{
		title: "6. First 30 days",
		body: "We guarantee a full refund of the setup fee if the channel does not see a views increase in the first 30 days. Dashboard Daily Objectives track Day n/30 for every active client with a start date, and turn orange at day 25 and red at day 30. Pull analytics snapshots so the comparison is real. The guarantee does not apply if they withhold footage or access, pause publishing, or fall into arrears."
	},
	{
		title: "7. Money setup",
		body: "Create the setup invoice and the first monthly invoice on the client. They appear on Money and on Calendar on the due date. Mark collected / Mark as Paid is the same action — it sets paidDate to today and status to PAID. Churned clients drop out of MRR but their historical paid invoices still count as lifetime revenue."
	},
	{
		title: "8. Staff the lane",
		body: "Assign a channel manager, short-form editor, long-form editor, and thumbnail designer as needed. Team costs are monthly and roll into Money margins and the Team tab capacity tracker. Anyone on more than three active clients is flagged overloaded."
	},
	{
		title: "9. Kick off production",
		body: "Set the stage to Waiting for footage. Use Ideation (global) for strategy and the client’s Suggested Titles / Ideas tools for channel-specific work. Thumbnails stay in the Thumbnails tab, always tagged to this client. Publish, snapshot analytics, and stay on the 30-day list until the window closes."
	},
	{
		title: "10. Turn on require approval before first client publish",
		body: "Settings → Approvals. Live social publishes wait in the Approvals inbox until an Owner or Admin signs off. Drafts never wait. Keep this on before the first client goes live."
	}
];
function OnboardingGuide() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-3",
		children: SECTIONS.map((section) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-card font-semibold tracking-tight",
			children: section.title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-3xl text-body text-muted",
			children: section.body
		})] }, section.title))
	});
}
function OnboardingPage() {
	const clientsQuery = useQuery({
		queryKey: ["clients"],
		queryFn: () => listClients()
	});
	const [clientId, setClientId] = (0, import_react.useState)("");
	const active = (0, import_react.useMemo)(() => (clientsQuery.data ?? []).filter((row) => isActiveClient(row)), [clientsQuery.data]);
	const selected = active.find((row) => row.id === clientId) ?? active[0] ?? null;
	const downloadMut = useMutation({
		mutationFn: () => downloadClientAgreement(),
		onSuccess: (file) => {
			if (downloadBinaryFile(file.filename, file.contentType, decodeBase64(file.base64))) toast.success("Client agreement downloaded");
			else toast.error("Couldn’t start the download. Try again.");
		},
		onError: (error) => {
			captureClientError(error, { source: "download-agreement" });
			toast.error(userFacingErrorMessage(error));
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Onboarding",
				description: "How we bring a personal-brand channel onto the roster — agreement, access, footage, and the 30-day guarantee."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
				className: "relative mt-6 overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-card font-semibold tracking-tight",
							children: "Client agreement"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-body text-muted",
							children: "Trusted workspace document. Download only — never a client-supplied link."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoolMode, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => downloadMut.mutate(),
						disabled: downloadMut.isPending,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
							className: "size-4",
							"aria-hidden": "true"
						}), downloadMut.isPending ? "Preparing…" : "Download Client Agreement"]
					}) })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [active.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mb-3 flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-caption text-muted",
						children: "Client"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "h-11 rounded-control border border-border bg-surface px-3 text-body",
						value: selected.id,
						onChange: (event) => setClientId(event.target.value),
						children: active.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: row.id,
							children: row.name
						}, row.id))
					})]
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientOnboardingChecklistCard, {
					clientId: selected.id,
					checklist: selected.onboardingChecklist
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-body text-muted",
					children: "Add a client first, then tick the onboarding checklist against that roster row."
				}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnboardingGuide, {})
			})
		]
	});
}
//#endregion
export { OnboardingPage as component };
