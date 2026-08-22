import { o as __toESM } from "../_runtime.mjs";
import { l as require_react_dom, u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as SOCIAL_PLATFORMS } from "./mappers-Bmic_hyw.mjs";
import { u as SOCIAL_DESKTOP_SIZE_KEY } from "./constants-CdtfzQP2.mjs";
import { r as formatCompactCount, s as formatRelativeTime } from "./format-DaT2NYM9.mjs";
import { v as shortActor } from "./safety-CI611PZC.mjs";
import { d as useRouterState, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { n as RAIL_LABELS, o as emptyPublisherMap, r as TIKTOK_MODE_LABELS } from "./social-oauth.server-BkBN9MI7.mjs";
import { u as PROXY_COUNTRIES } from "./social-machine-D22Q8XQF.mjs";
import { F as Play, U as MonitorPlay, V as Music2, W as Minimize2, d as Upload, dt as Expand, j as RefreshCw, k as Scaling, nt as Instagram, ot as Globe, q as Maximize2, t as Youtube, ut as ExternalLink, y as Square } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, O as cn, m as userFacingErrorMessage, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { n as Textarea, t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { i as DialogTitle, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-ChagZPco.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetDescription, t as Sheet } from "./sheet-J1oGBwS0.mjs";
import { n as statusTone, t as Badge } from "./badge-CDaEWAH4.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as LinearIssueActions } from "./issue-actions-LfCDQlgU.mjs";
import { t as AIFallbackPanel } from "./ai-fallback-panel-KjxISs65.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Cb8e3ND-.mjs";
import { _ as sessionLabel, b as uploadPhaseLabel, d as machineLabel, f as machineTone, g as postStatusLabel, l as formatDisplaySize, p as novncEmbedUrl, r as PLATFORM_LABELS, s as SOCIAL_QUERY_KEY, t as DEFAULT_DESKTOP_WIDTH, u as jobStatusLabel } from "./social-CmuIUyLc.mjs";
import { g as WINDOW_LABELS, k as socialPlatformToPerformance, s as PERFORMANCE_QUERY_KEY, x as formatUnknownNumber } from "./performance-Cj9pmeSi.mjs";
import { t as ScoreBadge } from "./score-badge-IJk18-LU.mjs";
import { o as recordManualMetricsFn } from "./performance-fns-BnwGGujQ.mjs";
import { cancelSocialUpload, getSocialSnapshot, markPlatformSession, openSocialPlatform, provisionLocationProxyFn, queueSocialUpload, refreshSocialDesktop, retrySocialUpload, startSocialDesktop, stopSocialDesktop, updateSocialPostStatus } from "./social-Cwlrz0WD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/social-DJcFXmjw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
function MachineBar({ machine, onStart, onStop, starting, stopping }) {
	const queryClient = useQueryClient();
	const [geoOpen, setGeoOpen] = (0, import_react.useState)(false);
	const [country, setCountry] = (0, import_react.useState)("AU");
	const canStart = machine.configured && (machine.state === "stopped" || machine.state === "error" || machine.state === "paused") && !starting && !stopping;
	const canStop = (machine.state === "running" || machine.state === "starting") && !stopping;
	const resume = machine.state === "paused";
	const provision = useMutation({
		mutationFn: () => provisionLocationProxyFn({ data: { country } }),
		onSuccess: async (result) => {
			toast.success(`Location matched · ${result.country}${result.egressIp ? ` · ${result.egressIp}` : ""}`);
			await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
			setGeoOpen(false);
			onStart();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	function requestStart() {
		if (resume || machine.proxyConfigured) {
			onStart();
			return;
		}
		setGeoOpen(true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "social-machine-bar sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 md:static",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-11 place-items-center rounded-control bg-secondary-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorPlay, {
							className: "size-5",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-card font-semibold tracking-tight",
									children: "Social Machine"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: machineTone(machine.state),
									children: machineLabel(machine.state)
								}),
								machine.proxyConfigured ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "green",
									children: "Location ready"
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-caption text-muted",
							children: resume ? "Hibernated hot snapshot — Resume picks up the same session, cookies, and open apps." : `Opens X, YouTube, Instagram, and TikTok from inside ClippyOS. Idle hibernate after ${machine.autoStopMinutes} min.`
						}),
						machine.startedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-caption text-muted",
							children: [
								"Started ",
								formatRelativeTime(machine.startedAt),
								machine.longRunning ? " · running a long time — hibernate if idle." : ""
							]
						}) : null,
						machine.lastError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-caption text-danger",
							children: machine.lastError
						}) : null
					] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: requestStart,
						disabled: !canStart,
						"aria-label": resume ? "Resume Social Machine" : "Start Social Machine",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
							className: "size-4",
							"aria-hidden": "true"
						}), starting || provision.isPending ? "Starting…" : resume ? "Resume" : "Start Social Machine"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: canStop ? "destructive" : "ghost",
						onClick: onStop,
						disabled: !canStop,
						"aria-label": "Hibernate Social Machine",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, {
							className: "size-4",
							"aria-hidden": "true"
						}), stopping ? "Hibernating…" : "Hibernate"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-caption text-muted",
				children: machine.pathNote
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: geoOpen,
				onOpenChange: setGeoOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Where should the Social Machine appear from?" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "First start matches your country so X, YouTube, Instagram, and TikTok open from inside the OS as if you were there. Australia is the default." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "proxy-country",
							children: "Country"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: country,
							onValueChange: (value) => setCountry(value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								id: "proxy-country",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: PROXY_COUNTRIES.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: row.code,
								children: row.name
							}, row.code)) })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							disabled: provision.isPending,
							onClick: () => provision.mutate(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, {
								className: "size-4",
								"aria-hidden": "true"
							}), provision.isPending ? "Matching location…" : "Match location and start"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							disabled: provision.isPending,
							onClick: () => {
								setGeoOpen(false);
								onStart();
							},
							children: "Start without matching"
						})]
					})
				] })
			})
		]
	});
}
function XMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			d: "M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.2 22H1.94l8.02-9.16L1.5 2h6.76l4.66 6.18L18.244 2Zm-1.16 18.15h1.81L6.99 3.76H5.05l12.03 16.39Z"
		})
	});
}
var ICONS = {
	instagram: Instagram,
	x: XMark,
	tiktok: Music2,
	youtube: Youtube
};
function PlatformCards({ sessions, publishers, machineState, configured, onOpen, onMark, opening }) {
	const running = machineState === "running";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
		children: [
			"instagram",
			"x",
			"tiktok",
			"youtube"
		].map((platform) => {
			const Icon = ICONS[platform];
			const session = sessions[platform];
			const pub = publishers?.[platform];
			const tone = session === "logged_in" ? "green" : session === "not_logged_in" ? "orange" : "neutral";
			const tiktokMode = pub?.tiktok?.eligibleDirectPost && pub.tiktok.postModeDefault === "DIRECT_POST" ? TIKTOK_MODE_LABELS.DIRECT_POST : TIKTOK_MODE_LABELS.UPLOAD_TO_INBOX;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
				interactive: true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative z-[1] flex items-start justify-between gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-11 place-items-center rounded-control bg-secondary-surface",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-card font-semibold tracking-tight",
								children: PLATFORM_LABELS[platform]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex flex-wrap gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone,
										children: sessionLabel(session)
									}),
									platform === "tiktok" && pub?.eligible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "teal",
										children: tiktokMode
									}) : null,
									platform === "instagram" && pub?.eligible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "teal",
										children: "Professional"
									}) : null
								]
							})] })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "relative z-[1] mt-2 text-caption text-muted",
						children: platform === "instagram" ? pub?.eligible ? `API: ${pub.handle ?? "connected"} (Professional)` : "API not connected — Browser only" : platform === "youtube" ? pub?.eligible ? pub.handle ? `API connected as ${pub.handle}` : "API connected" : "API not connected — Studio in the browser" : pub?.eligible ? pub.handle ? `API connected as ${pub.handle}` : "API connected" : "API not connected — using browser"
					}),
					!configured || machineState === "stopped" || machineState === "not_configured" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "relative z-[1] mt-3 text-caption text-muted",
						children: publishers?.[platform]?.eligible ? "API ready — 1-click upload does not need the machine." : configured ? "Start the Social Machine to open this site in the desktop." : "Connect a publisher API in Settings, or Daytona for Computer Use."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-[1] mt-4 flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							disabled: !running || opening === platform,
							onClick: () => onOpen(platform),
							children: opening === platform ? "Opening…" : "Open in Machine"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1",
							children: [
								"logged_in",
								"not_logged_in",
								"unknown"
							].map((state) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: session === state ? "secondary" : "ghost",
								onClick: () => onMark(platform, state),
								children: sessionLabel(state)
							}, state))
						})]
					})
				]
			}, platform);
		})
	});
}
var MIN_WIDTH = 480;
var MIN_HEIGHT = 320;
function readStoredSize() {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(SOCIAL_DESKTOP_SIZE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		const width = Number(parsed.width);
		const height = Number(parsed.height);
		if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
		if (width < MIN_WIDTH || height < MIN_HEIGHT) return null;
		return {
			width: Math.round(width),
			height: Math.round(height)
		};
	} catch {
		return null;
	}
}
function persistSize(size) {
	try {
		window.localStorage.setItem(SOCIAL_DESKTOP_SIZE_KEY, JSON.stringify(size));
	} catch {}
}
function clearStoredSize() {
	try {
		window.localStorage.removeItem(SOCIAL_DESKTOP_SIZE_KEY);
	} catch {}
}
function useScreenshotSize(src) {
	const [size, setSize] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!src) {
			setSize(null);
			return;
		}
		const img = new Image();
		img.onload = () => {
			if (img.naturalWidth >= 320 && img.naturalHeight >= 240) setSize({
				width: img.naturalWidth,
				height: img.naturalHeight
			});
		};
		img.src = src;
		return () => {
			img.onload = null;
		};
	}, [src]);
	return size;
}
function fitInto(vm, hostWidth, maxHeight) {
	const widthCap = Math.max(MIN_WIDTH, hostWidth);
	const heightCap = Math.max(MIN_HEIGHT, maxHeight);
	if (vm.width <= widthCap && vm.height <= heightCap) return {
		width: vm.width,
		height: vm.height
	};
	const scale = Math.min(widthCap / vm.width, heightCap / vm.height);
	return {
		width: Math.max(MIN_WIDTH, Math.round(vm.width * scale)),
		height: Math.max(MIN_HEIGHT, Math.round(vm.height * scale))
	};
}
function DesktopFrame({ src, title, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
		title,
		src,
		className: cn("size-full border-0 bg-bg", className),
		allow: "clipboard-read; clipboard-write; fullscreen; autoplay; keyboard-map",
		allowFullScreen: true,
		referrerPolicy: "no-referrer"
	});
}
function ImmersiveDesktop({ src, vm, onClose, onReload, onOpenTab, refreshing }) {
	(0, import_react.useEffect)(() => {
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const onKey = (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				onClose();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = previous;
			window.removeEventListener("keydown", onKey);
		};
	}, [onClose]);
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "vm-immersive",
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "vm-immersive-title",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-2 border-b border-border bg-elevated px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					id: "vm-immersive-title",
					className: "text-card font-semibold tracking-tight",
					children: "Social Machine"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-caption text-muted",
					children: [
						"Full desktop · ",
						formatDisplaySize(vm.width, vm.height),
						" · Esc to return"
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "secondary",
						onClick: onReload,
						disabled: refreshing,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `size-3.5 ${refreshing ? "motion-safe:animate-spin" : ""}` }), "Reload"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: onOpenTab,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" }), "New tab"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						onClick: onClose,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimize2, { className: "size-3.5" }), "Exit full desktop"]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-0 flex-1 bg-bg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DesktopFrame, {
				src,
				title: "Social Machine desktop full view"
			})
		})]
	}), document.body);
}
function DesktopSurface({ machine, onRefresh, refreshing }) {
	const running = machine.state === "running";
	const src = novncEmbedUrl(machine.previewUrl);
	const shotSize = useScreenshotSize(machine.lastScreenshot);
	const hostRef = (0, import_react.useRef)(null);
	const frameRef = (0, import_react.useRef)(null);
	const [hostWidth, setHostWidth] = (0, import_react.useState)(0);
	const [viewportH, setViewportH] = (0, import_react.useState)(() => typeof window === "undefined" ? 800 : window.innerHeight);
	const [mode, setMode] = (0, import_react.useState)("fit");
	const [custom, setCustom] = (0, import_react.useState)(null);
	const [immersive, setImmersive] = (0, import_react.useState)(false);
	const dragRef = (0, import_react.useRef)(null);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const vm = (0, import_react.useMemo)(() => {
		if (machine.displayWidth && machine.displayHeight) return {
			width: machine.displayWidth,
			height: machine.displayHeight
		};
		if (shotSize) return shotSize;
		return {
			width: DEFAULT_DESKTOP_WIDTH,
			height: 800
		};
	}, [
		machine.displayWidth,
		machine.displayHeight,
		shotSize
	]);
	(0, import_react.useEffect)(() => {
		const stored = readStoredSize();
		if (stored) {
			setCustom(stored);
			setMode("custom");
		}
	}, []);
	(0, import_react.useEffect)(() => {
		const node = hostRef.current;
		if (!node || typeof ResizeObserver === "undefined") return;
		const update = () => setHostWidth(Math.round(node.getBoundingClientRect().width));
		update();
		const observer = new ResizeObserver(update);
		observer.observe(node);
		const onResize = () => setViewportH(window.innerHeight);
		window.addEventListener("resize", onResize);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", onResize);
		};
	}, []);
	const maxHeight = Math.max(MIN_HEIGHT, Math.round(viewportH * .82));
	const fitted = (0, import_react.useMemo)(() => fitInto(vm, hostWidth || vm.width, maxHeight), [
		vm,
		hostWidth,
		maxHeight
	]);
	const filled = (0, import_react.useMemo)(() => {
		return {
			width: Math.max(MIN_WIDTH, hostWidth || vm.width),
			height: maxHeight
		};
	}, [
		hostWidth,
		maxHeight,
		vm.width
	]);
	const view = mode === "fill" ? filled : mode === "custom" && custom ? custom : fitted;
	const scale = Math.min(view.width / vm.width, view.height / vm.height);
	function applyCustom(next) {
		const size = {
			width: Math.min(Math.max(MIN_WIDTH, Math.round(next.width)), Math.max(MIN_WIDTH, hostWidth || next.width)),
			height: Math.min(Math.max(MIN_HEIGHT, Math.round(next.height)), maxHeight)
		};
		setCustom(size);
		setMode("custom");
		persistSize(size);
	}
	function fitMachine() {
		clearStoredSize();
		setCustom(null);
		setMode("fit");
	}
	function fillPage() {
		clearStoredSize();
		setMode("fill");
	}
	const onPointerMove = (0, import_react.useCallback)((event) => {
		const drag = dragRef.current;
		if (!drag) return;
		const deltaX = event.clientX - drag.startX;
		const deltaY = event.clientY - drag.startY;
		if (drag.kind === "height") applyCustom({
			width: drag.start.width,
			height: drag.start.height + deltaY
		});
		else applyCustom({
			width: drag.start.width + deltaX,
			height: drag.start.height + deltaY
		});
	}, [hostWidth, maxHeight]);
	const endDrag = (0, import_react.useCallback)(() => {
		dragRef.current = null;
		setDragging(false);
		window.removeEventListener("pointermove", onPointerMove);
		window.removeEventListener("pointerup", endDrag);
	}, [onPointerMove]);
	function startDrag(kind, event) {
		event.preventDefault();
		dragRef.current = {
			kind,
			startX: event.clientX,
			startY: event.clientY,
			start: view
		};
		setDragging(true);
		window.addEventListener("pointermove", onPointerMove);
		window.addEventListener("pointerup", endDrag);
	}
	(0, import_react.useEffect)(() => () => endDrag(), [endDrag]);
	function onResizeKey(event) {
		const step = event.shiftKey ? 48 : 16;
		if (event.key === "ArrowUp") {
			event.preventDefault();
			applyCustom({
				width: view.width,
				height: view.height - step
			});
		} else if (event.key === "ArrowDown") {
			event.preventDefault();
			applyCustom({
				width: view.width,
				height: view.height + step
			});
		} else if (event.key === "ArrowLeft") {
			event.preventDefault();
			applyCustom({
				width: view.width - step,
				height: view.height
			});
		} else if (event.key === "ArrowRight") {
			event.preventDefault();
			applyCustom({
				width: view.width + step,
				height: view.height
			});
		} else if (event.key === "Home") {
			event.preventDefault();
			fitMachine();
		}
	}
	function openTab() {
		if (!machine.previewUrl) return;
		window.open(machine.previewUrl, "_blank", "noopener,noreferrer");
	}
	const sizeKnown = Boolean(machine.displayWidth || shotSize);
	const viewingEntire = Math.abs(view.width / view.height - vm.width / vm.height) < .04;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "overflow-visible p-4 md:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-card font-semibold tracking-tight",
								children: "Computer Use"
							}),
							running ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "green",
								children: "Live desktop"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "neutral",
								children: "Idle"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "blue",
								children: formatDisplaySize(vm.width, vm.height)
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-caption text-muted",
						children: "Direct view of the Social Machine. Drag the handle to resize. Fit Machine matches the VM display so you see the entire desktop."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: running ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: onRefresh,
							disabled: refreshing,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `size-3.5 ${refreshing ? "motion-safe:animate-spin" : ""}` }), refreshing ? "Refreshing…" : "Reload desktop"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: mode === "fit" ? "secondary" : "ghost",
							onClick: fitMachine,
							disabled: !src,
							"aria-pressed": mode === "fit",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scaling, { className: "size-3.5" }), "Fit machine"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: mode === "fill" ? "secondary" : "ghost",
							onClick: fillPage,
							disabled: !src,
							"aria-pressed": mode === "fill",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "size-3.5" }), "Fill page"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => setImmersive(true),
							disabled: !src,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Expand, { className: "size-3.5" }), "Full desktop"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: openTab,
							disabled: !src,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" }), "New tab"]
						})
					] }) : null
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: hostRef,
				className: "mt-4",
				children: [
					running && src ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden md:block",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								ref: frameRef,
								className: "vm-bezel mx-auto",
								style: {
									width: view.width,
									height: view.height,
									maxWidth: "100%"
								},
								children: [immersive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid size-full place-items-center px-6 text-center text-caption text-muted",
									children: "Full desktop is open. Exit to return to this view."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DesktopFrame, {
									src,
									title: "Social Machine desktop"
								}), dragging ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "vm-drag-mask" }) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "vm-resize-row mx-auto",
								style: {
									width: view.width,
									maxWidth: "100%"
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "vm-resize-bar",
									role: "slider",
									"aria-label": "Resize Social Machine height",
									"aria-orientation": "vertical",
									"aria-valuemin": MIN_HEIGHT,
									"aria-valuemax": maxHeight,
									"aria-valuenow": view.height,
									"aria-valuetext": `${view.width} by ${view.height} pixels`,
									onPointerDown: (event) => startDrag("height", event),
									onKeyDown: onResizeKey,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "vm-resize-grip" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sr-only",
										children: "Drag to resize the desktop"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "vm-resize-corner",
									"aria-label": "Resize Social Machine width and height",
									onPointerDown: (event) => startDrag("both", event),
									onKeyDown: onResizeKey,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										className: "vm-resize-corner-mark"
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-center text-caption text-muted",
								children: [
									"Viewing ",
									formatDisplaySize(view.width, view.height),
									sizeKnown ? ` of a ${formatDisplaySize(vm.width, vm.height)} desktop` : "",
									viewingEntire ? " · entire machine visible" : " · scaled to fit",
									scale < .99 ? ` · ${Math.round(scale * 100)}%` : " · 1:1"
								]
							})
						]
					}) : running ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hidden text-caption text-muted md:block",
						children: "The desktop URL is being minted. Reload desktop if this stays blank."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "md:hidden",
						children: [machine.lastScreenshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: machine.lastScreenshot,
							alt: "Last Social Machine screenshot",
							className: "w-full rounded-control border border-border"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-caption text-muted",
							children: running ? "Open full desktop to use the machine on this phone, or rotate to a wider screen." : "Start the machine to capture a desktop screenshot."
						}), running && src ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "mt-3 w-full",
							onClick: () => setImmersive(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Expand, { className: "size-4" }), "Open full desktop"]
						}) : null]
					}),
					!running && machine.lastScreenshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: machine.lastScreenshot,
						alt: "Last Social Machine screenshot",
						className: "mt-1 hidden w-full rounded-control border border-border md:block"
					}) : null
				]
			}),
			immersive && src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImmersiveDesktop, {
				src,
				vm,
				refreshing,
				onClose: () => setImmersive(false),
				onReload: onRefresh,
				onOpenTab: openTab
			}) : null
		]
	});
}
function UploadForm({ clients, assets, sessions, publishers, machineState, configured, pending, onUpload, initialMediaAssetId, initialPlatforms }) {
	const [clientId, setClientId] = (0, import_react.useState)(clients[0]?.id ?? "");
	const [assetId, setAssetId] = (0, import_react.useState)(initialMediaAssetId ?? "");
	const [platforms, setPlatforms] = (0, import_react.useState)(initialPlatforms ?? []);
	const [caption, setCaption] = (0, import_react.useState)("");
	const [preferredRail, setPreferredRail] = (0, import_react.useState)("AUTO");
	const [mode, setMode] = (0, import_react.useState)("draft");
	const [ytTitle, setYtTitle] = (0, import_react.useState)("");
	const [ytDescription, setYtDescription] = (0, import_react.useState)("");
	const [ytTags, setYtTags] = (0, import_react.useState)("");
	const [ytPrivacy, setYtPrivacy] = (0, import_react.useState)("unlisted");
	const [ytMarkShorts, setYtMarkShorts] = (0, import_react.useState)(true);
	const running = machineState === "running";
	const publisherMap = publishers ?? emptyPublisherMap();
	const clientAssets = (0, import_react.useMemo)(() => assets.filter((row) => row.clientId === clientId), [assets, clientId]);
	const selected = clientAssets.find((row) => row.id === assetId) ?? null;
	function apiReady(platform) {
		return publisherMap[platform].eligible;
	}
	function platformEnabled(platform) {
		if (preferredRail === "API") return apiReady(platform);
		if (preferredRail === "BROWSER") return running;
		return apiReady(platform) || running;
	}
	const tiktokUnauditedPublish = mode === "publish" && platforms.includes("tiktok") && publisherMap.tiktok.eligible && publisherMap.tiktok.tiktok?.auditStatus !== "AUDITED";
	const igNeedsProfessional = platforms.includes("instagram") && preferredRail === "API" && !publisherMap.instagram.eligible;
	const canSubmit = Boolean(clientId) && platforms.length > 0 && !pending && platforms.every(platformEnabled) && (preferredRail === "API" ? platforms.every(apiReady) : preferredRail === "BROWSER" ? configured && running : platforms.some(apiReady) || configured && running);
	function toggle(platform) {
		if (!platformEnabled(platform)) return;
		setPlatforms((current) => current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]);
	}
	function submit() {
		if (!canSubmit) return;
		onUpload({
			clientId,
			assetId: assetId || void 0,
			mediaAssetId: selected?.kind === "library" ? assetId : void 0,
			platforms,
			caption: caption || selected?.caption || "",
			mediaUrl: selected?.mediaUrl ?? null,
			preferredRail,
			mode,
			youtube: platforms.includes("youtube") ? {
				title: ytTitle || void 0,
				description: ytDescription || void 0,
				tags: ytTags.split(",").map((row) => row.trim()).filter(Boolean).slice(0, 30),
				privacyStatus: mode === "draft" ? "private" : ytPrivacy,
				markShorts: ytMarkShorts
			} : void 0
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		className: "social-upload",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-card font-semibold tracking-tight",
				children: "1-click upload"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-caption text-muted",
				children: "Auto uses native APIs when a publisher is connected. Computer Use stays the fallback for login, CAPTCHA, personal Instagram, and unaudited TikTok public posts."
			}),
			!configured && !anyApiReady(publisherMap) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-caption text-muted",
				children: "Connect a publisher API in Settings, or connect Daytona for Computer Use."
			}) : preferredRail !== "API" && configured && !running && !platforms.some(apiReady) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-caption text-warning",
				children: "Start the Social Machine for Computer Use, or connect APIs to post without the VM."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "social-client",
						children: "Client"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: clientId || void 0,
						onValueChange: (value) => {
							setClientId(value);
							setAssetId("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							id: "social-client",
							"aria-label": "Client",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a client" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: clients.map((client) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: client.id,
							children: client.name
						}, client.id)) })]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "social-asset",
						children: "Asset"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: assetId || void 0,
						onValueChange: setAssetId,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							id: "social-asset",
							"aria-label": "Asset",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Library, pipeline, or thumbnail" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: clientAssets.map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: asset.id,
							children: asset.kind === "library" ? `Library · ${asset.label}` : asset.label
						}, asset.id)) })]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "social-rail",
						children: "Rail"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: preferredRail,
						onValueChange: (value) => {
							setPreferredRail(value);
							setPlatforms([]);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							id: "social-rail",
							"aria-label": "Preferred rail",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "AUTO",
								children: "Auto — API then Computer Use"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "API",
								children: "API only"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "BROWSER",
								children: "Computer Use only"
							})
						] })]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "social-mode",
						children: "Mode"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: mode,
						onValueChange: (value) => setMode(value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							id: "social-mode",
							"aria-label": "Upload mode",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "draft",
							children: "Draft / inbox"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "publish",
							children: "Publish"
						})] })]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
					className: "text-caption font-medium",
					children: "Platforms"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-2",
					children: SOCIAL_PLATFORMS.map((platform) => {
						const ready = sessions[platform] !== "not_logged_in";
						const selectedPlat = platforms.includes(platform);
						const api = apiReady(platform);
						const enabled = platformEnabled(platform);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							size: "sm",
							variant: selectedPlat ? "secondary" : "ghost",
							"aria-pressed": selectedPlat,
							disabled: !enabled,
							title: api ? `${PLATFORM_LABELS[platform]} — API ready` : enabled ? PLATFORM_LABELS[platform] : `${PLATFORM_LABELS[platform]} — connect API or start Computer Use`,
							onClick: () => toggle(platform),
							children: [PLATFORM_LABELS[platform], api ? " · API" : !ready ? " · needs login" : ""]
						}, platform);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "social-caption",
					children: "Caption"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					id: "social-caption",
					value: caption,
					placeholder: selected?.caption ?? "Optional caption — pre-filled from titles when possible",
					onChange: (event) => setCaption(event.target.value)
				})]
			}),
			tiktokUnauditedPublish ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 rounded-control bg-warning/10 px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-warning",
					children: "TikTok is not audited for public Direct Post. Publish would send a draft to inbox — not a public post."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					variant: "secondary",
					className: "mt-2",
					onClick: () => setMode("draft"),
					children: "Send to TikTok inbox (draft)"
				})]
			}) : null,
			igNeedsProfessional ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 rounded-control bg-warning/10 px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-warning",
					children: "API publish requires an Instagram Professional account. Connect one in Settings, or use Computer Use for personal logins."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					variant: "secondary",
					className: "mt-2",
					onClick: () => {
						setPreferredRail("BROWSER");
						setPlatforms([]);
					},
					children: "Use browser upload"
				})]
			}) : null,
			platforms.includes("youtube") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "yt-title",
							children: "YouTube title"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "yt-title",
							className: "min-h-11 rounded-control border border-border bg-secondary-surface px-3 text-body",
							value: ytTitle,
							maxLength: 100,
							placeholder: caption.split("\n")[0] || selected?.label || "Required by YouTube",
							onChange: (event) => setYtTitle(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "yt-desc",
							children: "YouTube description"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "yt-desc",
							value: ytDescription,
							placeholder: "Defaults to the caption. Drafts upload as private.",
							onChange: (event) => setYtDescription(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 md:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "yt-tags",
								children: "Tags (comma separated)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "yt-tags",
								className: "min-h-11 rounded-control border border-border bg-secondary-surface px-3 text-body",
								value: ytTags,
								placeholder: "agency, clip, shorts",
								onChange: (event) => setYtTags(event.target.value)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "yt-privacy",
								children: "Privacy"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: mode === "draft" ? "private" : ytPrivacy,
								onValueChange: (value) => setYtPrivacy(value),
								disabled: mode === "draft",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									id: "yt-privacy",
									"aria-label": "YouTube privacy",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "private",
										children: "Private"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "unlisted",
										children: "Unlisted"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "public",
										children: "Public"
									})
								] })]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2 text-body",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: ytMarkShorts,
							onChange: (event) => setYtMarkShorts(event.target.checked)
						}), "Add #Shorts when the clip is vertical and ≤ 3 minutes"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-caption text-muted",
						children: "Uploads go to the connected workspace YouTube channel. The 4-minute long-form ideation rule is not applied here."
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "social-upload-actions mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: submit,
					disabled: !canSubmit,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), pending ? "Uploading…" : `Upload · ${RAIL_LABELS[preferredRail]}`]
				})
			})
		]
	});
}
function anyApiReady(map) {
	return Object.values(map).some((row) => row.eligible);
}
function ActivityList({ posts, jobs, clientNames, onStatus, onResume, onCancel, busyJobId, performance }) {
	const waiting = (jobs ?? []).filter((job) => job.status === "awaiting_approval");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-card font-semibold tracking-tight",
			children: "Upload jobs"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-caption text-muted",
			children: "Per-platform results. Live publishes may wait for approval. API posts include a permalink when the platform returns one."
		}),
		waiting.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 flex flex-col gap-2",
			children: waiting.map((job) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-control border border-border bg-secondary-surface/40 px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-body font-medium",
						children: [
							clientNames.get(job.clientId) ?? "Client",
							" · ",
							job.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-caption text-muted",
						children: [
							"Waiting for approval · ",
							formatRelativeTime(job.createdAt),
							job.createdBy ? ` · ${shortActor(job.createdBy)}` : "",
							job.caption ? ` · ${job.caption.slice(0, 80)}` : ""
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: statusTone("AWAITING_APPROVAL"),
						children: jobStatusLabel(job.status)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/approvals",
							className: "inline-flex min-h-11 items-center text-caption text-accent underline-offset-2 hover:underline",
							children: "Review approval"
						}),
						onCancel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => onCancel(job.id),
							children: "Cancel"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinearIssueActions, {
							entityType: "SocialUploadJob",
							entityId: job.id,
							title: `[Social] Awaiting approval — ${clientNames.get(job.clientId) ?? "client"}`,
							description: job.caption ?? void 0,
							labels: ["social"],
							compact: true
						})
					]
				})]
			}, job.id))
		}) : null,
		posts.length === 0 && waiting.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-body text-muted",
			children: "No social posts yet. Queue a 1-click upload — API publishers work without the Social Machine."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 flex flex-col gap-2",
			children: posts.map((post) => {
				const percent = post.uploadPercent ?? 0;
				const showProgress = post.rail === "API" && (post.status === "running" || post.status === "queued");
				const canResume = Boolean(post.jobId) && Boolean(post.resumableSessionId) && post.rail === "API" && post.status === "failed";
				const canCancel = Boolean(post.jobId) && post.rail === "API" && (post.status === "running" || post.status === "queued");
				const busy = Boolean(post.jobId && busyJobId === post.jobId);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-control border border-border bg-secondary-surface/40 px-3 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-body font-medium",
									children: [
										clientNames.get(post.clientId) ?? "Client",
										" · ",
										PLATFORM_LABELS[post.platform]
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-caption text-muted",
									children: [
										formatRelativeTime(post.createdAt),
										` · ${RAIL_LABELS[post.rail ?? "BROWSER"]}`,
										post.tiktokPostMode ? ` · ${TIKTOK_MODE_LABELS[post.tiktokPostMode]}` : "",
										post.caption ? ` · ${post.caption.slice(0, 80)}` : ""
									]
								}),
								post.externalUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: post.externalUrl,
									target: "_blank",
									rel: "noreferrer",
									className: "mt-1 inline-block text-caption text-accent underline-offset-2 hover:underline",
									children: "Open post"
								}) : post.externalPostId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-caption text-muted",
									children: ["id ", post.externalPostId]
								}) : null,
								post.attentionReason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-caption text-warning",
									children: post.attentionReason
								}) : null,
								post.status === "succeeded" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PostSnapshots, {
									post,
									rows: (performance ?? []).filter((row) => row.socialPostId === post.id)
								}) : null
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: post.rail === "API" ? "teal" : "neutral",
										children: RAIL_LABELS[post.rail ?? "BROWSER"]
									}),
									post.tiktokPostMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "neutral",
										children: TIKTOK_MODE_LABELS[post.tiktokPostMode]
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: statusTone(post.status.toUpperCase()),
										children: postStatusLabel(post.status)
									})
								]
							})]
						}),
						showProgress ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-caption text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: uploadPhaseLabel(post.uploadPhase) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [percent, "%"] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 h-1.5 overflow-hidden rounded-full bg-secondary-surface",
								role: "progressbar",
								"aria-label": "Upload progress",
								"aria-valuemin": 0,
								"aria-valuemax": 100,
								"aria-valuenow": percent,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full bg-accent transition-[width] duration-300",
									style: { width: `${Math.min(100, Math.max(0, percent))}%` }
								})
							})]
						}) : null,
						post.screenshotUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: post.screenshotUrl,
							alt: "",
							className: "mt-2 max-h-40 w-full rounded-control object-cover object-top"
						}) : null,
						post.status === "needs_attention" || post.status === "running" || canResume || canCancel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [
								canCancel && onCancel && post.jobId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									disabled: busy,
									onClick: () => onCancel(post.jobId),
									children: "Cancel upload"
								}) : null,
								canResume && onResume && post.jobId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "secondary",
									disabled: busy,
									onClick: () => onResume(post.jobId),
									children: "Resume upload"
								}) : null,
								post.status === "needs_attention" || post.status === "running" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "secondary",
									onClick: () => onStatus(post.id, "succeeded"),
									children: "Mark published"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => onStatus(post.id, "failed"),
									children: "Mark failed"
								})] }) : null,
								post.jobId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinearIssueActions, {
									entityType: "SocialUploadJob",
									entityId: post.jobId,
									title: `[Social] ${post.status} — ${PLATFORM_LABELS[post.platform]} — ${clientNames.get(post.clientId) ?? "client"}`,
									description: post.attentionReason ?? void 0,
									labels: ["social"],
									compact: true
								}) : null
							]
						}) : post.status === "failed" || post.jobId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: post.jobId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinearIssueActions, {
								entityType: "SocialUploadJob",
								entityId: post.jobId,
								title: `[Social] ${post.status} — ${PLATFORM_LABELS[post.platform]} — ${clientNames.get(post.clientId) ?? "client"}`,
								description: post.attentionReason ?? void 0,
								labels: ["social", post.status === "failed" ? "bug" : "social"],
								compact: true
							}) : null
						}) : null
					]
				}, post.id);
			})
		})
	] });
}
function PostSnapshots({ rows, post }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	if (!rows.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-caption text-muted",
				children: "No stats yet — unknown, not zero."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				className: "mt-1",
				onClick: () => setOpen(true),
				children: "Enter stats"
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InlineManualMetrics, {
				post,
				onClose: () => setOpen(false)
			}) : null
		]
	});
	const ordered = [...rows].sort((a, b) => a.capturedAt < b.capturedAt ? 1 : -1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-1",
				children: ordered.slice(0, 4).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center gap-2 text-caption text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						WINDOW_LABELS[row.window],
						" · ",
						formatUnknownNumber(row.metrics.views, formatCompactCount),
						" views"
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreBadge, {
						score: row.score,
						verdict: row.verdict
					})]
				}, row.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				className: "mt-1",
				onClick: () => setOpen(true),
				children: "Enter stats"
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InlineManualMetrics, {
				post,
				onClose: () => setOpen(false)
			}) : null
		]
	});
}
function InlineManualMetrics({ post, onClose }) {
	const queryClient = useQueryClient();
	const [views, setViews] = (0, import_react.useState)("");
	const [likes, setLikes] = (0, import_react.useState)("");
	const [comments, setComments] = (0, import_react.useState)("");
	const save = useMutation({
		mutationFn: () => recordManualMetricsFn({ data: {
			socialPostId: post.id,
			clientId: post.clientId,
			platform: socialPlatformToPerformance(post.platform),
			externalPostId: post.externalPostId || post.id,
			externalUrl: post.externalUrl,
			mediaAssetId: post.contentRef,
			window: "LIFETIME",
			metrics: {
				views: parseOptional(views),
				likes: parseOptional(likes),
				comments: parseOptional(comments)
			}
		} }),
		onSuccess: async () => {
			toast.success("Manual snapshot saved");
			await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: PERFORMANCE_QUERY_KEY });
			onClose();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-2 grid gap-2 sm:grid-cols-3",
		onSubmit: (event) => {
			event.preventDefault();
			save.mutate();
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				id: `ps-views-${post.id}`,
				label: "Views",
				value: views,
				onChange: setViews
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				id: `ps-likes-${post.id}`,
				label: "Likes",
				value: likes,
				onChange: setLikes
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				id: `ps-comments-${post.id}`,
				label: "Comments",
				value: comments,
				onChange: setComments
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sm:col-span-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "sm",
					disabled: save.isPending,
					children: save.isPending ? "Saving…" : "Save snapshot"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					variant: "ghost",
					onClick: onClose,
					children: "Cancel"
				})]
			})
		]
	});
}
function Field({ id, label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: id,
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			id,
			inputMode: "numeric",
			value,
			onChange: (event) => onChange(event.target.value),
			placeholder: "unknown"
		})]
	});
}
function parseOptional(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const n = Number(trimmed);
	return Number.isFinite(n) && n >= 0 ? n : null;
}
function SocialPage() {
	const queryClient = useQueryClient();
	const search = useRouterState({ select: (s) => s.location.search });
	const mediaAssetId = typeof search.mediaAssetId === "string" ? search.mediaAssetId : void 0;
	const initialPlatforms = (0, import_react.useMemo)(() => {
		const raw = search.platform ?? search.platforms;
		return (Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : []).filter((item) => SOCIAL_PLATFORMS.includes(item));
	}, [search.platform, search.platforms]);
	const [uploadOpen, setUploadOpen] = (0, import_react.useState)(Boolean(mediaAssetId));
	const query = useQuery({
		queryKey: SOCIAL_QUERY_KEY,
		queryFn: () => getSocialSnapshot(),
		refetchInterval: (current) => {
			const state = current.state.data?.machine.state;
			const busy = current.state.data?.posts.some((post) => post.status === "running" || post.status === "queued");
			if (state === "starting" || state === "stopping" || busy) return 4e3;
			if (state === "running") return 2e4;
			return false;
		}
	});
	const start = useMutation({
		mutationFn: () => startSocialDesktop(),
		onSuccess: async (data) => {
			queryClient.setQueryData(SOCIAL_QUERY_KEY, data);
			toast.success("Social Machine started");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const stop = useMutation({
		mutationFn: () => stopSocialDesktop(),
		onSuccess: async (data) => {
			queryClient.setQueryData(SOCIAL_QUERY_KEY, data);
			toast.success("Social Machine hibernated — resume picks up the same Windows session");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const refresh = useMutation({
		mutationFn: () => refreshSocialDesktop(),
		onSuccess: (data) => queryClient.setQueryData(SOCIAL_QUERY_KEY, data),
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const open = useMutation({
		mutationFn: (platform) => openSocialPlatform({ data: { platform } }),
		onSuccess: () => toast.success("Opened in the Social Machine"),
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const mark = useMutation({
		mutationFn: (input) => markPlatformSession({ data: input }),
		onSuccess: (data) => queryClient.setQueryData(SOCIAL_QUERY_KEY, data),
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const upload = useMutation({
		mutationFn: (input) => queueSocialUpload({ data: input }),
		onSuccess: (data) => {
			queryClient.setQueryData(SOCIAL_QUERY_KEY, data);
			setUploadOpen(false);
			const waiting = data.jobs.some((job) => job.status === "awaiting_approval");
			toast.message(waiting ? "Waiting for approval before this goes live." : "Upload queued — API posts publish now; Computer Use waits in the desktop.");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const status = useMutation({
		mutationFn: (input) => updateSocialPostStatus({ data: input }),
		onSuccess: (data) => queryClient.setQueryData(SOCIAL_QUERY_KEY, data),
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const retry = useMutation({
		mutationFn: (jobId) => retrySocialUpload({ data: { jobId } }),
		onSuccess: (data) => {
			queryClient.setQueryData(SOCIAL_QUERY_KEY, data);
			toast.success("Resuming upload from the last chunk");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const cancel = useMutation({
		mutationFn: (jobId) => cancelSocialUpload({ data: { jobId } }),
		onSuccess: (data) => {
			queryClient.setQueryData(SOCIAL_QUERY_KEY, data);
			toast.message("Upload cancelled");
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const names = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const client of query.data?.clients ?? []) map.set(client.id, client.name);
		return map;
	}, [query.data?.clients]);
	if (query.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex max-w-[100rem] flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Social",
				description: "On-demand posting to Instagram, X, and TikTok. Native APIs when connected; the machine stays off until you start it."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 w-full rounded-card" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 rounded-card" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 rounded-card" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 rounded-card" })
				]
			})
		]
	});
	if (query.isError || !query.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[100rem]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, { title: "Social" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			className: "mt-6",
			title: "Couldn’t load Social",
			description: "Status couldn’t be read. Try again.",
			onRetry: () => void query.refetch()
		})]
	});
	const snapshot = query.data;
	const opening = open.isPending ? open.variables ?? null : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-[100rem] flex-col gap-4 pb-24 md:pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Social",
				description: "On-demand posting to Instagram, X, and TikTok. Native APIs when connected; the machine stays off until you start it."
			}),
			!snapshot.machine.configured ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIFallbackPanel, {
				integration: "daytona",
				title: "Connect Daytona for Computer Use — or connect publisher APIs in Settings to post without the machine"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MachineBar, {
				machine: snapshot.machine,
				onStart: () => start.mutate(),
				onStop: () => stop.mutate(),
				starting: start.isPending,
				stopping: stop.isPending
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DesktopSurface, {
				machine: snapshot.machine,
				onRefresh: () => refresh.mutate(),
				refreshing: refresh.isPending
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlatformCards, {
				sessions: snapshot.sessions,
				publishers: snapshot.publishers,
				machineState: snapshot.machine.state,
				configured: snapshot.machine.configured,
				onOpen: (platform) => open.mutate(platform),
				onMark: (platform, state) => mark.mutate({
					platform,
					state
				}),
				opening
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden md:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UploadForm, {
					clients: snapshot.clients,
					assets: snapshot.assets,
					sessions: snapshot.sessions,
					publishers: snapshot.publishers,
					machineState: snapshot.machine.state,
					configured: snapshot.machine.configured,
					pending: upload.isPending,
					initialMediaAssetId: mediaAssetId,
					initialPlatforms,
					onUpload: (input) => upload.mutate(input)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityList, {
				posts: snapshot.posts,
				jobs: snapshot.jobs,
				clientNames: names,
				onStatus: (id, next) => status.mutate({
					id,
					status: next
				}),
				onResume: (jobId) => retry.mutate(jobId),
				onCancel: (jobId) => cancel.mutate(jobId),
				busyJobId: retry.isPending ? retry.variables ?? null : cancel.isPending ? cancel.variables ?? null : null,
				performance: snapshot.performance ?? []
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-x-0 bottom-0 z-20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "w-full",
					onClick: () => setUploadOpen(true),
					"aria-label": "Open 1-click upload",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
						className: "size-4",
						"aria-hidden": "true"
					}), "1-click upload"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: uploadOpen,
				onOpenChange: setUploadOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "bottom",
					className: "md:hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "1-click upload" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, { children: "Queue Instagram, X, or TikTok without using the desktop stream." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UploadForm, {
								clients: snapshot.clients,
								assets: snapshot.assets,
								sessions: snapshot.sessions,
								publishers: snapshot.publishers,
								machineState: snapshot.machine.state,
								configured: snapshot.machine.configured,
								pending: upload.isPending,
								initialMediaAssetId: mediaAssetId,
								onUpload: (input) => upload.mutate(input)
							})
						})
					]
				})
			})
		]
	});
}
//#endregion
export { SocialPage as component };
