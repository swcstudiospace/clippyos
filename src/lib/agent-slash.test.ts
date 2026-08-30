import assert from "node:assert/strict";
import { test } from "node:test";
import { goalFromSlash, parseAgentSlash, slashMissingArg } from "./agent-slash.ts";

test("slash parser matches /ideas and leaves a note", () => {
  const parsed = parseAgentSlash("/ideas for Ada's channel");
  assert.equal(parsed.command?.cmd, "/ideas");
  assert.equal(parsed.rest, "for Ada's channel");
  const built = goalFromSlash(parsed.command!, parsed.rest);
  assert.equal(built.preset, "clipping-ideation-pack");
  assert.match(built.goal, /Operator note: for Ada's channel/);
});

test("/short without a topic asks for one; with a topic builds a Crayo goal", () => {
  const empty = parseAgentSlash("/short");
  assert.equal(slashMissingArg(empty.command!, empty.rest), "Add a topic: /short three habits that ruin mornings");
  const filled = parseAgentSlash("/short morning habits");
  assert.equal(slashMissingArg(filled.command!, filled.rest), null);
  const built = goalFromSlash(filled.command!, filled.rest);
  assert.equal(built.preset, "crayo-short");
  assert.match(built.goal, /morning habits/);
  assert.match(built.goal, /run_short/);
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
