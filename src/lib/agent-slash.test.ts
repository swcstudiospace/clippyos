import assert from "node:assert/strict";
import { test } from "node:test";
import { goalFromSlash, parseAgentSlash } from "./agent-slash.ts";

test("slash parser matches /ideas and leaves a note", () => {
  const parsed = parseAgentSlash("/ideas for Ada's channel");
  assert.equal(parsed.command?.cmd, "/ideas");
  assert.equal(parsed.rest, "for Ada's channel");
  const built = goalFromSlash(parsed.command!, parsed.rest);
  assert.equal(built.preset, "clipping-ideation-pack");
  assert.match(built.goal, /Operator note: for Ada's channel/);
});

test("partial slash lists matching commands", () => {
  const parsed = parseAgentSlash("/th");
  assert.equal(parsed.command, null);
  assert.equal(parsed.matching.some((row) => row.cmd === "/thumb"), true);
});

test("plain text is not a slash command", () => {
  const parsed = parseAgentSlash("research the channel");
  assert.equal(parsed.command, null);
  assert.equal(parsed.matching.length, 0);
});
