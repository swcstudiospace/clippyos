import { o as __toESM } from "../_runtime.mjs";
import { Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { D as ideationMessagesQueryKey, l as IDEATION_THREADS_QUERY_KEY } from "./mappers-Bmic_hyw.mjs";
import { a as IDEATION_PANEL_STORAGE_KEY } from "./constants-CdtfzQP2.mjs";
import { s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { c as listClients, r as getAiStatus } from "./clients-CmcyBPZd.mjs";
import { L as Pencil, N as Plus, O as Search, Rt as Archive, c as UserRound, ft as Ellipsis, h as Trash2, z as PanelRight } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as usePrefersReducedMotion, O as cn, m as userFacingErrorMessage, p as captureClientError, u as Route$33, w as Button, x as SparklesText } from "./router-DRtNPEcw.mjs";
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
import { n as SafeMarkdown, t as ChatInput } from "./markdown-BvUKUwQu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ideation-DUEdiAJV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var listIdeationThreads = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("1bd48d0b42d0aabc0f6b6d9a0ad9e2a0754953b8835bad03cb82e875e63b5126"));
var listIdeationMessages = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("c7bbea99801283f0fb93e52642de58f737c8d440d38f0567c25f1f2071eee5fb"));
var renameIdeationThread = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	title: string().trim().min(1).max(120)
}).parse(input)).handler(createSsrRpc("38d3a5187b6841fd0351444740ddb860d4008a917e269f0829121a2e5d99d07f"));
var tagIdeationThread = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	id: string().min(1),
	clientId: string().min(1).nullable()
}).parse(input)).handler(createSsrRpc("f2da04d1a306ba905e469e0bcef79f5c1e1231f20c1d14b56bb9253bedaddb12"));
var archiveIdeationThread = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("8e1932d9c7067c2c78dec421c52b0affcb135f81f6b3347bf98cb899b72bc7a4"));
var deleteIdeationThread = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("e5ca62b54f5272b2c9f0fcd7b5bf10f60a0cc36bdcc24532e7db1fe5e8a13c0c"));
var sendIdeationMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	threadId: string().min(1).optional(),
	content: string().max(8e3)
}).parse(input)).handler(createSsrRpc("0e727aea63716fa69b76d7d82f787ebb3edbd0cd92eeaa9df5d00d07dc5a1b6d"));
var retryIdeationTurn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => string().min(1).parse(id)).handler(createSsrRpc("9129291952b904d01cb761f0a379d8332520438cff67f058961feff347c43b50"));
function toolsCaption(metadata) {
	if (!metadata || typeof metadata !== "object") return null;
	const tools = metadata.toolsUsed;
	if (!Array.isArray(tools) || tools.length === 0) return null;
	return `Used ${tools.map((name) => {
		if (name === "query_clients") return "client lookup";
		if (name === "analyze_youtube") return "YouTube analysis";
		if (name === "general_lookup") return "web lookup";
		return "tool";
	}).join(", ")}`;
}
function TypingIndicator() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
	});
}
function MessageList({ messages, generating, toolHint, failed, onRetry }) {
	const endRef = (0, import_react.useRef)(null);
	const reduced = usePrefersReducedMotion();
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({
			behavior: reduced ? "auto" : "smooth",
			block: "end"
		});
	}, [
		messages,
		generating,
		failed,
		reduced
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 md:px-8",
		"aria-live": "polite",
		"aria-busy": generating,
		children: [
			messages.map((message) => {
				const user = message.role === "user";
				const caption = !user ? toolsCaption(message.metadata) : null;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("flex", user ? "justify-end" : "justify-start"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("max-w-[min(100%,42rem)] px-4 py-3", user ? "msg-bubble-user" : "msg-bubble-assistant"),
						children: [user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "whitespace-pre-wrap text-body",
							children: message.content
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafeMarkdown, { content: message.content }), caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-caption text-muted",
							children: caption
						}) : null]
					})
				}, message.id);
			}),
			generating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [toolHint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: "Looking something up…"
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypingIndicator, {})]
			}) : null,
			failed && !generating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
