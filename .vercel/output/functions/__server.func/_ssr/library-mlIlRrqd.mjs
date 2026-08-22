import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { r as getBearerToken } from "./client-C4IS_tWT.mjs";
import { r as formatCompactCount } from "./format-DaT2NYM9.mjs";
import { b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { C as parseTimecode, S as formatTimecode, _ as SOURCE_LABELS, b as formatBytes, d as LIBRARY_QUERY_KEY, f as PRESET_LABELS, l as KIND_LABELS, m as RENDER_PRESETS, n as ASSET_SOURCES, r as ASSET_STATUSES, t as ASSET_KINDS, x as formatDurationSec } from "./library-D-Mt5rXw.mjs";
import { d as Upload, rt as Image, st as Film, vt as Clapperboard } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as GlassCard, O as cn, m as userFacingErrorMessage, w as Button } from "./router-DRtNPEcw.mjs";
import { t as Skeleton } from "./skeleton-8ICuXo8q.mjs";
import { n as Textarea, t as Input } from "./input-Do4nFtvO.mjs";
import { t as Label } from "./label-Ch6fQtTg.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetDescription, t as Sheet } from "./sheet-J1oGBwS0.mjs";
import { n as statusTone, t as Badge } from "./badge-CDaEWAH4.mjs";
import { i as downloadTextFile } from "./clipboard-Yt4ExP0v.mjs";
import { t as ErrorState } from "./error-state-Dh4ZTwe_.mjs";
import { t as PageHeader } from "./page-header-D39h3ew5.mjs";
import { t as EmptyState } from "./empty-state-CAAmbL80.mjs";
import { t as LinearIssueActions } from "./issue-actions-LfCDQlgU.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Cb8e3ND-.mjs";
import { b as formatEngagementPct, g as WINDOW_LABELS, r as KNOWLEDGE_PROPOSALS_KEY, u as PLATFORM_LABELS, x as formatUnknownNumber } from "./performance-Cj9pmeSi.mjs";
import { t as ScoreBadge } from "./score-badge-IJk18-LU.mjs";
import { a as proposeKnowledgeFromAssetFn } from "./performance-fns-BnwGGujQ.mjs";
import { S as uploadSrtFn, a as generateCaptionsFn, b as tagAssetsFn, f as listClientClipsFn, g as saveCuesFn, h as retryRenderFn, i as exportCaptionsFn, l as ingestLibraryUrlFn, m as queueRenderFn, n as bulkQueueRenderFn, o as getLibraryAssetFn, r as cancelRenderFn, s as getLibrarySnapshot, t as archiveAssetFn, u as ingestStreamClipFn } from "./library-fns-D3lY4Qo9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/library-mlIlRrqd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function UploadDropzone({ clientId, maxUploadMb, disabled, onUploaded, onError }) {
	const inputRef = (0, import_react.useRef)(null);
	const [hover, setHover] = (0, import_react.useState)(false);
	const [pending, setPending] = (0, import_react.useState)(false);
	async function send(file) {
		if (disabled || pending) return;
		if (file.size > maxUploadMb * 1024 * 1024) {
			onError(`That file is larger than the ${maxUploadMb} MB upload limit.`);
			return;
		}
		setPending(true);
		try {
			const body = new FormData();
			body.append("file", file);
			if (clientId) body.append("clientId", clientId);
			body.append("title", file.name.replace(/\.[^.]+$/, ""));
			const headers = new Headers();
			const token = getBearerToken();
			if (token) headers.set("Authorization", `Bearer ${token}`);
			const response = await fetch("/api/library/upload", {
				method: "POST",
				body,
				headers
			});
			const json = await response.json();
			if (!response.ok || !json.asset) {
				onError(json.error === "MEDIA_TOO_LARGE" ? "That file is too large." : "Couldn’t ingest that file.");
				return;
			}
			onUploaded(json.asset.id, Boolean(json.duplicate));
		} catch {
			onError("Couldn’t ingest that file.");
		} finally {
			setPending(false);
		}
	}
	function onDrop(event) {
		event.preventDefault();
		setHover(false);
		const file = event.dataTransfer.files[0];
		if (file) send(file);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		onDragOver: (event) => {
			event.preventDefault();
			setHover(true);
		},
		onDragLeave: () => setHover(false),
		onDrop,
		className: cn("flex flex-col items-start gap-3 rounded-card border border-dashed border-border bg-secondary-surface/40 p-5", hover && "border-accent bg-accent/5"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center rounded-control bg-secondary-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
						className: "size-5",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-card font-semibold tracking-tight",
					children: "Drop a clip or image"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-caption text-muted",
					children: [
						"MP4, MOV, PNG, JPG up to ",
						maxUploadMb,
						" MB. Probe + checksum run after ingest."
					]
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: inputRef,
				type: "file",
				accept: "video/*,image/*,.srt,.vtt,audio/*",
				className: "sr-only",
				onChange: (event) => {
					const file = event.target.files?.[0];
					if (file) send(file);
					event.currentTarget.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "secondary",
				disabled: disabled || pending,
				onClick: () => inputRef.current?.click(),
				children: pending ? "Uploading…" : "Choose file"
			})
		]
	});
}
function AssetCard({ asset, selected, onOpen, onToggle, rollup }) {
	const visual = asset.kind === "IMAGE" || asset.kind === "VIDEO";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
		interactive: true,
		className: cn("flex flex-col overflow-hidden p-0", selected && "ring-2 ring-accent"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onOpen,
			className: "relative aspect-video w-full overflow-hidden bg-secondary-surface",
			"aria-label": `Open ${asset.title}`,
			children: [visual && asset.previewUrl ? asset.kind === "IMAGE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
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
				children: asset.kind === "IMAGE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
					className: "size-8",
					"aria-hidden": "true"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, {
					className: "size-8",
					"aria-hidden": "true"
				})
			}), asset.durationSec ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute right-2 bottom-2 rounded-full bg-bg/80 px-2 py-0.5 text-caption text-fg",
				children: formatDurationSec(asset.durationSec)
			}) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-2 p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onOpen,
						className: "min-w-0 text-left text-body font-medium tracking-tight",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "line-clamp-2",
							children: asset.title
						})
					}), onToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: selected,
						onChange: onToggle,
						"aria-label": `Select ${asset.title}`,
						className: "mt-1 size-4"
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: statusTone(asset.status),
							children: asset.status
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "neutral",
							children: SOURCE_LABELS[asset.source]
						}),
						asset.aspectRatio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "blue",
							children: asset.aspectRatio
						}) : null,
						rollup ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreBadge, {
							score: rollup.score,
							verdict: rollup.winnerCount > 0 ? "WINNER" : null
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-caption text-muted",
					children: [
						asset.kind.toLowerCase(),
						formatBytes(asset.byteSize),
						rollup?.viewsTotal != null ? `${formatUnknownNumber(rollup.viewsTotal, formatCompactCount)} views` : null
					].filter(Boolean).join(" · ")
				})
			]
		})]
	});
}
function CaptionEditor({ track, pending, onSave, onDownload }) {
	const [cues, setCues] = (0, import_react.useState)(track.cues);
	(0, import_react.useEffect)(() => {
		setCues(track.cues);
	}, [track.id, track.updatedAt]);
	function update(index, patch) {
		setCues((current) => current.map((cue, i) => i === index ? {
			...cue,
			...patch
		} : cue));
	}
	function commitTime(index, field, raw) {
		const ms = parseTimecode(raw);
		if (ms == null) return;
		update(index, { [field]: ms });
	}
	function split(index) {
		setCues((current) => {
			const cue = current[index];
			if (!cue) return current;
			const mid = Math.round((cue.startMs + cue.endMs) / 2);
			const words = cue.text.split(" ");
			const half = Math.max(1, Math.floor(words.length / 2));
			const left = {
				...cue,
				endMs: mid,
				text: words.slice(0, half).join(" ")
			};
			const right = {
				startMs: mid,
				endMs: cue.endMs,
				text: words.slice(half).join(" ") || cue.text
			};
			return [
				...current.slice(0, index),
				left,
				right,
				...current.slice(index + 1)
			];
		});
	}
	function merge(index) {
		setCues((current) => {
			if (index >= current.length - 1) return current;
			const a = current[index];
			const b = current[index + 1];
			const merged = {
				startMs: a.startMs,
				endMs: b.endMs,
				text: `${a.text} ${b.text}`.trim()
			};
			return [
				...current.slice(0, index),
				merged,
				...current.slice(index + 2)
			];
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					disabled: pending,
					onClick: () => onSave(cues),
					children: "Save cues"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					variant: "secondary",
					onClick: () => onDownload("SRT"),
					children: "Download SRT"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					variant: "secondary",
					onClick: () => onDownload("VTT"),
					children: "Download VTT"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "flex max-h-80 flex-col gap-2 overflow-y-auto",
			children: cues.map((cue, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CueRow, {
				cue,
				index,
				onText: (text) => update(index, { text }),
				onTime: commitTime,
				onSplit: () => split(index),
				onMerge: () => merge(index)
			}, `${track.id}-${index}-${cue.startMs}`))
		})]
	});
}
function CueRow({ cue, index, onText, onTime, onSplit, onMerge }) {
	const [start, setStart] = (0, import_react.useState)(formatTimecode(cue.startMs));
	const [end, setEnd] = (0, import_react.useState)(formatTimecode(cue.endMs));
	(0, import_react.useEffect)(() => {
		setStart(formatTimecode(cue.startMs));
		setEnd(formatTimecode(cue.endMs));
	}, [cue.startMs, cue.endMs]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "rounded-control bg-secondary-surface p-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					"aria-label": "Start",
					className: "w-24",
					value: start,
					onChange: (event) => setStart(event.target.value),
					onBlur: () => onTime(index, "startMs", start)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-caption text-muted",
					children: "→"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					"aria-label": "End",
					className: "w-24",
					value: end,
					onChange: (event) => setEnd(event.target.value),
					onBlur: () => onTime(index, "endMs", end)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					variant: "ghost",
					onClick: onSplit,
					children: "Split"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					variant: "ghost",
					onClick: onMerge,
					children: "Merge"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
			className: "mt-2",
			value: cue.text,
			onChange: (event) => onText(event.target.value),
			rows: 2
		})]
	});
}
function AssetDrawer({ detail, open, settings, pending, onOpenChange, onGenerateCaptions, onSaveCues, onUploadSrt, onDownloadCaptions, onQueueRender, onSendSocial, onPublishYoutube, onArchive, onProposeKnowledge, canDelete }) {
	const asset = detail?.asset ?? null;
	const readyCaption = detail?.captions.find((row) => row.status === "READY") ?? null;
	const [preset, setPreset] = (0, import_react.useState)(settings.defaultPreset);
	const [burnIn, setBurnIn] = (0, import_react.useState)(false);
	const media = (0, import_react.useMemo)(() => {
		if (!asset?.previewUrl) return null;
		if (asset.kind === "IMAGE") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: asset.previewUrl,
			alt: "",
			className: "w-full rounded-control"
		});
		if (asset.kind === "VIDEO") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
			src: asset.previewUrl,
			controls: true,
			playsInline: true,
			className: "w-full rounded-control"
		});
		return null;
	}, [asset]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
			side: "right",
			className: "w-[min(100%,36rem)]",
			children: asset ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: asset.title }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetDescription, { children: [
					SOURCE_LABELS[asset.source],
					" · ",
					asset.kind.toLowerCase(),
					asset.durationSec ? ` · ${formatDurationSec(asset.durationSec)}` : ""
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: statusTone(asset.status),
							children: asset.status
						}),
						asset.aspectRatio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "blue",
							children: asset.aspectRatio
						}) : null,
						asset.tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "neutral",
							children: tag
						}, tag))
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: media
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-caption text-muted",
					children: [formatBytes(asset.byteSize), asset.mimeType].filter(Boolean).join(" · ")
				}),
				detail?.performance || detail?.snapshots && detail.snapshots.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-card font-semibold tracking-tight",
							children: "Performance"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreBadge, {
								score: detail.performance?.score ?? null,
								verdict: detail.performance && detail.performance.winnerCount > 0 ? "WINNER" : null
							}), detail.performance?.viewsTotal != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-caption text-muted",
								children: [
									formatUnknownNumber(detail.performance.viewsTotal, formatCompactCount),
									" views",
									detail.performance.engagementRate != null ? ` · ${formatEngagementPct(detail.performance.engagementRate)} engagement` : ""
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-caption text-muted",
								children: "No stats yet — unknown, not zero."
							})]
						}),
						detail.snapshots && detail.snapshots.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 flex flex-col gap-1",
							children: detail.snapshots.slice(0, 6).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "text-caption text-muted",
								children: [
									PLATFORM_LABELS[row.platform],
									" · ",
									WINDOW_LABELS[row.window],
									" ·",
									" ",
									formatUnknownNumber(row.metrics.views, formatCompactCount),
									" views",
									row.externalUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" · ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: row.externalUrl,
										target: "_blank",
										rel: "noreferrer",
										className: "text-accent underline-offset-2 hover:underline",
										children: "post"
									})] }) : null
								]
							}, row.id))
						}) : null,
						onProposeKnowledge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							variant: "secondary",
							className: "mt-3",
							disabled: pending || !detail.snapshots?.length,
							onClick: onProposeKnowledge,
							children: "Propose knowledge from this"
						}) : null
					]
				}) : onProposeKnowledge ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-card font-semibold tracking-tight",
						children: "Performance"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-caption text-muted",
						children: "No published stats on this asset yet. After a social post succeeds, refresh stats on Analytics or enter them manually."
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-card font-semibold tracking-tight",
							children: "Captions"
						}),
						(asset.kind === "VIDEO" || asset.kind === "AUDIO") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								disabled: pending || !settings.transcriptionConfigured,
								onClick: onGenerateCaptions,
								children: readyCaption ? "Re-transcribe" : "Generate captions"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "inline-flex min-h-10 cursor-pointer items-center rounded-button bg-secondary-surface px-3 text-caption",
								children: ["Upload SRT", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									accept: ".srt,.vtt,text/plain",
									className: "sr-only",
									onChange: async (event) => {
										const file = event.target.files?.[0];
										if (!file) return;
										onUploadSrt(await file.text());
										event.currentTarget.value = "";
									}
								})]
							})]
						}),
						!settings.transcriptionConfigured ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-caption text-muted",
							children: settings.transcriptionHint
						}) : null,
						detail?.captions.filter((row) => row.status !== "READY").map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-caption text-muted",
							children: row.status === "TRANSCRIBING" ? "Transcribing…" : row.error || row.status
						}, row.id)),
						readyCaption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaptionEditor, {
								track: readyCaption,
								pending,
								onSave: (cues) => onSaveCues(readyCaption.id, cues),
								onDownload: (format) => onDownloadCaptions(readyCaption.id, format)
							})
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-card font-semibold tracking-tight",
							children: "Queue render"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "preset",
									children: "Preset"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: preset,
									onValueChange: (value) => setPreset(value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										id: "preset",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: RENDER_PRESETS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: item,
										children: PRESET_LABELS[item]
									}, item)) })]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-6 flex items-center gap-2 text-body",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: burnIn,
									onChange: (event) => setBurnIn(event.target.checked)
								}), "Burn in captions"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							className: "mt-3",
							disabled: pending || asset.kind === "SUBTITLE",
							onClick: () => onQueueRender(preset, burnIn, burnIn ? readyCaption?.id ?? null : null),
							children: ["Queue ", PRESET_LABELS[preset]]
						})
					]
				}),
				detail && detail.derived.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-card font-semibold tracking-tight",
						children: "Derived renders"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 flex flex-col gap-1",
						children: detail.derived.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-caption text-muted",
							children: [
								row.title,
								" · ",
								row.status,
								row.aspectRatio ? ` · ${row.aspectRatio}` : ""
							]
						}, row.id))
					})]
				}) : null,
				detail && detail.versions.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-card font-semibold tracking-tight",
						children: "Versions"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 flex flex-col gap-1",
						children: detail.versions.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-caption text-muted",
							children: [
								"v",
								row.versionNumber,
								row.note ? ` · ${row.note}` : "",
								" · ",
								formatBytes(row.byteSize)
							]
						}, row.id))
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							onClick: onSendSocial,
							children: "Send to Social"
						}),
						onPublishYoutube && asset.kind === "VIDEO" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "secondary",
							onClick: onPublishYoutube,
							children: "Publish to YouTube"
						}) : null,
						canDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "destructive",
							onClick: onArchive,
							children: "Archive"
						}) : null
					]
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-body text-muted",
				children: "Select an asset."
			})
		})
	});
}
function RenderQueue({ jobs, onCancel, onRetry, onOpenOutput }) {
	if (jobs.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		title: "No renders yet",
		description: "Queue a 9:16, 1:1, or 16:9 export from an asset. Optional burned captions ride along."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-3",
		children: jobs.map((job) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GlassCard, {
			className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-body font-medium tracking-tight",
						children: [
							job.sourceTitle ?? "Asset",
							" · ",
							PRESET_LABELS[job.preset]
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: statusTone(job.status),
								children: job.status
							}),
							job.options.burnInCaptions ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "blue",
								children: "Captions"
							}) : null,
							job.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-caption text-danger",
								children: job.error
							}) : null
						]
					}),
					(job.status === "QUEUED" || job.status === "RUNNING") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-secondary-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full bg-accent transition-[width]",
							style: { width: `${job.progressPercent}%` }
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					job.outputAssetId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "sm",
						variant: "secondary",
						onClick: () => onOpenOutput(job.outputAssetId),
						children: "Open output"
					}) : null,
					job.status === "FAILED" && onRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "sm",
						variant: "secondary",
						onClick: () => onRetry(job.id),
						children: "Retry"
					}) : null,
					job.status === "QUEUED" || job.status === "RUNNING" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "sm",
						variant: "ghost",
						onClick: () => onCancel(job.id),
						children: "Cancel"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinearIssueActions, {
						entityType: "RenderJob",
						entityId: job.id,
						title: `[Render] ${job.status} — ${PRESET_LABELS[job.preset]}`,
						description: job.error ?? job.sourceTitle ?? void 0,
						labels: ["media", job.status === "FAILED" ? "bug" : "media"],
						compact: true
					})
				]
			})]
		}, job.id))
	});
}
function LibraryPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [tab, setTab] = (0, import_react.useState)("library");
	const [clientId, setClientId] = (0, import_react.useState)("all");
	const [kind, setKind] = (0, import_react.useState)("all");
	const [source, setSource] = (0, import_react.useState)("all");
	const [status, setStatus] = (0, import_react.useState)("all");
	const [dateRange, setDateRange] = (0, import_react.useState)("all");
	const [search, setSearch] = (0, import_react.useState)("");
	const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const [importUrl, setImportUrl] = (0, import_react.useState)("");
	const snapshot = useQuery({
		queryKey: LIBRARY_QUERY_KEY,
		queryFn: () => getLibrarySnapshot(),
		refetchInterval: (current) => {
			const busy = current.state.data?.renders.some((row) => row.status === "QUEUED" || row.status === "RUNNING");
			const transcribing = current.state.data?.assets.some((row) => row.status === "PROCESSING");
			if (busy || transcribing) return 3e3;
			return 2e4;
		}
	});
	const detail = useQuery({
		queryKey: ["library-asset", openId],
		queryFn: () => getLibraryAssetFn({ data: { id: openId } }),
		enabled: Boolean(openId),
		refetchInterval: (current) => {
			const captions = current.state.data?.captions.some((row) => row.status === "TRANSCRIBING" || row.status === "PENDING");
			const renders = current.state.data?.renders.some((row) => row.status === "QUEUED" || row.status === "RUNNING");
			return captions || renders ? 2500 : false;
		}
	});
	const clips = useQuery({
		queryKey: ["library-clips", clientId],
		queryFn: () => listClientClipsFn({ data: { clientId } }),
		enabled: clientId !== "all"
	});
	const assets = (0, import_react.useMemo)(() => {
		const rows = snapshot.data?.assets ?? [];
		const cutoff = dateRange === "7d" ? Date.now() - 6048e5 : dateRange === "30d" ? Date.now() - 2592e6 : 0;
		return rows.filter((row) => {
			if (clientId !== "all" && row.clientId !== clientId) return false;
			if (kind !== "all" && row.kind !== kind) return false;
			if (source !== "all" && row.source !== source) return false;
			if (status !== "all") {
				if (row.status !== status) return false;
			} else if (row.status === "ARCHIVED") return false;
			if (cutoff && new Date(row.createdAt).getTime() < cutoff) return false;
			if (search) {
				const q = search.toLowerCase();
				if (!`${row.title} ${row.tags.join(" ")}`.toLowerCase().includes(q)) return false;
			}
			return true;
		});
	}, [
		snapshot.data?.assets,
		clientId,
		kind,
		source,
		status,
		dateRange,
		search
	]);
	function refresh() {
		queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
		if (openId) queryClient.invalidateQueries({ queryKey: ["library-asset", openId] });
	}
	const urlImport = useMutation({
		mutationFn: () => ingestLibraryUrlFn({ data: {
			clientId: clientId === "all" ? null : clientId,
			url: importUrl
		} }),
		onSuccess: (result) => {
			toast.success(result.duplicate ? "Already in the library" : "Imported");
			setImportUrl("");
			refresh();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const generate = useMutation({
		mutationFn: (assetId) => generateCaptionsFn({ data: { assetId } }),
		onSuccess: () => {
			toast.message("Transcribing…");
			refresh();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const saveCues = useMutation({
		mutationFn: (input) => saveCuesFn({ data: input }),
		onSuccess: () => {
			toast.success("Captions saved");
			refresh();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const srt = useMutation({
		mutationFn: (input) => uploadSrtFn({ data: input }),
		onSuccess: () => {
			toast.success("SRT imported");
			refresh();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const renderMut = useMutation({
		mutationFn: (input) => queueRenderFn({ data: input }),
		onSuccess: () => {
			toast.success("Render queued");
			setTab("renders");
			refresh();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const bulkRender = useMutation({
		mutationFn: (preset) => bulkQueueRenderFn({ data: {
			assetIds: [...selected],
			preset
		} }),
		onSuccess: () => {
			toast.success("Renders queued");
			setSelected(/* @__PURE__ */ new Set());
			setTab("renders");
			refresh();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const cancel = useMutation({
		mutationFn: (jobId) => cancelRenderFn({ data: { jobId } }),
		onSuccess: () => {
			toast.message("Render canceled");
			refresh();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const retry = useMutation({
		mutationFn: (jobId) => retryRenderFn({ data: { jobId } }),
		onSuccess: () => {
			toast.success("Render re-queued");
			refresh();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const archive = useMutation({
		mutationFn: (assetId) => archiveAssetFn({ data: { assetId } }),
		onSuccess: () => {
			toast.success("Archived");
			setOpenId(null);
			refresh();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const propose = useMutation({
		mutationFn: (assetId) => proposeKnowledgeFromAssetFn({ data: { assetId } }),
		onSuccess: async () => {
			toast.success("Drafted a learning proposal — approve it in Settings → AI Training");
			await queryClient.invalidateQueries({ queryKey: KNOWLEDGE_PROPOSALS_KEY });
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const tag = useMutation({
		mutationFn: (tagName) => tagAssetsFn({ data: {
			assetIds: [...selected],
			tag: tagName
		} }),
		onSuccess: () => {
			toast.success("Tagged");
			setSelected(/* @__PURE__ */ new Set());
			refresh();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	const clipIngest = useMutation({
		mutationFn: (clipId) => ingestStreamClipFn({ data: { clipId } }),
		onSuccess: () => {
			toast.success("Saved to Library");
			refresh();
		},
		onError: (error) => toast.error(userFacingErrorMessage(error))
	});
	if (snapshot.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Library",
			description: "Media, captions, and platform renders."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-56 rounded-card" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-56 rounded-card" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-56 rounded-card" })
			]
		})]
	});
	if (snapshot.isError || !snapshot.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, { title: "Library" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			className: "mt-8",
			title: "Couldn’t load the library",
			description: "Retry in a moment.",
			onRetry: () => void snapshot.refetch()
		})]
	});
	const data = snapshot.data;
	const pending = generate.isPending || renderMut.isPending || saveCues.isPending || srt.isPending || archive.isPending || propose.isPending;
	function toggle(id) {
		setSelected((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "Library",
				description: "One place for clips, thumbs, captions, and platform-ready renders. Social jobs can publish from a library id.",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: tab === "library" ? "primary" : "secondary",
						onClick: () => setTab("library"),
						children: "Assets"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: tab === "renders" ? "primary" : "secondary",
						onClick: () => setTab("renders"),
						children: "Renders"
					})]
				})
			}),
			tab === "library" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "lib-client",
								children: "Client"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: clientId,
								onValueChange: setClientId,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									id: "lib-client",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All clients" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "all",
									children: "All clients"
								}), data.clients.map((client) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: client.id,
									children: client.name
								}, client.id))] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "lib-kind",
								children: "Kind"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: kind,
								onValueChange: setKind,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									id: "lib-kind",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "all",
									children: "All kinds"
								}), ASSET_KINDS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: item,
									children: KIND_LABELS[item]
								}, item))] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "lib-source",
								children: "Source"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: source,
								onValueChange: setSource,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									id: "lib-source",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "all",
									children: "All sources"
								}), ASSET_SOURCES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: item,
									children: SOURCE_LABELS[item]
								}, item))] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "lib-search",
								children: "Search"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "lib-search",
								value: search,
								onChange: (event) => setSearch(event.target.value),
								placeholder: "Title or tag"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "lib-status",
								children: "Status"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: status,
								onValueChange: setStatus,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									id: "lib-status",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "all",
									children: "All statuses"
								}), ASSET_STATUSES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: item,
									children: item
								}, item))] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "lib-date",
								children: "Date"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: dateRange,
								onValueChange: setDateRange,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									id: "lib-date",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "all",
										children: "Any time"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "7d",
										children: "Last 7 days"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "30d",
										children: "Last 30 days"
									})
								] })]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UploadDropzone, {
						clientId: clientId === "all" ? null : clientId,
						maxUploadMb: data.settings.maxUploadMb,
						onUploaded: (id, duplicate) => {
							toast.success(duplicate ? "Already in the library" : "Ready in Library");
							setOpenId(id);
							refresh();
						},
						onError: (message) => toast.error(message)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-4 flex flex-col gap-2 sm:flex-row",
					onSubmit: (event) => {
						event.preventDefault();
						if (importUrl.trim()) urlImport.mutate();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: importUrl,
						onChange: (event) => setImportUrl(event.target.value),
						placeholder: "https:// allowlisted media URL",
						"aria-label": "Import URL"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						variant: "secondary",
						disabled: urlImport.isPending || !importUrl.trim(),
						children: "Import URL"
					})]
				}),
				clips.data?.clips.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-card font-semibold tracking-tight",
						children: "Twitch clips"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 flex flex-col gap-2",
						children: clips.data.clips.map((clip) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-3 rounded-control bg-secondary-surface px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 truncate text-body",
								children: clip.title || "Clip"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "secondary",
								disabled: clipIngest.isPending,
								onClick: () => clipIngest.mutate(clip.id),
								children: "Save to Library"
							})]
						}, clip.id))
					})]
				}) : null,
				selected.size > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-caption text-muted",
							children: [selected.size, " selected"]
						}),
						RENDER_PRESETS.filter((item) => item !== "CUSTOM").map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							size: "sm",
							variant: "secondary",
							onClick: () => bulkRender.mutate(preset),
							children: ["Queue ", PRESET_LABELS[preset]]
						}, preset)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							variant: "ghost",
							onClick: () => tag.mutate("ready"),
							children: "Tag ready"
						})
					]
				}) : null,
				assets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					className: "mt-8",
					title: "Library is empty",
					description: "Upload a clip, import an allowlisted URL, or save a Twitch clip. Renders and captions live on the asset.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-2 text-caption text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Source → asset → caption → render → social"]
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
					children: assets.map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetCard, {
						asset,
						selected: selected.has(asset.id),
						rollup: (data.rollups ?? []).find((row) => row.assetId === asset.id) ?? null,
						onOpen: () => setOpenId(asset.id),
						onToggle: () => toggle(asset.id)
					}, asset.id))
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RenderQueue, {
					jobs: data.renders,
					onCancel: (id) => cancel.mutate(id),
					onRetry: (id) => retry.mutate(id),
					onOpenOutput: (id) => {
						setTab("library");
						setOpenId(id);
					}
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetDrawer, {
				open: Boolean(openId),
				detail: detail.data ?? null,
				settings: data.settings,
				pending,
				onOpenChange: (next) => {
					if (!next) setOpenId(null);
				},
				onGenerateCaptions: () => openId && generate.mutate(openId),
				onSaveCues: (trackId, cues) => saveCues.mutate({
					trackId,
					cues
				}),
				onUploadSrt: (text) => openId && srt.mutate({
					assetId: openId,
					srt: text
				}),
				onDownloadCaptions: (trackId, format) => {
					exportCaptionsFn({ data: {
						trackId,
						format
					} }).then((file) => {
						downloadTextFile(file.filename, file.body);
					});
				},
				onQueueRender: (preset, burnIn, captionTrackId) => {
					if (!openId) return;
					renderMut.mutate({
						assetId: openId,
						preset,
						burnInCaptions: burnIn,
						captionTrackId
					});
				},
				onSendSocial: () => {
					if (!openId) return;
					navigate({ href: `/social?mediaAssetId=${encodeURIComponent(openId)}` });
				},
				onPublishYoutube: () => {
					if (!openId) return;
					navigate({ href: `/social?mediaAssetId=${encodeURIComponent(openId)}&platform=youtube` });
				},
				onArchive: () => openId && archive.mutate(openId),
				onProposeKnowledge: () => openId && propose.mutate(openId),
				canDelete: data.role === "admin"
			})
		]
	});
}
//#endregion
export { LibraryPage as component };
