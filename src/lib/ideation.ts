/** Ideation tab — client-safe constants. Truncation and prompt live here so UI and server share them. */

export const IDEATION_SYSTEM_PROMPT =
  "You are an expert content strategist specializing in personal-brand growth on YouTube and social media. You help ideate video titles, thumbnail concepts, content angles, hooks, and growth strategies. You remember everything in this thread and build on previous insights. When given a YouTube URL, analyze its content strategy and extract learnings.";

export const LONG_FORM_SECONDS = 240;
export const MAX_IDEATION_MESSAGE_CHARS = 8000;
export const IDEATION_THREADS_QUERY_KEY = ["ideation-threads"] as const;

export function ideationMessagesQueryKey(threadId: string) {
  return ["ideation-messages", threadId] as const;
}

/**
 * History truncation (server): keep the immutable system prompt and the newest
 * turns. Drop oldest user/assistant pairs once the concatenated history exceeds
 * ~24k characters (~6k tokens at 4 chars/token). Always retain at least the
 * last 6 conversation messages.
 */
export const HISTORY_CHAR_BUDGET = 24_000;
export const HISTORY_MIN_RECENT = 6;

export function titleFromFirstMessage(content: string): string {
  const line = content.replace(/\s+/g, " ").trim();
  if (!line) return "New Ideation";
  if (line.length <= 56) return line;
  return `${line.slice(0, 53).trim()}…`;
}

export function cleanUserMessage(raw: string): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, MAX_IDEATION_MESSAGE_CHARS);
}

export function userAskedAboutShorts(text: string): boolean {
  return /\bshorts\b|\bshort[- ]form\b|\bunder 4 minutes?\b|\bunder four minutes?\b/i.test(text);
}
