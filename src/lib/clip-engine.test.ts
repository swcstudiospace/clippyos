import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLIP_COUNT,
  ENGINE_STAGES,
  LAST_STAGE,
  TRANSMITTER_COUNT,
  clipPose,
  clipPoseAt,
  engineStateAt,
  hookNetwork,
  isHookFrame,
  smoothstep,
  stageFormation,
  stageIndex,
  stageState,
  timecode,
  transmitterAngle,
} from "./clip-engine.ts";

const clips = Array.from({ length: CLIP_COUNT }, (_, index) => index);

test("the engine runs ten stages from the assembled core to the online lap", () => {
  assert.deepEqual(
    ENGINE_STAGES.map((stage) => stage.key),
    [
      "core",
      "ingest",
      "detect",
      "cut",
      "render",
      "approve",
      "publish",
      "library",
      "agent",
      "online",
    ],
  );
  assert.equal(LAST_STAGE, 9);
});

test("only the clip pipeline stages are marked as rolling out", () => {
  assert.deepEqual(
    ENGINE_STAGES.filter((stage) => !stage.live).map((stage) => stage.key),
    ["ingest", "detect", "cut", "render"],
  );
});

test("each stage arranges the clips in its own formation", () => {
  assert.deepEqual(
    ENGINE_STAGES.map((_, stage) => stageFormation(stage)),
    ["halo", "reel", "reel", "cut", "spiral", "gate", "broadcast", "vault", "orbit", "halo"],
  );
});

test("each stage switches on the moving parts that do its work", () => {
  const on = (key: (typeof ENGINE_STAGES)[number]["key"]) => stageState(stageIndex(key));
  assert.ok(on("ingest").reel > on("core").reel);
  assert.ok(on("ingest").strip > on("core").strip);
  assert.equal(on("detect").scanner, 1);
  assert.equal(on("detect").hooks, 1);
  assert.equal(on("cut").cutter, 1);
  assert.ok(on("render").rotor > 2);
  assert.equal(on("approve").gate, 1);
  assert.equal(on("publish").crown, 1);
  assert.equal(on("library").vault, 1);
  assert.deepEqual(
    ENGINE_STAGES.map((_, stage) => stageState(stage).cutter),
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  );
});

test("the online stage finishes a full camera lap back to the assembled view", () => {
  const core = stageState(stageIndex("core"));
  const online = stageState(stageIndex("online"));
  assert.equal(online.cam.rot - core.cam.rot, 360);
  assert.equal(online.cam.pitch, core.cam.pitch);
  assert.equal(online.cam.dist, core.cam.dist);
});

test("engine state lands exactly on each stage and eases between them", () => {
  ENGINE_STAGES.forEach((_, stage) => assert.deepEqual(engineStateAt(stage), stageState(stage)));
  const halfway = engineStateAt(0.5);
  assert.equal(halfway.cam.rot, 15);
  assert.equal(halfway.reel, (stageState(0).reel + stageState(1).reel) / 2);
  assert.ok(engineStateAt(0.1).cam.rot > 27);
});

test("progress outside the run clamps to the first and last stage", () => {
  assert.deepEqual(engineStateAt(-2), stageState(0));
  assert.deepEqual(engineStateAt(99), stageState(LAST_STAGE));
});

test("smoothstep eases in and out and clamps its input", () => {
  assert.deepEqual([-1, 0, 0.5, 1, 2].map(smoothstep), [0, 0, 0.5, 1, 1]);
  assert.ok(smoothstep(0.1) < 0.1);
});

test("the halo keeps every clip on its ring, facing outward", () => {
  clips.forEach((index) => {
    const clip = clipPose("halo", index);
    assert.ok(Math.abs(Math.hypot(clip.x, clip.z) - 3.4) < 0.01);
    assert.equal(clip.ry, Math.round((index / CLIP_COUNT) * 360 * 1000) / 1000);
  });
});

test("clips wait inside the supply reel until the cut", () => {
  assert.deepEqual(
    clips.map((index) => clipPose("reel", index).scale),
    clips.map(() => 0),
  );
  assert.ok(clips.every((index) => clipPose("cut", index).scale > 0));
});

test("the cut lays the clips out in one row in front of the cutter", () => {
  const row = clips.map((index) => clipPose("cut", index, 0));
  row.slice(1).forEach((clip, index) => assert.ok(clip.x > row[index].x));
  assert.ok(row.every((clip) => clip.z === 3.7));
  assert.equal(row[0].x, -row[CLIP_COUNT - 1].x);
});

test("broadcast sends three clips to each of the four transmitters", () => {
  const groups = new Map<number, number>();
  clips.forEach((index) => {
    const clip = clipPose("broadcast", index, 0);
    groups.set(clip.ry, (groups.get(clip.ry) ?? 0) + 1);
  });
  assert.deepEqual(
    [...groups.entries()].sort((a, b) => a[0] - b[0]),
    Array.from({ length: TRANSMITTER_COUNT }, (_, k) => [transmitterAngle(k), 3]),
  );
});

test("the vault stacks every clip flat, one above the other", () => {
  const stack = clips.map((index) => clipPose("vault", index));
  assert.ok(stack.every((clip) => clip.rx === -90 && clip.x === 0 && clip.z === -3.3));
  stack.slice(1).forEach((clip, index) => assert.ok(clip.y > stack[index].y));
});

test("clip poses blend between the formations of neighbouring stages", () => {
  const cut = stageIndex("cut");
  const halo = clipPoseAt(0, 3, 1.5);
  assert.deepEqual(halo, clipPose("halo", 3, 1.5));
  assert.deepEqual(clipPoseAt(cut, 3, 1.5), clipPose("cut", 3, 1.5));
  const between = clipPoseAt(cut - 0.5, 3, 1.5);
  assert.equal(between.scale, Math.round(0.62 * 0.5 * 1000) / 1000);
});

test("every fourth film frame is a hook", () => {
  assert.deepEqual(
    Array.from({ length: 9 }, (_, index) => isHookFrame(index)),
    [false, true, false, false, false, true, false, false, false],
  );
});

test("hook networks cycle through X, YouTube, Instagram and TikTok", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((clip) => hookNetwork(clip)),
    ["X", "YouTube", "Instagram", "TikTok", "X"],
  );
});

test("timecode counts 24fps frames across three seconds per stage", () => {
  assert.equal(timecode(0), "00:00:00:00");
  assert.equal(timecode(0.5), "00:00:13:12");
  assert.equal(timecode(1), "00:00:27:00");
  assert.equal(timecode(4), "00:00:27:00");
  assert.equal(timecode(-1), "00:00:00:00");
});
