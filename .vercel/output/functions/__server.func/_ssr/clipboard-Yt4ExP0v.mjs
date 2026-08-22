//#region node_modules/.nitro/vite/services/ssr/assets/clipboard-Yt4ExP0v.js
/** Best-effort copy. Preview iframes often block `navigator.clipboard`. */
async function copyTextToClipboard(text) {
	if (!text) return false;
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {}
	try {
		const field = document.createElement("textarea");
		field.value = text;
		field.setAttribute("readonly", "");
		field.setAttribute("aria-hidden", "true");
		field.style.position = "fixed";
		field.style.top = "0";
		field.style.left = "-9999px";
		field.style.opacity = "0";
		document.body.appendChild(field);
		field.focus();
		field.select();
		field.setSelectionRange(0, text.length);
		const ok = document.execCommand("copy");
		document.body.removeChild(field);
		return ok;
	} catch {
		return false;
	}
}
function downloadTextFile(filename, text) {
	if (!text) return false;
	try {
		return triggerDownload(filename, new Blob([text], { type: "text/plain;charset=utf-8" }));
	} catch {
		return false;
	}
}
function decodeBase64(base64) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
function downloadBinaryFile(filename, contentType, bytes) {
	if (!filename || bytes.byteLength === 0) return false;
	try {
		const copy = new Uint8Array(bytes.byteLength);
		copy.set(bytes);
		return triggerDownload(filename, new Blob([copy], { type: contentType || "application/octet-stream" }));
	} catch {
		return false;
	}
}
function triggerDownload(filename, blob) {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.rel = "noopener";
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
	return true;
}
//#endregion
export { downloadTextFile as i, decodeBase64 as n, downloadBinaryFile as r, copyTextToClipboard as t };
