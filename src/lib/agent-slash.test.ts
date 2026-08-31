import assert from "node:assert/strict";
import { test } from "node:test";
import { cardDraftFromSlash, goalFromSlash, parseAgentSlash, slashMissingArg } from "./agent-slash.ts";

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

test("/voice and /voiceover open the voiceover specialty", () => {
  const voice = parseAgentSlash("/voice Hey there");
  assert.equal(voice.command?.ui, "voiceover");
  assert.equal(voice.command?.preset, "crayo-voiceover");
  assert.equal(slashMissingArg(parseAgentSlash("/voice").command!, ""), "Add a script: /voice Hey — three habits that quietly ruin mornings.");
  const built = goalFromSlash(voice.command!, voice.rest);
  assert.equal(built.preset, "crayo-voiceover");
  assert.match(built.goal, /Hey there/);
  assert.match(built.goal, /generate_voiceover/);
  assert.equal(parseAgentSlash("/voiceover").command?.ui, "voiceover");
});

test("/image /import /export /ingest /account /voices /assets are Crayo specialities", () => {
  assert.equal(parseAgentSlash("/image neon").command?.preset, "crayo-image");
  assert.equal(parseAgentSlash("/import https://x.test/a.mp4").command?.preset, "crayo-import");
  assert.equal(parseAgentSlash("/export proj_1").command?.preset, "crayo-export");
  assert.equal(parseAgentSlash("/ingest https://cdn-crayo.com/a.mp4").command?.preset, "crayo-ingest");
  assert.equal(parseAgentSlash("/account").command?.cardOnly, true);
  assert.equal(parseAgentSlash("/voices").command?.ui, "voices");
  assert.equal(parseAgentSlash("/voices").command?.cardOnly, true);
  assert.equal(parseAgentSlash("/assets").command?.ui, "assets");
  assert.equal(parseAgentSlash("/assets").command?.cardOnly, true);
  assert.equal(slashMissingArg(parseAgentSlash("/image").command!, ""), "Add a prompt: /image neon skyline, 9:16, cinematic still");
  assert.equal(slashMissingArg(parseAgentSlash("/export").command!, ""), "Add a project id: /export proj_…");
});

test("card drafts prefill from slash rest", () => {
  const short = parseAgentSlash("/short morning habits");
  assert.equal(cardDraftFromSlash(short.command!, short.rest).topic, "morning habits");
  const voice = parseAgentSlash("/voice spoken line");
  assert.equal(cardDraftFromSlash(voice.command!, voice.rest).script, "spoken line");
});

test("partial slash lists matching commands", () => {
  const parsed = parseAgentSlash("/th");
  assert.equal(parsed.command, null);
  assert.equal(parsed.matching.some((row) => row.cmd === "/thumb"), true);
  const vo = parseAgentSlash("/vo");
  assert.equal(vo.matching.some((row) => row.cmd === "/voice"), true);
  assert.equal(vo.matching.some((row) => row.cmd === "/voiceover"), true);
});

test("plain text is not a slash command", () => {
  const parsed = parseAgentSlash("research the channel");
  assert.equal(parsed.command, null);
  assert.equal(parsed.matching.length, 0);
});
