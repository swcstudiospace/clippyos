import { W as parseClientChecklist, i as CLIENT_ONBOARDING_STEPS, r as CLIENT_ONBOARDING_COPY } from "./mappers-Bmic_hyw.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { h as setClientOnboardingStep } from "./clients-CmcyBPZd.mjs";
import { i as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, m as userFacingErrorMessage } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-checklist-giEw1nhx.js
var import_jsx_runtime = require_jsx_runtime();
function ClientOnboardingChecklistCard({ clientId, checklist }) {
	const queryClient = useQueryClient();
	const parsed = parseClientChecklist(checklist);
	const doneCount = CLIENT_ONBOARDING_STEPS.filter((step) => parsed.steps[step].done).length;
	const toggle = useMutation({
		mutationFn: (input) => setClientOnboardingStep({ data: {
			clientId,
			step: input.step,
			done: input.done
		} }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["client", clientId] });
			await queryClient.invalidateQueries({ queryKey: ["clients"] });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-card font-semibold tracking-tight",
			children: "Client onboarding"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 text-caption text-muted",
			children: [
				doneCount,
				" of ",
				CLIENT_ONBOARDING_STEPS.length,
				" complete. Per-client, not the written guide."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 flex flex-col gap-2",
			children: CLIENT_ONBOARDING_STEPS.map((step) => {
				const copy = CLIENT_ONBOARDING_COPY[step];
				const rec = parsed.steps[step];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-start gap-3 rounded-control bg-secondary-surface/40 px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						className: "mt-1 size-4",
						checked: rec.done,
						disabled: toggle.isPending,
						onChange: (event) => toggle.mutate({
							step,
							done: event.target.checked
						}),
						"aria-label": copy.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body font-medium",
						children: copy.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: copy.body
					})] })]
				}, step);
			})
		})
	] });
}
//#endregion
export { ClientOnboardingChecklistCard as t };
