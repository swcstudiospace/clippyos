import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as MAX_IDEATION_MESSAGE_CHARS } from "./mappers-Bmic_hyw.mjs";
import { h as require_jsx_runtime } from "../_libs/@radix-ui/react-collapsible+[...].mjs";
import { Nt as ArrowUp } from "../_libs/lucide-react.mjs";
import { O as cn, w as Button } from "./router-DRtNPEcw.mjs";
import { t as ShineBorder } from "./shine-border-CYiRLf3h.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/markdown-BvUKUwQu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ChatInput({ value, onChange, onSend, disabled, sending = false, placeholder = "Ask for titles, hooks, angles…", autoFocus = false, inputId = "chat-input", maxLength = MAX_IDEATION_MESSAGE_CHARS, maxGrowPx = 160, hint, sendDisabled = false }) {
	const ref = (0, import_react.useRef)(null);
	const canSend = !disabled && !sending && !sendDisabled && value.trim().length > 0;
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, maxGrowPx)}px`;
	}, [value, maxGrowPx]);
	function onKeyDown(event) {
		if (event.nativeEvent.isComposing || event.keyCode === 229) return;
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			if (canSend) onSend();
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-col gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "chat-composer relative flex min-w-0 items-end gap-2 overflow-hidden px-3 py-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShineBorder, { duration: 10 }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "sr-only",
					htmlFor: inputId,
					children: "Message"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					id: inputId,
					ref,
					rows: 1,
					value,
					onChange: (event) => {
						const next = event.target.value;
						onChange(maxLength == null ? next : next.slice(0, maxLength));
					},
					onKeyDown,
					placeholder,
					disabled,
					autoFocus,
					maxLength: maxLength ?? void 0,
					enterKeyHint: "send",
					autoComplete: "off",
					className: cn("min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-body text-fg placeholder:text-muted", "focus-visible:outline-none disabled:opacity-50"),
					style: { maxHeight: maxGrowPx }
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "icon",
					className: "mb-0.5 shrink-0 rounded-full",
					disabled: !canSend,
					onClick: onSend,
					"aria-label": "Send",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-5" })
				})
			]
		}), hint]
	});
}
/** Safe Markdown subset for assistant messages. Never uses innerHTML. */
function safeHref(href) {
	try {
		const url = new URL(href, "https://invalid.local");
		if (url.protocol === "http:" || url.protocol === "https:") return url.href;
	} catch {
		return null;
	}
	return null;
}
function inline(text, keyPrefix) {
	const nodes = [];
	const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
	let last = 0;
	let match;
	let i = 0;
	while (match = pattern.exec(text)) {
		if (match.index > last) nodes.push(text.slice(last, match.index));
		const token = match[0];
		const key = `${keyPrefix}-${i}`;
		i += 1;
		if (token.startsWith("`")) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "safe-md-code",
			children: token.slice(1, -1)
		}, key));
		else if (token.startsWith("**")) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: token.slice(2, -2) }, key));
		else if (token.startsWith("*")) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: token.slice(1, -1) }, key));
		else if (token.startsWith("[")) {
			const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
			const href = link ? safeHref(link[2] ?? "") : null;
			if (href && link) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href,
				target: "_blank",
				rel: "noopener noreferrer",
				className: "safe-md-link",
				children: link[1]
			}, key));
			else nodes.push(token);
		}
		last = match.index + token.length;
	}
	if (last < text.length) nodes.push(text.slice(last));
	return nodes;
}
function stripTags(value) {
	return value.replace(/<\/?[a-zA-Z][^>]*>/g, "");
}
function SafeMarkdown({ content }) {
	const blocks = [];
	const lines = content.replace(/\r\n/g, "\n").split("\n");
	let i = 0;
	let k = 0;
	while (i < lines.length) {
		const line = lines[i] ?? "";
		if (line.startsWith("```")) {
			const lang = line.slice(3).trim();
			const body = [];
			i += 1;
			while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
				body.push(lines[i] ?? "");
				i += 1;
			}
			i += 1;
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "safe-md-pre",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
					"data-lang": lang || void 0,
					children: body.join("\n")
				})
			}, `pre-${k}`));
			k += 1;
			continue;
		}
		if (/^#{1,3}\s+/.test(line)) {
			const level = line.match(/^#+/)?.[0].length ?? 1;
			const text = stripTags(line.replace(/^#{1,3}\s+/, ""));
			const Tag = level === 1 ? "h3" : level === 2 ? "h3" : "h4";
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
				className: "safe-md-h",
				children: inline(text, `h${k}`)
			}, `h-${k}`));
			i += 1;
			k += 1;
			continue;
		}
		if (/^\s*[-*]\s+/.test(line)) {
			const items = [];
			while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
				items.push(stripTags((lines[i] ?? "").replace(/^\s*[-*]\s+/, "")));
				i += 1;
			}
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "safe-md-list",
				children: items.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inline(item, `ul${k}-${idx}`) }, idx))
			}, `ul-${k}`));
			k += 1;
			continue;
		}
		if (/^\s*\d+\.\s+/.test(line)) {
			const items = [];
			while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
				items.push(stripTags((lines[i] ?? "").replace(/^\s*\d+\.\s+/, "")));
				i += 1;
			}
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "safe-md-list",
				children: items.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inline(item, `ol${k}-${idx}`) }, idx))
			}, `ol-${k}`));
			k += 1;
			continue;
		}
		if (!line.trim()) {
			i += 1;
			continue;
		}
		const para = [];
		while (i < lines.length && (lines[i] ?? "").trim() && !/^(#{1,3}\s+|```|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i] ?? "")) {
			para.push(stripTags(lines[i] ?? ""));
			i += 1;
		}
		blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "safe-md-p",
			children: inline(para.join(" "), `p${k}`)
		}, `p-${k}`));
		k += 1;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "safe-md",
		children: blocks
	});
}
//#endregion
export { SafeMarkdown as n, ChatInput as t };
