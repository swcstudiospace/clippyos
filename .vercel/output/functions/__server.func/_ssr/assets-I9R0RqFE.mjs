import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { r as formatCompactCount, s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { x as formatDurationSec } from "./library-D-Mt5rXw.mjs";
import { pt as Download, rt as Image, st as Film } from "../_libs/lucide-react.mjs";
import { n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, O as cn, m as userFacingErrorMessage, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { o as PORTAL_ASSETS_KEY } from "./portal-BZQkNPFJ.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { d as signPortalDownloadFn, s as listPortalAssetsFn } from "./portal-fns-Arkyj22-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/assets-I9R0RqFE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PortalAssetsPage() {
	const [kind, setKind] = (0, import_react.useState)("ALL");
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const query = useQuery({
		queryKey: [...PORTAL_ASSETS_KEY, kind],
		queryFn: () => listPortalAssetsFn({ data: { kind } })
	});
	const download = useMutation({
		mutationFn: (assetId) => signPortalDownloadFn({ data: { assetId } }),
		onSuccess: (data) => {
			window.open(data.url, "_blank", "noopener,noreferrer");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "aspect-video w-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "aspect-video w-full" })]
	});
	if (query.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "Couldn’t load deliverables",
		onRetry: () => void query.refetch()
	});
	const assets = query.data?.assets ?? [];
	const allowDownload = query.data?.allowDownload ?? false;
	const open = assets.find((row) => row.id === openId) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Deliverables",
				description: "Ready videos and images for your brand. Nothing internal, nothing from other clients."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					"ALL",
					"VIDEO",
					"IMAGE"
				].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: kind === value ? "primary" : "secondary",
					onClick: () => setKind(value),
					children: value === "ALL" ? "All" : value === "VIDEO" ? "Video" : "Images"
				}, value))
			}),
			assets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "Nothing ready yet",
				description: "When a clip or thumbnail is marked ready, it will land here."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
				children: assets.map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
					interactive: true,
					className: "overflow-hidden p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "relative aspect-video w-full bg-secondary-surface",
						onClick: () => setOpenId(asset.id),
						children: asset.previewUrl ? asset.kind === "IMAGE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: asset.previewUrl,
							alt: "",
							className: "size-full object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							src: asset.previewUrl,
							className: "size-full object-cover",
							muted: true,
							playsInline: true,
							preload: "metadata"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-full place-items-center text-muted",
							children: asset.kind === "IMAGE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-8" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, { className: "size-8" })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2 p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-body font-medium",
								children: asset.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-caption text-muted",
								children: [
									asset.kind === "VIDEO" && asset.durationSec ? formatDurationSec(asset.durationSec) : asset.kind,
									" · ",
									formatRelativeTime(asset.createdAt),
									asset.views != null ? ` · ${formatCompactCount(asset.views)} views` : ""
								]
							})]
						}), allowDownload ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							"aria-label": `Download ${asset.title}`,
							onClick: () => download.mutate(asset.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" })
						}) : null]
					})]
				}) }, asset.id))
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("fixed inset-0 z-40 grid place-items-center bg-bg/80 p-4 backdrop-blur-sm"),
				onClick: () => setOpenId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
					className: "max-h-[90dvh] w-full max-w-lg overflow-auto",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-card font-semibold tracking-tight",
							children: open.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 overflow-hidden rounded-control bg-secondary-surface",
							children: open.previewUrl && open.kind === "IMAGE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: open.previewUrl,
								alt: "",
								className: "w-full"
							}) : open.previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
								src: open.previewUrl,
								className: "w-full",
								controls: true,
								playsInline: true
							}) : null
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex justify-end gap-2",
							children: [allowDownload ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								onClick: () => download.mutate(open.id),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Download"]
							}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => setOpenId(null),
								children: "Close"
							})]
						})
					]
				})
			}) : null
		]
	});
}
//#endregion
export { PortalAssetsPage as component };
