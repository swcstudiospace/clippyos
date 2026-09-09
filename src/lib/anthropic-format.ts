/**
 * Anthropic Messages API <-> the OpenAI-chat-completions shape xaiChat speaks
 * everywhere else in this codebase. Pure translation, no secrets, no SDK —
 * xai.server.ts owns the actual HTTP call and credential.
 */
import type { XaiChatMessage, XaiContentPart } from "@/lib/server/xai.server";

export const ANTHROPIC_VERSION = "2023-06-01";

type AnthropicTextBlock = { type: "text"; text: string };
type AnthropicImageBlock = { type: "image"; source: { type: "url"; url: string } };
type AnthropicToolUseBlock = { type: "tool_use"; id: string; name: string; input: unknown };
type AnthropicToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string };
type AnthropicContentBlock =
  | AnthropicTextBlock
  | AnthropicImageBlock
  | AnthropicToolUseBlock
  | AnthropicToolResultBlock;

export type AnthropicMessage = { role: "user" | "assistant"; content: AnthropicContentBlock[] };

function xaiTextOf(content: XaiChatMessage["content"]): string {
  if (typeof content === "string") return content;
  if (!content) return "";
  return content.map((part) => (part.type === "text" ? part.text : "")).join(" ");
}

function contentBlocksFor(content: XaiChatMessage["content"]): AnthropicContentBlock[] {
  if (typeof content === "string") return content ? [{ type: "text", text: content }] : [];
  if (!content) return [];
  const blocks: AnthropicContentBlock[] = [];
  for (const part of content as XaiContentPart[]) {
    if (part.type === "text" && part.text) blocks.push({ type: "text", text: part.text });
    else if (part.type === "image_url") {
      blocks.push({ type: "image", source: { type: "url", url: part.image_url.url } });
    }
  }
  return blocks;
}

/** Anthropic has no "system" or "tool" message role: system prompts are a
 * top-level field, and tool results are a content block on a "user" turn. */
export function toAnthropicRequest(messages: XaiChatMessage[]): {
  system: string | undefined;
  messages: AnthropicMessage[];
} {
  const systemParts: string[] = [];
  const out: AnthropicMessage[] = [];
  for (const msg of messages) {
    if (msg.role === "system") {
      const text = xaiTextOf(msg.content);
      if (text) systemParts.push(text);
      continue;
    }
    if (msg.role === "tool") {
      out.push({
        role: "user",
        content: [
          { type: "tool_result", tool_use_id: msg.tool_call_id ?? "", content: xaiTextOf(msg.content) },
        ],
      });
      continue;
    }
    const blocks = contentBlocksFor(msg.content);
    for (const call of msg.tool_calls ?? []) {
      let input: unknown = {};
      try {
        input = JSON.parse(call.function.arguments);
      } catch {
        input = {};
      }
      blocks.push({ type: "tool_use", id: call.id, name: call.function.name, input });
    }
    if (blocks.length) out.push({ role: msg.role, content: blocks });
  }
  return { system: systemParts.length ? systemParts.join("\n\n") : undefined, messages: out };
}

/** OpenAI tool def `{type:"function", function:{name,description,parameters}}`
 * -> Anthropic's flat `{name, description, input_schema}`. */
export function toAnthropicTools(tools: unknown): unknown[] | undefined {
  if (!Array.isArray(tools) || tools.length === 0) return undefined;
  return tools.map((entry) => {
    if (!entry || typeof entry !== "object" || !("function" in entry)) return entry;
    const fn = entry.function;
    if (!fn || typeof fn !== "object" || !("name" in fn) || typeof fn.name !== "string") return entry;
    const description = "description" in fn && typeof fn.description === "string" ? fn.description : undefined;
    const parameters = "parameters" in fn ? fn.parameters : undefined;
    return {
      name: fn.name,
      description,
      input_schema: parameters ?? { type: "object", properties: {} },
    };
  });
}

/** OpenAI `tool_choice` ("auto" | "none" | {function:{name}}) -> Anthropic's
 * `{type:"auto"|"any"|"tool", name?}`. */
export function toAnthropicToolChoice(choice: unknown): { type: string; name?: string } | undefined {
  if (choice == null || choice === "auto") return { type: "auto" };
  if (choice === "none") return undefined;
  if (choice === "required") return { type: "any" };
  if (choice && typeof choice === "object" && "function" in choice) {
    const fn = choice.function;
    if (fn && typeof fn === "object" && "name" in fn && typeof fn.name === "string") {
      return { type: "tool", name: fn.name };
    }
  }
  return { type: "auto" };
}

const STOP_REASON_TO_FINISH: Record<string, string> = {
  end_turn: "stop",
  max_tokens: "length",
  stop_sequence: "stop",
  tool_use: "tool_calls",
};

/** Anthropic's `{content: [...blocks], stop_reason}` -> the
 * `{finish, message}` shape every xaiChat caller already expects. */
export function fromAnthropicResponse(body: {
  content?: Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown }>;
  stop_reason?: string | null;
}): { finish: string | null; message: XaiChatMessage } {
  const parts = body.content ?? [];
  const text = parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
  const toolCalls = parts
    .filter((part) => part.type === "tool_use")
    .map((part) => ({
      id: part.id ?? "",
      type: "function" as const,
      function: { name: part.name ?? "", arguments: JSON.stringify(part.input ?? {}) },
    }));
  return {
    finish: body.stop_reason ? (STOP_REASON_TO_FINISH[body.stop_reason] ?? body.stop_reason) : null,
    message: {
      role: "assistant",
      content: text || null,
      tool_calls: toolCalls.length ? toolCalls : undefined,
    },
  };
}

/** Builds the full Anthropic Messages API request body from the same params
 * xaiChat accepts for every other provider. */
export function buildAnthropicPayload(
  model: string,
  messages: XaiChatMessage[],
  opts: { maxTokens?: number; temperature?: number; tools?: unknown; toolChoice?: unknown },
): Record<string, unknown> {
  const { system, messages: anthropicMessages } = toAnthropicRequest(messages);
  const payload: Record<string, unknown> = {
    model,
    max_tokens: opts.maxTokens ?? 1600,
    messages: anthropicMessages,
  };
  if (system) payload.system = system;
  if (opts.temperature != null) payload.temperature = opts.temperature;
  const tools = toAnthropicTools(opts.tools);
  if (tools) {
    payload.tools = tools;
    const toolChoice = toAnthropicToolChoice(opts.toolChoice);
    if (toolChoice) payload.tool_choice = toolChoice;
  }
  return payload;
}
