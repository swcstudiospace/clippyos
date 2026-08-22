//#region node_modules/.nitro/vite/services/ssr/assets/sanitize-DAA2oq7r.js
/** Escape untrusted long-text before any non-text render path. React text nodes are already safe. */
var HTML_ESCAPES = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
function sanitizeText(value) {
	return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}
//#endregion
export { sanitizeText as t };
