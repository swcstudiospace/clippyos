/** Best-effort copy. Preview iframes often block `navigator.clipboard`. */

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to execCommand */
  }
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

export function downloadTextFile(filename: string, text: string): boolean {
  if (!text) return false;
  try {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    return triggerDownload(filename, blob);
  } catch {
    return false;
  }
}

export function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function downloadBinaryFile(
  filename: string,
  contentType: string,
  bytes: Uint8Array,
): boolean {
  if (!filename || bytes.byteLength === 0) return false;
  try {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy], { type: contentType || "application/octet-stream" });
    return triggerDownload(filename, blob);
  } catch {
    return false;
  }
}

function triggerDownload(filename: string, blob: Blob): boolean {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
