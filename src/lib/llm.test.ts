import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_OPENAI_COMPAT_BASE,
  LLM_MODELS,
  modelsForProvider,
  normalizeOpenAiCompatBase,
} from "./llm.ts";

test("OpenAI-compatible catalog includes GLM 5.3 Flash for OpenRouter", () => {
  const ids = modelsForProvider("openai-compat").map((row) => row.id);
  assert.equal(ids.includes("z-ai/glm-5.3-flash"), true);
  assert.equal(
    LLM_MODELS.some((row) => row.id === "z-ai/glm-5.3-flash" && row.provider === "openrouter"),
    true,
  );
});

test("xAI providers keep Grok models and omit OpenRouter ids", () => {
  const ids = modelsForProvider("xai-api").map((row) => row.id);
  assert.equal(ids.includes("grok-4.6"), true);
  assert.equal(ids.includes("z-ai/glm-5.3-flash"), false);
});

test("OpenAI-compatible base URL normalizes OpenRouter and rejects junk", () => {
  assert.equal(
    normalizeOpenAiCompatBase("https://openrouter.ai/api/v1/"),
    "https://openrouter.ai/api/v1",
  );
  assert.equal(normalizeOpenAiCompatBase("  "), null);
  assert.equal(normalizeOpenAiCompatBase("not-a-url"), null);
  assert.equal(normalizeOpenAiCompatBase("javascript:alert(1)"), null);
  assert.equal(normalizeOpenAiCompatBase("http://example.com/v1"), null);
  assert.equal(normalizeOpenAiCompatBase("http://localhost:4000/v1"), "http://localhost:4000/v1");
  assert.equal(DEFAULT_OPENAI_COMPAT_BASE, "https://openrouter.ai/api/v1");
});
