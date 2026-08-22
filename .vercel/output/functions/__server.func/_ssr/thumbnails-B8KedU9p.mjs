import { o as __toESM } from "../_runtime.mjs";
import { Jt as object, Zt as string, qt as number } from "../_libs/@better-auth/core+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as THUMBNAILS_CLIENT_STORAGE_KEY, p as THUMBNAILS_PANEL_STORAGE_KEY } from "./constants-CdtfzQP2.mjs";
import { s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime, n as Root, r as Trigger, t as Content } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { c as listClients, r as getAiStatus } from "./clients-CmcyBPZd.mjs";
import { c as isTrustedImageUrl, i as THUMBNAIL_SESSIONS_QUERY_KEY, l as thumbnailMessagesQueryKey, n as MAX_THUMBNAIL_MESSAGE_CHARS, r as THUMBNAIL_PLACEHOLDER, t as MAX_OVERLAY_DATA_CHARS } from "./thumbnails-DY2H9c6H.mjs";
import { $ as Layers, Et as Check, L as Pencil, N as Plus, O as Search, Rt as Archive, Tt as ChevronDown, ft as Ellipsis, h as Trash2, j as RefreshCw, p as Type, pt as Download, v as Star, vt as Clapperboard, z as PanelRight } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as usePrefersReducedMotion, O as cn, l as Route$24, m as userFacingErrorMessage, p as captureClientError, w as Button, x as SparklesText } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { a as DropdownMenuSeparator, n as DropdownMenuContent, o as DropdownMenuTrigger, r as DropdownMenuItem, t as DropdownMenu } from "./dropdown-menu-DZ8z19go.mjs";
import { t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as Particles } from "./particles-BTfMTUNP.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as TypingAnimation } from "./typing-animation-ByKa0Iw8.mjs";
import { t as AIFallbackPanel } from "./ai-fallback-panel-KjxISs65.mjs";
import { t as SectionBoundary } from "./section-boundary-CJZXifJ_.mjs";
import { t as Switch } from "./switch-BBV5HifB.mjs";
import { n as SafeMarkdown, t as ChatInput } from "./markdown-BvUKUwQu.mjs";
import { d as ingestThumbnailFn } from "./library-fns-D3lY4Qo9.mjs";
import { i as Trigger$1, n as Portal, r as Root2, t as Content2 } from "../_libs/radix-ui__react-popover.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/thumbnails-B8KedU9p.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var listThumbnailSessions = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("5dd37fc6884b66a535ad5532d340696459eb8efb52b8a62bf67fc3e31925084c"));
var listThumbnailMessages = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("817faaa1d68fe19e0ca6c58b583e5193646d2d694bb1bbad6b3d6a896541e06d"));
var renameThumbnailSession = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	title: string().trim().min(1).max(120)
}).parse(input)).handler(createSsrRpc("f0cf4f2f50e802a2af7e9d4bc5f9a399e02e844fcc1b10708ffbabb4be1335f1"));
var archiveThumbnailSession = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("66490721ca794db8b5d8b9cf4883d8b3594668f7572260b693db15d88c23b47e"));
var deleteThumbnailSession = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("b1981e49c703bacea43a4c6d2ee4691452ceb78c37c8e3b600ca047abb43c634"));
var sendThumbnailMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	sessionId: string().min(1).optional(),
	clientId: string().min(1),
	content: string().max(4e3)
}).parse(input)).handler(createSsrRpc("65ecbbcd0fbf7d098beed7070cc0e531ade051e1b13c0ff03df2321f7016fc23"));
var generateThumbnailImageFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	messageId: string().min(1),
	variationHint: string().max(400).optional()
}).parse(input)).handler(createSsrRpc("0197e1077d91b09e480867a7fdf437e69b956fabdd36260654b1f56a9c9a3a85"));
var regenerateThumbnail = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ messageId: string().min(1) }).parse(input)).handler(createSsrRpc("afd76a6f98a111496aa0b0559b7e09b21bedc0f69d04c3c63878cc225082e676"));
var startThumbnailVariations = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ messageId: string().min(1) }).parse(input)).handler(createSsrRpc("7bea6cb94e9a99162736a5aaf41488e014f2ab8d3425305df8eba044bec448b8"));
var rateThumbnailMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	messageId: string().min(1),
	rating: number().int().min(1).max(5)
}).parse(input)).handler(createSsrRpc("bfefb34afd7e0f7b4e3b114da04ae3c2ddd74af6f31e2905de0e61f84851a16b"));
var OverlaySchema = object({
	sessionId: string().min(1),
	parentId: string().min(1),
	overlayText: string().trim().min(1).max(80),
	imageDataUrl: string().min(20).max(MAX_OVERLAY_DATA_CHARS)
});
var saveThumbnailOverlay = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => OverlaySchema.parse(input)).handler(createSsrRpc("7362edba17c61dce904ca62cbec149654e3be353c09a81762be24f5e31d2136b"));
var fetchTrustedImage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ url: string().min(1).max(4e3) }).parse(input)).handler(createSsrRpc("c8a7a2f567ca31bad896359da4f880ee9c9e54729f2537bbe1166063ef258b24"));
function ClientSelector({ clients, value, onChange, disabled }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const active = (0, import_react.useMemo)(() => clients.filter((client) => client.status === "ACTIVE" && !client.deletedAt), [clients]);
	const selected = active.find((client) => client.id === value) ?? null;
	const filtered = (0, import_react.useMemo)(() => {
		const needle = query.trim().toLowerCase();
		if (!needle) return active;
		return active.filter((client) => `${client.name} ${client.channelUrl ?? ""}`.toLowerCase().includes(needle));
	}, [active, query]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root2, {
		open,
		onOpenChange: (next) => {
			setOpen(next);
			if (!next) setQuery("");
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger$1, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "secondary",
				className: "max-w-[16rem] rounded-full px-3",
				disabled,
				"aria-label": selected ? `Client: ${selected.name}` : "Select client",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "min-w-0 truncate",
					children: selected ? selected.name : active.length === 0 ? "Add a client first" : "Select client"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 shrink-0 text-muted" })]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Content2, {
			align: "end",
			sideOffset: 8,
			className: "glass-card z-50 w-72 overflow-hidden p-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-2 pt-1 pb-2 text-caption text-muted",
					children: "Required — every session is tagged."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (event) => setQuery(event.target.value),
						placeholder: "Search clients",
						"aria-label": "Search clients",
						className: "pl-9"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "max-h-64 overflow-y-auto",
					role: "listbox",
					children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "px-3 py-4 text-center text-caption text-muted",
						children: active.length === 0 ? "No active clients yet" : "No matches"
					}) : filtered.map((client) => {
						const on = client.id === value;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "option",
							"aria-selected": on,
							className: cn("flex min-h-11 w-full items-center justify-between gap-2 rounded-control px-3 text-left text-body hover:bg-glass", on && "bg-glass"),
							onClick: () => {
								onChange(client.id);
								setOpen(false);
								setQuery("");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 truncate",
								children: client.name
							}), on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 shrink-0 text-accent" }) : null]
						}) }, client.id);
					})
				})
			]
		}) })]
	});
}
function StarRating({ value, onChange, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center gap-0.5",
		role: "radiogroup",
		"aria-label": "Rating",
		children: [
			1,
			2,
			3,
			4,
			5
		].map((n) => {
			const on = (value ?? 0) >= n;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				role: "radio",
				"aria-checked": value === n,
				"aria-label": `${n} star${n === 1 ? "" : "s"}`,
				disabled,
				className: "inline-flex size-11 items-center justify-center rounded-control text-muted hover:text-warning disabled:opacity-50",
				onClick: () => onChange(n),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
					className: cn("size-4", on && "fill-warning text-warning"),
					"aria-hidden": "true"
				})
			}, n);
		})
	});
}
var ImageBoundary = class extends import_react.Component {
	state = { error: null };
	static getDerivedStateFromError(error) {
		return { error };
	}
	render() {
		if (this.state.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			title: "This image couldn’t load",
			onRetry: () => this.setState({ error: null })
		});
		return this.props.children;
	}
};
function ImageShimmer({ label = "Generating thumbnail", className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("thumb-shimmer w-full", className),
		role: "status",
		"aria-live": "polite",
		"aria-label": label,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: label
		})
	});
}
function ImageBubble({ message, generating, busy, compact, onRegenerate, onVariations, onDownload, onRate, onOverlay, onRetry, onSaveToLibrary }) {
	const url = message.imageUrl && isTrustedImageUrl(message.imageUrl) ? message.imageUrl : null;
	const failed = Boolean(message.metadata?.imageFailed) && !url && !generating;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageBoundary, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("w-full", compact ? "min-w-[16rem] max-w-[20rem] shrink-0" : "max-w-[min(100%,42rem)]"),
		children: [generating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageShimmer, {}) : failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-card border border-border bg-secondary-surface/60 px-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-body",
				children: "The image didn’t come through."
			}), onRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "secondary",
				size: "sm",
				onClick: onRetry,
				disabled: busy,
				children: "Retry"
			}) : null]
		}) : url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: url,
			alt: message.content.slice(0, 120) || "Generated thumbnail",
			className: "aspect-video w-full rounded-card object-cover"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageShimmer, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-2 flex flex-wrap items-center gap-1",
			children: [
				onRegenerate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					disabled: busy || generating,
					onClick: onRegenerate,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), "Regenerate"]
				}) : null,
				onVariations ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					disabled: busy || generating,
					onClick: onVariations,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-4" }), "Try 3 variations"]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					disabled: busy || generating || !url,
					onClick: onDownload,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Download"]
				}),
				onSaveToLibrary ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					disabled: busy || generating || !url,
					onClick: onSaveToLibrary,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, { className: "size-4" }), "Save to Library"]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					disabled: busy || generating || !url,
					onClick: onOverlay,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { className: "size-4" }), "Add text overlay"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarRating, {
					value: message.rating,
					onChange: onRate,
					disabled: busy || generating
				})
			]
		})]
	}) });
}
function ThumbnailMessageList({ messages, generatingText, generatingImageId, variationParentId, failed, busyMessageId, onRetry, onRegenerate, onVariations, onDownload, onRate, onOverlay, onRetryImage, onSaveToLibrary }) {
	const endRef = (0, import_react.useRef)(null);
	const reduced = usePrefersReducedMotion();
	const variationsByParent = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const message of messages) if (message.metadata?.kind === "variation" && message.metadata.parentId) {
			const list = map.get(message.metadata.parentId) ?? [];
			list.push(message);
			map.set(message.metadata.parentId, list);
		}
		return map;
	}, [messages]);
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({
			behavior: reduced ? "auto" : "smooth",
			block: "end"
		});
	}, [
		messages,
		generatingText,
		generatingImageId,
		variationParentId,
		failed,
		reduced
	]);
	const visible = messages.filter((message) => message.metadata?.kind !== "variation");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 md:px-8",
		"aria-live": "polite",
		"aria-busy": generatingText || Boolean(generatingImageId),
		children: [
			visible.map((message) => {
				const user = message.role === "user";
				const showImage = !user && (Boolean(message.imageUrl) || message.metadata?.imageFailed || generatingImageId === message.id || message.metadata?.kind === "turn" || message.metadata?.kind === "regenerate" || message.metadata?.kind === "overlay");
				const variations = variationsByParent.get(message.id) ?? [];
				const showVariationShimmers = variationParentId === message.id && variations.length === 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("flex flex-col gap-3", user ? "items-end" : "items-start"),
					children: [
						message.content && message.metadata?.kind !== "overlay" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("max-w-[min(100%,42rem)] px-4 py-3", user ? "msg-bubble-user" : "msg-bubble-assistant"),
							children: user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "whitespace-pre-wrap text-body",
								children: message.content
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeMarkdown, { content: message.content })
						}) : null,
						showImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageBubble, {
							message,
							generating: generatingImageId === message.id && !message.imageUrl,
							busy: busyMessageId === message.id,
							onRegenerate: message.metadata?.kind === "overlay" ? void 0 : () => onRegenerate(message),
							onVariations: message.metadata?.kind === "overlay" || message.metadata?.kind === "regenerate" ? void 0 : () => onVariations(message),
							onDownload: () => onDownload(message),
							onRate: (rating) => onRate(message, rating),
							onOverlay: () => onOverlay(message),
							onRetry: () => onRetryImage(message),
							onSaveToLibrary: onSaveToLibrary ? () => onSaveToLibrary(message) : void 0
						}) : null,
						showVariationShimmers ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex w-full max-w-[min(100%,42rem)] gap-3 overflow-x-auto pb-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageShimmer, {
									label: "Variation 1",
									className: "min-w-[16rem] max-w-[20rem] shrink-0"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageShimmer, {
									label: "Variation 2",
									className: "min-w-[16rem] max-w-[20rem] shrink-0"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageShimmer, {
									label: "Variation 3",
									className: "min-w-[16rem] max-w-[20rem] shrink-0"
								})
							]
						}) : null,
						variations.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex w-full max-w-[min(100%,54rem)] gap-3 overflow-x-auto pb-2",
							children: variations.map((variation) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageBubble, {
								message: variation,
								compact: true,
								generating: generatingImageId === variation.id && !variation.imageUrl,
								busy: busyMessageId === variation.id,
								onDownload: () => onDownload(variation),
								onRate: (rating) => onRate(variation, rating),
								onOverlay: () => onOverlay(variation),
								onRetry: () => onRetryImage(variation),
								onRegenerate: () => onRegenerate(variation),
								onSaveToLibrary: onSaveToLibrary ? () => onSaveToLibrary(variation) : void 0
							}, variation.id))
						}) : null
					]
				}, message.id);
			}),
			generatingText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-start",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "msg-bubble-assistant max-w-[min(100%,42rem)] px-4 py-3",
					"aria-live": "polite",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sr-only",
						children: "Assistant is writing"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "typing-dots",
						"aria-hidden": "true",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
						]
					})]
				})
			}) : null,
			failed && !generatingText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-start",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "msg-bubble-assistant max-w-[min(100%,42rem)] px-4 py-3",
					role: "alert",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-body",
						children: "The reply didn’t come through."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						className: "mt-3",
						onClick: onRetry,
						children: "Retry"
					})]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
		]
	});
}
function groupSessions(sessions) {
	const groups = [];
	const index = /* @__PURE__ */ new Map();
	for (const session of sessions) {
		const existing = index.get(session.clientId);
		if (existing == null) {
			index.set(session.clientId, groups.length);
			groups.push({
				clientId: session.clientId,
				clientName: session.clientName || "Unknown client",
				sessions: [session]
			});
		} else groups[existing].sessions.push(session);
	}
	return groups;
}
function SessionList({ sessions, selectedId, onSelect, onNew, onRename, onArchive, onDelete }) {
	const [search, setSearch] = (0, import_react.useState)("");
	const [debounced, setDebounced] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const handle = window.setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
		return () => window.clearTimeout(handle);
	}, [search]);
	const rows = (0, import_react.useMemo)(() => {
		if (!debounced) return sessions;
		return sessions.filter((session) => {
			return `${session.title} ${session.clientName ?? ""}`.toLowerCase().includes(debounced);
		});
	}, [sessions, debounced]);
	const groups = (0, import_react.useMemo)(() => groupSessions(rows), [rows]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2 px-4 pt-4 pb-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: "Sessions"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-11",
					onClick: onNew,
					"aria-label": "New session",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-3 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "sr-only",
					htmlFor: "session-search",
					children: "Search sessions"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "session-search",
						value: search,
						onChange: (event) => setSearch(event.target.value),
						placeholder: "Search",
						className: "pl-9"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-2 pb-4",
				children: groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-3 py-8 text-center text-body text-muted",
					children: sessions.length === 0 ? "No sessions yet" : "No matching sessions"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-3",
					children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root, {
						defaultOpen: true,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex min-h-11 w-full items-center justify-between gap-2 rounded-control px-2 text-left text-caption font-medium text-muted hover:text-fg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 truncate",
									children: group.clientName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 shrink-0 transition-transform duration-(--motion-fast) ease-[var(--ease-out)] group-data-[state=open]:rotate-180 motion-reduce:transition-none [[data-state=open]_&]:rotate-180" })]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-1 flex flex-col gap-1",
							children: group.sessions.map((session) => {
								const active = session.id === selectedId;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("group flex items-start gap-1 rounded-control px-1", active && "bg-glass shadow-[inset_0_0_0_0.5px_var(--border)]"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => onSelect(session.id),
										className: "min-h-11 min-w-0 flex-1 rounded-control px-2 py-2 text-left",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-body font-medium",
											children: session.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-0.5 flex flex-wrap items-center gap-1.5 text-caption text-muted",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatRelativeTime(session.updatedAt) }),
												session.imageCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													session.imageCount,
													" ",
													session.imageCount === 1 ? "image" : "images"
												] }) : null,
												session.avgRating != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-0.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
														className: "size-3 fill-warning text-warning",
														"aria-hidden": "true"
													}), session.avgRating.toFixed(1)]
												}) : null
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "icon",
											className: "mt-1 size-11 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
											"aria-label": `Actions for ${session.title}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-4" })
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
										align: "end",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onSelect: () => onRename(session),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" }), "Rename"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onSelect: () => onArchive(session),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "size-4" }), "Archive"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onSelect: () => onDelete(session),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Delete"]
											})
										]
									})] })]
								}) }, session.id);
							})
						}) })]
					}) }, group.clientId))
				})
			})
		]
	});
}
function SessionPanel({ collapsed, onToggle, className, ...listProps }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
		className: cn("hidden min-h-0 flex-col border-l border-border bg-bg/90 backdrop-blur-xl md:flex", "transition-[width] duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none", collapsed ? "w-14" : "w-[300px]", className),
		children: collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-2 pt-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				onClick: onToggle,
				"aria-label": "Expand sessions",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRight, { className: "size-5" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				onClick: listProps.onNew,
				"aria-label": "New session",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-end px-2 pt-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				onClick: onToggle,
				"aria-label": "Collapse sessions",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRight, { className: "size-5" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionList, { ...listProps })] })
	});
}
function RenameSessionDialog({ session, onClose, onSave, busy }) {
	const [title, setTitle] = (0, import_react.useState)(session?.title ?? "");
	(0, import_react.useEffect)(() => {
		setTitle(session?.title ?? "");
	}, [session]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(session),
		onOpenChange: (open) => !open && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Rename session" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Shown in the session list." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 flex flex-col gap-3",
				onSubmit: (event) => {
					event.preventDefault();
					if (title.trim()) onSave(title.trim());
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "session-title",
						children: "Title"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "session-title",
						value: title,
						onChange: (event) => setTitle(event.target.value),
						maxLength: 120,
						autoFocus: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: busy || !title.trim(),
						children: "Save"
					})
				]
			})
		] })
	});
}
function DeleteSessionDialog({ session, onClose, onConfirm, busy }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(session),
		onOpenChange: (open) => !open && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Delete session?" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: session ? `“${session.title}” and its images will be removed.` : "" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: onClose,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "destructive",
					onClick: onConfirm,
					disabled: busy,
					children: "Delete"
				})]
			})
		] })
	});
}
var FONTS = [
	{
		id: "sans",
		label: "Sans",
		family: "system-ui, \"SF Pro Display\", sans-serif"
	},
	{
		id: "serif",
		label: "Serif",
		family: "Georgia, 'Times New Roman', serif"
	},
	{
		id: "impact",
		label: "Impact",
		family: "Impact, Haettenschweiler, 'Arial Black', sans-serif"
	},
	{
		id: "mono",
		label: "Mono",
		family: "ui-monospace, 'SF Mono', monospace"
	}
];
var COLORS = [
	"#ffffff",
	"#000000",
	"#ffd60a",
	"#ff453a",
	"#0a84ff"
];
function CanvasEditor({ open, imageUrl, onClose, onSave, busy }) {
	const canvasRef = (0, import_react.useRef)(null);
	const imageRef = (0, import_react.useRef)(null);
	const [text, setText] = (0, import_react.useState)("");
	const [fontId, setFontId] = (0, import_react.useState)("impact");
	const [size, setSize] = (0, import_react.useState)(64);
	const [color, setColor] = (0, import_react.useState)(COLORS[0]);
	const [stroke, setStroke] = (0, import_react.useState)(true);
	const [pos, setPos] = (0, import_react.useState)({
		x: .5,
		y: .78
	});
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [loadError, setLoadError] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!open) {
			setText("");
			setFontId("impact");
			setSize(64);
			setColor(COLORS[0]);
			setStroke(true);
			setPos({
				x: .5,
				y: .78
			});
			setReady(false);
			setLoadError(false);
			imageRef.current = null;
			return;
		}
		if (!imageUrl) return;
		let cancelled = false;
		setReady(false);
		setLoadError(false);
		(async () => {
			try {
				const { dataUrl } = await fetchTrustedImage({ data: { url: imageUrl } });
				if (cancelled) return;
				const image = new Image();
				image.onload = () => {
					if (cancelled) return;
					imageRef.current = image;
					setReady(true);
				};
				image.onerror = () => {
					if (!cancelled) setLoadError(true);
				};
				image.src = dataUrl;
			} catch {
				if (!cancelled) setLoadError(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [open, imageUrl]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const image = imageRef.current;
		if (!canvas || !image || !ready) return;
		const scale = Math.min(1, 960 / image.naturalWidth);
		const width = Math.max(16, Math.round(image.naturalWidth * scale));
		const height = Math.max(9, Math.round(image.naturalHeight * scale));
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(image, 0, 0, width, height);
		const value = text.trim();
		if (!value) return;
		const font = FONTS.find((item) => item.id === fontId) ?? FONTS[0];
		const fontSize = Math.max(16, Math.round(size / 960 * width));
		ctx.font = `700 ${fontSize}px ${font.family}`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		const x = pos.x * width;
		const y = pos.y * height;
		if (stroke) {
			ctx.lineWidth = Math.max(3, Math.round(fontSize / 10));
			ctx.strokeStyle = color === "#000000" ? "#ffffff" : "#000000";
			ctx.lineJoin = "round";
			ctx.miterLimit = 2;
			ctx.strokeText(value, x, y);
		}
		ctx.shadowColor = "rgba(0,0,0,0.45)";
		ctx.shadowBlur = Math.round(fontSize / 8);
		ctx.shadowOffsetY = 2;
		ctx.fillStyle = color;
		ctx.fillText(value, x, y);
		ctx.shadowBlur = 0;
	}, [
		ready,
		text,
		fontId,
		size,
		color,
		stroke,
		pos
	]);
	function canvasPoint(event) {
		const canvas = canvasRef.current;
		if (!canvas) return {
			x: .5,
			y: .5
		};
		const rect = canvas.getBoundingClientRect();
		const x = (event.clientX - rect.left) / rect.width;
		const y = (event.clientY - rect.top) / rect.height;
		return {
			x: Math.min(.95, Math.max(.05, x)),
			y: Math.min(.95, Math.max(.05, y))
		};
	}
	function exportJpeg() {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		try {
			return canvas.toDataURL("image/jpeg", .84);
		} catch {
			toast.error("Couldn’t export the overlay.");
			return null;
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (next) => !next && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "w-[min(100%-2rem,44rem)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add text overlay" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Plain text only. Drag to position. Cancel discards changes." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-hidden rounded-card border border-border bg-secondary-surface",
							children: loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "px-4 py-12 text-center text-body text-muted",
								children: "Couldn’t load that image."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
								ref: canvasRef,
								className: "block h-auto w-full cursor-grab touch-none active:cursor-grabbing",
								style: { aspectRatio: "16 / 9" },
								onPointerDown: (event) => {
									event.currentTarget.setPointerCapture(event.pointerId);
									setDragging(true);
									setPos(canvasPoint(event));
								},
								onPointerMove: (event) => {
									if (!dragging) return;
									setPos(canvasPoint(event));
								},
								onPointerUp: () => setDragging(false),
								onPointerCancel: () => setDragging(false),
								"aria-label": "Thumbnail preview. Drag to position overlay text."
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "overlay-text",
									children: "Text"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "overlay-text",
									className: "mt-1",
									value: text,
									maxLength: 80,
									onChange: (event) => setText(event.target.value.slice(0, 80)),
									placeholder: "Short, bold line",
									autoFocus: true
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
									className: "text-caption font-medium",
									children: "Font"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 flex flex-wrap gap-2",
									children: FONTS.map((font) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "sm",
										variant: fontId === font.id ? "primary" : "secondary",
										onClick: () => setFontId(font.id),
										children: font.label
									}, font.id))
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "overlay-size",
									children: "Size"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "overlay-size",
									type: "range",
									min: 28,
									max: 140,
									value: size,
									onChange: (event) => setSize(Number(event.target.value)),
									className: "mt-2 w-full accent-[var(--accent)]"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
									className: "text-caption font-medium",
									children: "Color"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex flex-wrap items-center gap-2",
									children: [COLORS.map((swatch) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "size-11 rounded-full border border-border",
										style: { background: swatch },
										"aria-label": `Color ${swatch}`,
										onClick: () => setColor(swatch)
									}, swatch)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "color",
										value: color,
										"aria-label": "Custom color",
										onChange: (event) => setColor(event.target.value),
										className: "size-11 cursor-pointer rounded-full border border-border bg-transparent p-1"
									})]
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex min-h-11 items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "overlay-stroke",
										children: "Stroke for readability"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										id: "overlay-stroke",
										checked: stroke,
										onCheckedChange: setStroke
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: onClose,
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								disabled: busy || !ready || !text.trim() || loadError,
								onClick: () => {
									const dataUrl = exportJpeg();
									if (!dataUrl) return;
									if (dataUrl.length > 18e5) {
										toast.error(userFacingErrorMessage(/* @__PURE__ */ new Error("OVERLAY_TOO_LARGE")));
										return;
									}
									onSave({
										overlayText: text.trim(),
										imageDataUrl: dataUrl
									});
								},
								children: "Save overlay"
							})]
						})
					]
				})
			]
		})
	});
}
function readPanelCollapsed() {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(THUMBNAILS_PANEL_STORAGE_KEY) === "1";
	} catch {
		return false;
	}
}
function readStoredClient() {
	if (typeof window === "undefined") return null;
	try {
		return window.sessionStorage.getItem(THUMBNAILS_CLIENT_STORAGE_KEY);
	} catch {
		return null;
	}
}
function ThumbnailsPage() {
	const { session: sessionId } = Route$24.useSearch();
	const navigate = useNavigate({ from: Route$24.fullPath });
	const queryClient = useQueryClient();
	const [draft, setDraft] = (0, import_react.useState)("");
	const [collapsed, setCollapsed] = (0, import_react.useState)(false);
	const [mobileOpen, setMobileOpen] = (0, import_react.useState)(false);
	const [clientId, setClientId] = (0, import_react.useState)(null);
	const [rename, setRename] = (0, import_react.useState)(null);
	const [remove, setRemove] = (0, import_react.useState)(null);
	const [failed, setFailed] = (0, import_react.useState)(false);
	const [overlay, setOverlay] = (0, import_react.useState)(null);
	const [generatingImageId, setGeneratingImageId] = (0, import_react.useState)(null);
	const [variationParentId, setVariationParentId] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setCollapsed(readPanelCollapsed());
		setClientId(readStoredClient());
	}, []);
	(0, import_react.useEffect)(() => {
		setFailed(false);
	}, [sessionId]);
	const aiQuery = useQuery({
		queryKey: ["ai-status"],
		queryFn: () => getAiStatus()
	});
	const sessionsQuery = useQuery({
		queryKey: THUMBNAIL_SESSIONS_QUERY_KEY,
		queryFn: () => listThumbnailSessions()
	});
	const messagesQuery = useQuery({
		queryKey: thumbnailMessagesQueryKey(sessionId ?? ""),
		queryFn: () => listThumbnailMessages({ data: sessionId }),
		enabled: Boolean(sessionId)
	});
	const clientsQuery = useQuery({
		queryKey: ["clients"],
		queryFn: () => listClients()
	});
	const llmReady = aiQuery.data?.llm !== false;
	const imageReady = aiQuery.data?.imageGen !== false;
	const llmKnown = aiQuery.isSuccess;
	const selected = (0, import_react.useMemo)(() => sessionsQuery.data?.find((row) => row.id === sessionId) ?? null, [sessionsQuery.data, sessionId]);
	(0, import_react.useEffect)(() => {
		if (selected?.clientId && selected.clientId !== clientId) setClientId(selected.clientId);
	}, [selected?.clientId, clientId]);
	function persistClient(id) {
		setClientId(id);
		try {
			window.sessionStorage.setItem(THUMBNAILS_CLIENT_STORAGE_KEY, id);
		} catch {}
	}
	function goToSession(id) {
		navigate({ search: id ? { session: id } : {} });
		setMobileOpen(false);
	}
	function togglePanel() {
		setCollapsed((prev) => {
			const next = !prev;
			try {
				window.localStorage.setItem(THUMBNAILS_PANEL_STORAGE_KEY, next ? "1" : "0");
			} catch {}
			return next;
		});
	}
	function cacheMessages(id, messages) {
		queryClient.setQueryData(thumbnailMessagesQueryKey(id), messages);
	}
	async function refreshSessions() {
		await queryClient.invalidateQueries({ queryKey: THUMBNAIL_SESSIONS_QUERY_KEY });
	}
	async function runImage(messageId) {
		setGeneratingImageId(messageId);
		try {
			const result = await generateThumbnailImageFn({ data: { messageId } });
			cacheMessages(result.session.id, result.messages);
			await refreshSessions();
			if (result.imageFallback) toast.message("Image generation is paused until an API key is connected.");
			else if (!result.ok) toast.error("The image didn’t come through. Retry.");
		} catch (error) {
			captureClientError(error, { source: "thumbnail-image" });
			toast.error(userFacingErrorMessage(error));
		} finally {
			setGeneratingImageId(null);
		}
	}
	const send = useMutation({
		mutationFn: (content) => {
			if (!clientId) throw new Error("CLIENT_REQUIRED");
			return sendThumbnailMessage({ data: {
				sessionId,
				clientId,
				content
			} });
		},
		onMutate: () => setDraft(""),
		onSuccess: async (result) => {
			await refreshSessions();
			cacheMessages(result.session.id, result.messages);
			if (result.session.id !== sessionId) goToSession(result.session.id);
			setFailed(result.fallback ? false : !result.ok);
			if (result.fallback) {
				toast.message("Generation is paused until AI is connected.");
				return;
			}
			if (result.pendingImageId && !result.imageFallback) runImage(result.pendingImageId);
			else if (result.imageFallback) toast.message("Image generation is paused until an API key is connected.");
		},
		onError: (error, content) => {
			setDraft((current) => current.trim() ? current : content);
			captureClientError(error, { source: "thumbnail-send" });
			toast.error(userFacingErrorMessage(error));
			setFailed(true);
		}
	});
	const regenerate = useMutation({
		mutationFn: (message) => regenerateThumbnail({ data: { messageId: message.id } }),
		onSuccess: async (result) => {
			cacheMessages(result.session.id, result.messages);
			await refreshSessions();
			if (result.pendingImageId) runImage(result.pendingImageId);
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const variations = useMutation({
		mutationFn: async (message) => {
			setVariationParentId(message.id);
			const started = await startThumbnailVariations({ data: { messageId: message.id } });
			cacheMessages(started.session.id, started.messages);
			for (const id of started.variationIds) await runImage(id);
			return started;
		},
		onSettled: () => setVariationParentId(null),
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const rateMut = useMutation({
		mutationFn: (input) => rateThumbnailMessage({ data: {
			messageId: input.message.id,
			rating: input.rating
		} }),
		onMutate: async (input) => {
			if (!sessionId) return;
			await queryClient.cancelQueries({ queryKey: thumbnailMessagesQueryKey(sessionId) });
			const prev = queryClient.getQueryData(thumbnailMessagesQueryKey(sessionId));
			if (prev) cacheMessages(sessionId, prev.map((row) => row.id === input.message.id ? {
				...row,
				rating: input.rating
			} : row));
			return { prev };
		},
		onError: (error, _input, ctx) => {
			if (sessionId && ctx?.prev) cacheMessages(sessionId, ctx.prev);
			toast.error(userFacingErrorMessage(error));
		},
		onSuccess: async () => {
			await refreshSessions();
		}
	});
	const overlayMut = useMutation({
		mutationFn: (input) => saveThumbnailOverlay({ data: {
			sessionId: overlay.sessionId,
			parentId: overlay.id,
			overlayText: input.overlayText,
			imageDataUrl: input.imageDataUrl
		} }),
		onSuccess: async (result) => {
			setOverlay(null);
			cacheMessages(result.session.id, result.messages);
			await refreshSessions();
			toast.success("Overlay saved");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const saveToLibrary = useMutation({
		mutationFn: (message) => ingestThumbnailFn({ data: { messageId: message.id } }),
		onSuccess: (asset) => {
			toast.success(`Saved to Library: ${asset.title}`);
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const renameMut = useMutation({
		mutationFn: (title) => renameThumbnailSession({ data: {
			id: rename.id,
			title
		} }),
		onSuccess: async () => {
			setRename(null);
			await refreshSessions();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const archiveMut = useMutation({
		mutationFn: (id) => archiveThumbnailSession({ data: id }),
		onSuccess: async (_data, id) => {
			toast.success("Session archived");
			await refreshSessions();
			if (id === sessionId) goToSession(void 0);
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const deleteMut = useMutation({
		mutationFn: (id) => deleteThumbnailSession({ data: id }),
		onSuccess: async (_data, id) => {
			setRemove(null);
			toast.success("Session deleted");
			await refreshSessions();
			if (id === sessionId) goToSession(void 0);
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	async function downloadMessage(message) {
		if (!message.imageUrl) return;
		try {
			const { dataUrl, filename } = await fetchTrustedImage({ data: { url: message.imageUrl } });
			const a = document.createElement("a");
			a.href = dataUrl;
			a.download = filename;
			a.rel = "noopener";
			a.click();
		} catch (error) {
			toast.error(userFacingErrorMessage(error));
		}
	}
	const generatingText = send.isPending;
	const messages = messagesQuery.data ?? [];
	const optimistic = send.isPending && send.variables ? [...messages, {
		id: "optimistic",
		sessionId: sessionId ?? "new",
		role: "user",
		content: send.variables,
		imageUrl: null,
		rating: null,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		metadata: null,
		createdAt: (/* @__PURE__ */ new Date()).toISOString(),
		updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		createdBy: null
	}] : messages;
	const listProps = {
		sessions: sessionsQuery.data ?? [],
		selectedId: sessionId,
		onSelect: goToSession,
		onNew: () => goToSession(void 0),
		onRename: setRename,
		onArchive: (session) => archiveMut.mutate(session.id),
		onDelete: setRemove
	};
	const showChat = Boolean(sessionId) || send.isPending;
	const inputDisabled = llmKnown && !llmReady || !clientId;
	const activeClients = (clientsQuery.data ?? []).filter((client) => client.status === "ACTIVE" && !client.deletedAt);
	const selectedClient = activeClients.find((client) => client.id === clientId) ?? null;
	const showFallback = llmKnown && (!llmReady || !imageReady);
	const composer = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
		title: "Composer",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-2",
			children: [selectedClient ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "px-1 text-caption text-muted",
				children: ["Tagged to ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-fg",
					children: selectedClient.name
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "px-1 text-caption text-muted",
				children: [
					"Select a client to generate.",
					" ",
					activeClients.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/clients",
						className: "text-accent",
						children: "Add a client"
					}) : null
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatInput, {
				value: draft,
				onChange: setDraft,
				onSend: () => send.mutate(draft),
				disabled: inputDisabled,
				sending: generatingText || Boolean(generatingImageId),
				placeholder: THUMBNAIL_PLACEHOLDER,
				autoFocus: !showChat,
				inputId: "thumbnail-input",
				maxLength: MAX_THUMBNAIL_MESSAGE_CHARS
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "-mx-4 -my-6 flex h-[calc(100dvh-3.5rem)] min-h-0 md:-mx-8 md:-my-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex min-h-14 items-center gap-2 border-b border-border px-4 md:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "sr-only",
							children: "Thumbnails"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "min-w-0 flex-1 truncate text-body font-medium",
							children: selected?.title ?? (showChat ? "New thumbnail" : "Thumbnails")
						}),
						selected?.clientName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "blue",
							className: "hidden max-w-[10rem] truncate sm:inline-flex",
							children: selected.clientName
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientSelector, {
							clients: clientsQuery.data ?? [],
							value: clientId,
							onChange: persistClient
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "md:hidden",
							onClick: () => setMobileOpen(true),
							"aria-label": "Open sessions",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRight, { className: "size-5" })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex min-h-0 flex-1 flex-col",
					children: sessionsQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
							title: "Couldn’t load sessions",
							onRetry: () => void sessionsQuery.refetch()
						})
					}) : !showChat ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Particles, {
								className: "opacity-50",
								quantity: 24
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "relative z-[1] text-page text-center font-semibold tracking-tight",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SparklesText, { children: "Make a thumbnail that stops the scroll" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "relative z-[1] mt-2 max-w-md text-center text-body text-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypingAnimation, { children: "Creative direction plus a 16:9 4K frame, tagged to a client." })
							}),
							showFallback ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6 w-full max-w-md",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, {})
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-8 w-full max-w-2xl",
								children: composer
							})
						]
					}) : messagesQuery.isError && sessionId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
							title: "Couldn’t load this session",
							onRetry: () => void messagesQuery.refetch()
						})
					}) : sessionId && messagesQuery.isPending && !send.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-1 flex-col gap-3 px-6 py-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-2/3 self-end" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "aspect-video w-full max-w-xl" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-1/2 self-end" })
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-h-0 flex-1 flex-col",
						children: [
							showFallback ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-4 pt-4 md:px-8",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, {})
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
								title: "Messages",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThumbnailMessageList, {
									messages: optimistic,
									generatingText: generatingText && llmReady,
									generatingImageId,
									variationParentId,
									failed,
									busyMessageId: generatingImageId,
									onRetry: () => {
										if (draft.trim()) send.mutate(draft);
									},
									onRegenerate: (message) => regenerate.mutate(message),
									onVariations: (message) => variations.mutate(message),
									onDownload: (message) => void downloadMessage(message),
									onRate: (message, rating) => rateMut.mutate({
										message,
										rating
									}),
									onOverlay: setOverlay,
									onRetryImage: (message) => void runImage(message.id),
									onSaveToLibrary: (message) => saveToLibrary.mutate(message)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8",
								children: composer
							})
						]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionPanel, {
				collapsed,
				onToggle: togglePanel,
				...listProps
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: mobileOpen,
				onOpenChange: setMobileOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "top-0 right-0 left-auto h-dvh w-[min(100%,20rem)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-y-0 border-r-0 p-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
							className: "sr-only",
							children: "Session list"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "sr-only",
							children: "Thumbnail sessions grouped by client"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionList, { ...listProps })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RenameSessionDialog, {
				session: rename,
				onClose: () => setRename(null),
				onSave: (title) => renameMut.mutate(title),
				busy: renameMut.isPending
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeleteSessionDialog, {
				session: remove,
				onClose: () => setRemove(null),
				onConfirm: () => remove && deleteMut.mutate(remove.id),
				busy: deleteMut.isPending
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
				title: "Canvas editor",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CanvasEditor, {
					open: Boolean(overlay),
					imageUrl: overlay?.imageUrl ?? null,
					onClose: () => setOverlay(null),
					onSave: (payload) => overlayMut.mutate(payload),
					busy: overlayMut.isPending
				})
			})
		]
	});
}
//#endregion
export { ThumbnailsPage as component };
