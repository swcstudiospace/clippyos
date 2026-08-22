import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { D as Send, G as MessageCircle, I as Phone } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, O as cn, m as userFacingErrorMessage, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Cb8e3ND-.mjs";
import { n as CHANNEL_LABELS, t as CHANNELS_QUERY_KEY } from "./channels-BG56fSeM.mjs";
import { i as sendChannelMessageFn, n as getChannelsSnapshotFn, r as listChannelMessagesFn, t as assignChannelThreadFn } from "./channel-fns-DBsr47y0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inbox-CRkZMtd-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function InboxPage() {
	const queryClient = useQueryClient();
	const snapshot = useQuery({
		queryKey: CHANNELS_QUERY_KEY,
		queryFn: () => getChannelsSnapshotFn()
	});
	const [threadId, setThreadId] = (0, import_react.useState)(null);
	const [compose, setCompose] = (0, import_react.useState)("");
	const [newProvider, setNewProvider] = (0, import_react.useState)("telegram");
	const [newTo, setNewTo] = (0, import_react.useState)("");
	const threadQuery = useQuery({
		queryKey: [
			...CHANNELS_QUERY_KEY,
			"thread",
			threadId
		],
		queryFn: () => listChannelMessagesFn({ data: { threadId } }),
		enabled: Boolean(threadId)
	});
	const send = useMutation({
		mutationFn: () => sendChannelMessageFn({ data: threadId ? {
			threadId,
			body: compose
		} : {
			provider: newProvider,
			to: newTo,
			body: compose
		} }),
		onSuccess: async (result) => {
			setCompose("");
			setNewTo("");
			setThreadId(result.thread.id);
			toast.success("Sent");
			await queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const assign = useMutation({
		mutationFn: (clientId) => assignChannelThreadFn({ data: {
			threadId,
			clientId
		} }),
		onSuccess: async () => {
			toast.success("Client linked");
			await queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const threads = snapshot.data?.threads ?? [];
	const selected = (0, import_react.useMemo)(() => threads.find((row) => row.id === threadId) ?? threadQuery.data?.thread ?? null, [
		threads,
		threadId,
		threadQuery.data?.thread
	]);
	if (snapshot.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Inbox",
			description: "Telegram and WhatsApp for customers and companies — not Computer Use."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-6 h-96 w-full rounded-card" })]
	});
	if (snapshot.isError || !snapshot.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, { title: "Inbox" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			className: "mt-6",
			title: "Couldn’t load inbox",
			description: "Retry in a moment.",
			onRetry: () => void snapshot.refetch()
		})]
	});
	function onSend(event) {
		event.preventDefault();
		send.mutate();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl pb-24 md:pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Inbox",
				description: "Professional liaison. Telegram Bot API and WhatsApp Cloud API. The Windows Social Machine is never used for these chats."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: snapshot.data.telegramConfigured ? "green" : "orange",
					children: ["Telegram ", snapshot.data.telegramConfigured ? "connected" : "not configured"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: snapshot.data.whatsappConfigured ? "green" : "orange",
					children: ["WhatsApp ", snapshot.data.whatsappConfigured ? "connected" : "not configured"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
					className: "p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-b border-border px-4 py-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption font-medium text-muted",
							children: "Threads"
						})
					}), threads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 py-8 text-caption text-muted",
						children: "No conversations yet."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col",
						children: threads.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setThreadId(thread.id),
							className: cn("flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-glass", thread.id === threadId && "bg-glass"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex min-w-0 items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-0 truncate text-body font-medium",
										children: thread.contactName
									}), thread.provider === "whatsapp" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
										className: "size-3.5 shrink-0 text-muted",
										"aria-hidden": "true"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
										className: "size-3.5 shrink-0 text-muted",
										"aria-hidden": "true"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate text-caption text-muted",
									children: thread.lastPreview ?? CHANNEL_LABELS[thread.provider]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-caption text-muted",
									children: formatRelativeTime(thread.lastMessageAt)
								})
							]
						}) }, thread.id))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
					className: "flex min-h-96 flex-col p-0",
					children: [selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "truncate text-card font-semibold tracking-tight",
								children: selected.contactName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-caption text-muted",
								children: [CHANNEL_LABELS[selected.provider], selected.contactHandle ? ` · ${selected.contactHandle}` : ""]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: selected.clientId ?? "none",
							onValueChange: (value) => assign.mutate(value === "none" ? null : value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "w-full min-w-0 max-w-xs",
								"aria-label": "Link client",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Link client" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "none",
								children: "No client"
							}), snapshot.data.clients.map((client) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: client.id,
								children: client.name
							}, client.id))] })]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4",
						children: threadQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full rounded-card" }) : (threadQuery.data?.messages ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
							title: "No messages",
							description: "Send the first reply."
						}) : threadQuery.data?.messages.map((message) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("max-w-[85%] rounded-card px-3 py-2 text-body", message.direction === "out" ? "ml-auto bg-accent text-accent-fg" : "bg-secondary-surface text-fg"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: message.body }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: cn("mt-1 text-caption", message.direction === "out" ? "text-accent-fg/80" : "text-muted"),
								children: [
									formatRelativeTime(message.createdAt),
									" · ",
									message.status
								]
							})]
						}, message.id))
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-1 items-center justify-center px-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
							title: "Pick a thread or start one",
							description: "New chats use a Telegram chat id or a WhatsApp E.164 number."
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: onSend,
						className: "border-t border-border p-4",
						children: [!selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "ch-provider",
									children: "Channel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: newProvider,
									onValueChange: (value) => setNewProvider(value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										id: "ch-provider",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "telegram",
										children: "Telegram"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "whatsapp",
										children: "WhatsApp"
									})] })]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "ch-to",
									children: newProvider === "whatsapp" ? "E.164 number" : "Chat id"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "ch-to",
									value: newTo,
									onChange: (event) => setNewTo(event.target.value),
									placeholder: newProvider === "whatsapp" ? "+61412345678" : "@company or 123456"
								})]
							})]
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: compose,
								onChange: (event) => setCompose(event.target.value),
								placeholder: "Write a professional reply",
								required: true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "submit",
								disabled: send.isPending || !compose.trim(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
									className: "size-4",
									"aria-hidden": "true"
								}), send.isPending ? "Sending…" : "Send"]
							})]
						})]
					})]
				})]
			})
		]
	});
}
//#endregion
export { InboxPage as component };
