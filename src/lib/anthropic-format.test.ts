import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildAnthropicPayload,
  fromAnthropicResponse,
  toAnthropicRequest,
  toAnthropicToolChoice,
  toAnthropicTools,
} from "./anthropic-format.ts";

test("toAnthropicRequest lifts system messages into the top-level system field", () => {
  const { system, messages } = toAnthropicRequest([
    { role: "system", content: "Be terse." },
    { role: "user", content: "Hello" },
  ]);
  assert.equal(system, "Be terse.");
  assert.deepEqual(messages, [{ role: "user", content: [{ type: "text", text: "Hello" }] }]);
});

test("toAnthropicRequest turns a tool-result message into a user turn with a tool_result block", () => {
  const { messages } = toAnthropicRequest([
    { role: "tool", tool_call_id: "call_1", content: "42" },
  ]);
  assert.deepEqual(messages, [
    { role: "user", content: [{ type: "tool_result", tool_use_id: "call_1", content: "42" }] },
  ]);
});

test("toAnthropicRequest converts an assistant tool call into a tool_use block", () => {
  const { messages } = toAnthropicRequest([
    {
      role: "assistant",
      content: null,
      tool_calls: [
        { id: "call_1", type: "function", function: { name: "lookup", arguments: '{"id":7}' } },
      ],
    },
  ]);
  assert.deepEqual(messages, [
    {
      role: "assistant",
      content: [{ type: "tool_use", id: "call_1", name: "lookup", input: { id: 7 } }],
    },
  ]);
});

test("toAnthropicRequest maps image_url content parts to Anthropic image blocks", () => {
  const { messages } = toAnthropicRequest([
    {
      role: "user",
      content: [
        { type: "text", text: "What is this?" },
        { type: "image_url", image_url: { url: "https://example.com/a.png" } },
      ],
    },
  ]);
  assert.deepEqual(messages, [
    {
      role: "user",
      content: [
        { type: "text", text: "What is this?" },
        { type: "image", source: { type: "url", url: "https://example.com/a.png" } },
      ],
    },
  ]);
});

test("toAnthropicTools converts OpenAI function tool defs to Anthropic's flat shape", () => {
  const tools = toAnthropicTools([
    {
      type: "function",
      function: { name: "lookup", description: "Look something up", parameters: { type: "object" } },
    },
  ]);
  assert.deepEqual(tools, [
    { name: "lookup", description: "Look something up", input_schema: { type: "object" } },
  ]);
});

test("toAnthropicTools returns undefined for empty or missing tool lists", () => {
  assert.equal(toAnthropicTools(undefined), undefined);
  assert.equal(toAnthropicTools([]), undefined);
});

test("toAnthropicToolChoice maps auto/none/required/named-function", () => {
  assert.deepEqual(toAnthropicToolChoice("auto"), { type: "auto" });
  assert.deepEqual(toAnthropicToolChoice(undefined), { type: "auto" });
  assert.equal(toAnthropicToolChoice("none"), undefined);
  assert.deepEqual(toAnthropicToolChoice("required"), { type: "any" });
  assert.deepEqual(toAnthropicToolChoice({ type: "function", function: { name: "lookup" } }), {
    type: "tool",
    name: "lookup",
  });
});

test("fromAnthropicResponse joins text blocks and maps stop_reason to a finish string", () => {
  const { finish, message } = fromAnthropicResponse({
    content: [{ type: "text", text: "Hello" }, { type: "text", text: " world" }],
    stop_reason: "end_turn",
  });
  assert.equal(finish, "stop");
  assert.deepEqual(message, { role: "assistant", content: "Hello world", tool_calls: undefined });
});

test("fromAnthropicResponse reconstructs OpenAI-shaped tool_calls from tool_use blocks", () => {
  const { finish, message } = fromAnthropicResponse({
    content: [{ type: "tool_use", id: "toolu_1", name: "lookup", input: { id: 7 } }],
    stop_reason: "tool_use",
  });
  assert.equal(finish, "tool_calls");
  assert.equal(message.content, null);
  assert.deepEqual(message.tool_calls, [
    { id: "toolu_1", type: "function", function: { name: "lookup", arguments: '{"id":7}' } },
  ]);
});

test("buildAnthropicPayload lifts system prompt, sets max_tokens, and wires tools+tool_choice", () => {
  const payload = buildAnthropicPayload(
    "claude-sonnet-5",
    [
      { role: "system", content: "Be terse." },
      { role: "user", content: "Hi" },
    ],
    {
      maxTokens: 512,
      temperature: 0.2,
      tools: [{ type: "function", function: { name: "lookup", parameters: { type: "object" } } }],
    },
  );
  assert.deepEqual(payload, {
    model: "claude-sonnet-5",
    max_tokens: 512,
    messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
    system: "Be terse.",
    temperature: 0.2,
    tools: [{ name: "lookup", description: undefined, input_schema: { type: "object" } }],
    tool_choice: { type: "auto" },
  });
});

test("buildAnthropicPayload defaults max_tokens and omits tools/system when absent", () => {
  const payload = buildAnthropicPayload("claude-sonnet-5", [{ role: "user", content: "Hi" }], {});
  assert.deepEqual(payload, {
    model: "claude-sonnet-5",
    max_tokens: 1600,
    messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
  });
});
