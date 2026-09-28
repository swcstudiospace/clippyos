import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BLADE_X,
  CLIP_COUNT,
  ENGINE_STAGES,
  FRAME_COUNT,
  LAST_STAGE,
  engineFrames,
  framePose,
  hookNetwork,
  ringAngle,
  rigPose,
  spinsAt,
  stageIndex,
  timecode,
} from "./clip-engine.ts";

const frames = Array.from({ length: FRAME_COUNT }, (_, index) => index);

function posesAt(key: (typeof ENGINE_STAGES)[number]["key"]) {
  const stage = stageIndex(key);
  return frames.map((index) => framePose(index, stage));
}

test("the engine runs ten stages from the idle core to the online ring", () => {
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

test("twelve frames split into four clips of three with the hook in the middle", () => {
  assert.deepEqual(
    engineFrames().map((frame) => [frame.clip, frame.slot, frame.hook]),
    [
      [0, 0, false],
      [0, 1, true],
      [0, 2, false],
      [1, 0, false],
      [1, 1, true],
      [1, 2, false],
      [2, 0, false],
      [2, 1, true],
      [2, 2, false],
      [3, 0, false],
      [3, 1, true],
      [3, 2, false],
    ],
  );
});

test("every frame carries one pose per stage", () => {
  assert.deepEqual(
    engineFrames().map((frame) => frame.poses.length),
    frames.map(() => ENGINE_STAGES.length),
  );
});

test("the idle ring and the online ring place every frame at the same pose", () => {
  assert.deepEqual(posesAt("online"), posesAt("core"));
});

test("the ring keeps every frame on the radius and facing outward", () => {
  posesAt("core").forEach((pose, index) => {
    assert.ok(Math.abs(Math.hypot(pose.x, pose.z) - 250) < 0.05, `frame ${index} is off the ring`);
    assert.equal(pose.ry, ringAngle(index));
  });
});

test("ingest lays the footage out as one evenly spaced strip with sprockets", () => {
  const strip = posesAt("ingest");
  const gaps = strip.slice(1).map((pose, index) => Math.round(pose.x - strip[index].x));
  assert.deepEqual(
    gaps,
    Array.from({ length: FRAME_COUNT - 1 }, () => 106),
  );
  assert.deepEqual(
    strip.map((pose) => [pose.y, pose.z, pose.sp]),
    frames.map(() => [0, 0, 1]),
  );
});

test("detect lifts and highlights exactly one hook per clip", () => {
  assert.deepEqual(
    posesAt("detect").map((pose) => pose.hot),
    [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  );
});

test("cut leaves a wider gap between clips than between frames of one clip", () => {
  const cut = posesAt("cut");
  const inside = cut[1].x - cut[0].x;
  const between = cut[3].x - cut[2].x;
  assert.equal(inside, 88);
  assert.ok(between > inside * 2);
});

test("the blades sit on the strip boundaries between clips", () => {
  const strip = posesAt("ingest");
  const boundaries = [2, 5, 8].map((index) => (strip[index].x + strip[index + 1].x) / 2);
  assert.deepEqual(BLADE_X, boundaries);
});

test("render turns each clip into a vertical stack with the captioned hook in front", () => {
  const render = posesAt("render");
  for (let clip = 0; clip < CLIP_COUNT; clip++) {
    const [before, hook, after] = render.slice(clip * 3, clip * 3 + 3);
    assert.ok(hook.z > before.z && before.z > after.z);
    assert.ok(hook.h > hook.w);
    assert.deepEqual([before.cap, hook.cap, after.cap], [0, 1, 0]);
    assert.equal(before.x, hook.x);
  }
});

test("publish sends one captioned hook to each network, mirrored around the centre", () => {
  const publish = posesAt("publish");
  const hooks = publish.filter((pose) => pose.pub === 1);
  assert.equal(hooks.length, 4);
  assert.equal(hooks[0].x, -hooks[3].x);
  assert.equal(hooks[1].x, -hooks[2].x);
  assert.deepEqual(
    [0, 1, 2, 3].map((clip) => hookNetwork(clip)),
    ["X", "YouTube", "Instagram", "TikTok"],
  );
});

test("library stacks every frame flat, rising with each clip", () => {
  const library = posesAt("library");
  assert.deepEqual(
    library.map((pose) => [pose.x, pose.z, pose.rx]),
    frames.map(() => [0, 0, 90]),
  );
  library.slice(1).forEach((pose, index) => assert.ok(pose.y < library[index].y));
});

test("stages outside the list clamp to the nearest end", () => {
  assert.deepEqual(framePose(4, -3), framePose(4, 0));
  assert.deepEqual(framePose(4, 99), framePose(4, LAST_STAGE));
  assert.deepEqual(rigPose(42), rigPose(LAST_STAGE));
});

test("only the core, Hermes loop and online stages spin", () => {
  assert.deepEqual(
    ENGINE_STAGES.map((_, stage) => spinsAt(stage)),
    [true, false, false, false, false, false, false, false, true, true],
  );
});

test("the rig hides the core while clips move through the pipeline", () => {
  assert.deepEqual(
    ENGINE_STAGES.map((_, stage) => rigPose(stage).core),
    [1, 0, 0, 0, 0, 0, 0, 0, 0.8, 1],
  );
});

test("timecode counts 24fps frames across three seconds per stage", () => {
  assert.equal(timecode(0), "00:00:00:00");
  assert.equal(timecode(0.5), "00:00:13:12");
  assert.equal(timecode(1), "00:00:27:00");
  assert.equal(timecode(4), "00:00:27:00");
  assert.equal(timecode(-1), "00:00:00:00");
});