function ThreadList({ threads, selectedId, onSelect, onNew, onRename, onTag, onArchive, onDelete }) {
	const [search, setSearch] = (0, import_react.useState)("");
	const [debounced, setDebounced] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const handle = window.setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
		return () => window.clearTimeout(handle);
	}, [search]);
	const rows = (0, import_react.useMemo)(() => {
		if (!debounced) return threads;
		return threads.filter((thread) => {
			return `${thread.title} ${thread.clientName ?? ""}`.toLowerCase().includes(debounced);
		});
	}, [threads, debounced]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2 px-4 pt-4 pb-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-card font-semibold tracking-tight",
					children: "Threads"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-11",
					onClick: onNew,
					"aria-label": "New thread",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-3 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "sr-only",
					htmlFor: "thread-search",
					children: "Search threads"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "thread-search",
						value: search,
						onChange: (event) => setSearch(event.target.value),
						placeholder: "Search",
						className: "pl-9"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-2 pb-4",
				children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-3 py-8 text-center text-body text-muted",
					children: threads.length === 0 ? "No conversations yet" : "No matching conversations"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-1",
					children: rows.map((thread) => {
						const active = thread.id === selectedId;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("group flex items-start gap-1 rounded-control px-1", active && "bg-glass shadow-[inset_0_0_0_0.5px_var(--border)]"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => onSelect(thread.id),
								className: "min-h-11 min-w-0 flex-1 rounded-control px-2 py-2 text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-body font-medium",
									children: thread.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-0.5 flex flex-wrap items-center gap-1.5 text-caption text-muted",
									children: [thread.clientName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "blue",
										className: "font-normal",
										children: thread.clientName
									}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatRelativeTime(thread.updatedAt) })]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									className: "mt-1 size-11 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
									"aria-label": `Actions for ${thread.title}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-4" })
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
								align: "end",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
										onSelect: () => onRename(thread),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" }), "Rename"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
										onSelect: () => onTag(thread),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "size-4" }), "Tag to client"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
										onSelect: () => onArchive(thread),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "size-4" }), "Archive"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
										onSelect: () => onDelete(thread),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Delete"]
									})
								]
							})] })]
						}) }, thread.id);
					})
				})
			})
		]
	});
}
function ThreadPanel({ collapsed, onToggle, className, ...listProps }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
		className: cn("hidden min-h-0 flex-col border-l border-border bg-bg/90 backdrop-blur-xl md:flex", "transition-[width] duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none", collapsed ? "w-14" : "w-[300px]", className),
		children: collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-2 pt-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				onClick: onToggle,
				"aria-label": "Expand threads",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRight, { className: "size-5" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				onClick: listProps.onNew,
				"aria-label": "New thread",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-end px-2 pt-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				onClick: onToggle,
				"aria-label": "Collapse threads",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRight, { className: "size-5" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThreadList, { ...listProps })] })
	});
}
function RenameThreadDialog({ thread, onClose, onSave, busy }) {
	const [title, setTitle] = (0, import_react.useState)(thread?.title ?? "");
	(0, import_react.useEffect)(() => {
		setTitle(thread?.title ?? "");
	}, [thread]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(thread),
		onOpenChange: (open) => !open && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Rename thread" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Shown in the thread list." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 flex flex-col gap-3",
				onSubmit: (event) => {
					event.preventDefault();
					if (title.trim()) onSave(title.trim());
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "thread-title",
						children: "Title"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "thread-title",
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
function TagClientDialog({ thread, clients, onClose, onSave, busy }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const filtered = clients.filter((client) => client.status === "ACTIVE" && !client.deletedAt).filter((client) => `${client.name} ${client.channelUrl ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(thread),
		onOpenChange: (open) => {
			if (!open) {
				setQuery("");
				onClose();
			}
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Tag to client" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Optional. A short client summary is added to this thread’s context." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				className: "mt-4",
				value: query,
				onChange: (event) => setQuery(event.target.value),
				placeholder: "Search clients",
				"aria-label": "Search clients"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-3 max-h-64 overflow-y-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "flex min-h-11 w-full items-center rounded-control px-3 text-left text-body hover:bg-glass",
					onClick: () => onSave(null),
					disabled: busy,
					children: "No client"
				}) }), filtered.map((client) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "flex min-h-11 w-full items-center rounded-control px-3 text-left text-body hover:bg-glass",
					onClick: () => onSave(client.id),
					disabled: busy,
					children: client.name
				}) }, client.id))]
			})
		] })
	});
}
function DeleteThreadDialog({ thread, onClose, onConfirm, busy }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: Boolean(thread),
		onOpenChange: (open) => !open && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Delete conversation?" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: thread ? `“${thread.title}” and its messages will be removed.` : "" }),
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
function readPanelCollapsed() {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(IDEATION_PANEL_STORAGE_KEY) === "1";
	} catch {
		return false;
	}
}
function IdeationPage() {
	const { thread: threadId } = Route$33.useSearch();
	const navigate = useNavigate({ from: Route$33.fullPath });
	const queryClient = useQueryClient();
	const [draft, setDraft] = (0, import_react.useState)("");
	const [collapsed, setCollapsed] = (0, import_react.useState)(false);
	const [mobileOpen, setMobileOpen] = (0, import_react.useState)(false);
	const [rename, setRename] = (0, import_react.useState)(null);
	const [tag, setTag] = (0, import_react.useState)(null);
	const [remove, setRemove] = (0, import_react.useState)(null);
	const [failed, setFailed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setCollapsed(readPanelCollapsed());
	}, []);
	(0, import_react.useEffect)(() => {
		setFailed(false);
	}, [threadId]);
	const aiQuery = useQuery({
		queryKey: ["ai-status"],
		queryFn: () => getAiStatus()
	});
	const threadsQuery = useQuery({
		queryKey: IDEATION_THREADS_QUERY_KEY,
		queryFn: () => listIdeationThreads()
	});
	const messagesQuery = useQuery({
		queryKey: ideationMessagesQueryKey(threadId ?? ""),
		queryFn: () => listIdeationMessages({ data: threadId }),
		enabled: Boolean(threadId)
	});
	const clientsQuery = useQuery({
		queryKey: ["clients"],
		queryFn: () => listClients()
	});
	const llmReady = aiQuery.data?.llm !== false;
	const llmKnown = aiQuery.isSuccess;
	const selected = (0, import_react.useMemo)(() => threadsQuery.data?.find((row) => row.id === threadId) ?? null, [threadsQuery.data, threadId]);
	function goToThread(id) {
		navigate({ search: id ? { thread: id } : {} });
		setMobileOpen(false);
	}
	function togglePanel() {
		setCollapsed((prev) => {
			const next = !prev;
			try {
				window.localStorage.setItem(IDEATION_PANEL_STORAGE_KEY, next ? "1" : "0");
			} catch {}
			return next;
		});
	}
	const send = useMutation({
		mutationFn: (content) => sendIdeationMessage({ data: {
			threadId,
			content
		} }),
		onMutate: () => {
			setDraft("");
		},
		onSuccess: async (result) => {
			await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
			queryClient.setQueryData(ideationMessagesQueryKey(result.thread.id), result.messages);
			if (result.thread.id !== threadId) goToThread(result.thread.id);
			setFailed(result.fallback ? false : !result.ok);
			if (result.fallback) toast.message("Generation is paused until AI is connected.");
		},
		onError: (error, content) => {
			setDraft((current) => current.trim() ? current : content);
			captureClientError(error, { source: "ideation-send" });
			toast.error(userFacingErrorMessage(error));
			setFailed(true);
		}
	});
	const retry = useMutation({
		mutationFn: () => retryIdeationTurn({ data: threadId }),
		onSuccess: async (result) => {
			await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
			queryClient.setQueryData(ideationMessagesQueryKey(result.thread.id), result.messages);
			setFailed(!result.ok && !result.fallback);
		},
		onError: (error) => {
			captureClientError(error, { source: "ideation-retry" });
			toast.error(userFacingErrorMessage(error));
			setFailed(true);
		}
	});
	const renameMut = useMutation({
		mutationFn: (title) => renameIdeationThread({ data: {
			id: rename.id,
			title
		} }),
		onSuccess: async () => {
			setRename(null);
			await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const tagMut = useMutation({
		mutationFn: (clientId) => tagIdeationThread({ data: {
			id: tag.id,
			clientId
		} }),
		onSuccess: async () => {
			setTag(null);
			await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const archiveMut = useMutation({
		mutationFn: (id) => archiveIdeationThread({ data: id }),
		onSuccess: async (_data, id) => {
			toast.success("Conversation archived");
			await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
			if (id === threadId) goToThread(void 0);
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const deleteMut = useMutation({
		mutationFn: (id) => deleteIdeationThread({ data: id }),
		onSuccess: async (_data, id) => {
			setRemove(null);
			toast.success("Conversation deleted");
			await queryClient.invalidateQueries({ queryKey: IDEATION_THREADS_QUERY_KEY });
			if (id === threadId) goToThread(void 0);
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const generating = send.isPending || retry.isPending;
	const messages = messagesQuery.data ?? [];
	const optimistic = send.isPending && send.variables ? [...messages, {
		id: "optimistic",
		threadId: threadId ?? "new",
		role: "user",
		content: send.variables,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		metadata: null,
		createdAt: (/* @__PURE__ */ new Date()).toISOString(),
		updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		createdBy: null
	}] : messages;
	const listProps = {
		threads: threadsQuery.data ?? [],
		selectedId: threadId,
		onSelect: goToThread,
		onNew: () => goToThread(void 0),
		onRename: setRename,
		onTag: setTag,
		onArchive: (thread) => archiveMut.mutate(thread.id),
		onDelete: setRemove
	};
	const showChat = Boolean(threadId) || send.isPending;
	const composer = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
		title: "Composer",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatInput, {
			value: draft,
			onChange: setDraft,
			onSend: () => send.mutate(draft),
			disabled: llmKnown && !llmReady,
			sending: generating,
			autoFocus: !showChat
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
							children: "Ideation"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "min-w-0 flex-1 truncate text-body font-medium",
							children: selected?.title ?? (showChat ? "New Ideation" : "Ideation")
						}),
						selected?.clientName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "blue",
							className: "max-w-[10rem] truncate",
							children: selected.clientName
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "md:hidden",
							onClick: () => setMobileOpen(true),
							"aria-label": "Open threads",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRight, { className: "size-5" })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex min-h-0 flex-1 flex-col",
					children: threadsQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
							title: "Couldn’t load threads",
							onRetry: () => void threadsQuery.refetch()
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
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SparklesText, { children: "What are we ideating today?" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "relative z-[1] mt-2 max-w-md text-center text-body text-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypingAnimation, { children: "Titles, hooks, thumbnails, and growth." })
							}),
							llmKnown && !llmReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6 w-full max-w-md",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, {})
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-8 w-full max-w-2xl",
								children: composer
							})
						]
					}) : messagesQuery.isError && threadId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
							title: "Couldn’t load this conversation",
							onRetry: () => void messagesQuery.refetch()
						})
					}) : threadId && messagesQuery.isPending && !send.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-1 flex-col gap-3 px-6 py-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-2/3 self-end" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-3/4" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-1/2 self-end" })
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-h-0 flex-1 flex-col",
						children: [
							llmKnown && !llmReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-4 pt-4 md:px-8",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, {})
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBoundary, {
								title: "Messages",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageList, {
									messages: optimistic,
									generating: generating && llmReady,
									failed,
									onRetry: () => {
										if (threadId) retry.mutate();
										else if (draft.trim()) send.mutate(draft);
									}
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThreadPanel, {
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
							children: "Conversation list"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "sr-only",
							children: "Conversations in Ideation"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThreadList, { ...listProps })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RenameThreadDialog, {
				thread: rename,
				onClose: () => setRename(null),
				onSave: (title) => renameMut.mutate(title),
				busy: renameMut.isPending
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TagClientDialog, {
				thread: tag,
				clients: clientsQuery.data ?? [],
				onClose: () => setTag(null),
				onSave: (clientId) => tagMut.mutate(clientId),
				busy: tagMut.isPending
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeleteThreadDialog, {
				thread: remove,
				onClose: () => setRemove(null),
				onConfirm: () => remove && deleteMut.mutate(remove.id),
				busy: deleteMut.isPending
			})
		]
	});
}
//#endregion
export { IdeationPage as component };
