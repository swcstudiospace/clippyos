/** Escape untrusted long-text before any non-text render path. React text nodes are already safe. */
const HTML_ESCAPES: Record<string, string> = {
  "&": "&" + "amp;",
  "<": "&" + "lt;",
  ">": "&" + "gt;",
  '"': "&" + "quot;",
  "'": "&" + "#39;",
};

export function sanitizeText(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/** Render helper: always return a plain string. Never pass the result to innerHTML. */
export function displayLongText(value: string | null | undefined): string {
  if (!value) return "";
  return value;
}
