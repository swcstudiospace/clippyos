import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BIN_COLUMNS,
  CARD_H,
  CARD_W,
  CARD_Y,
  CLIP_COUNT,
  ENGINE_STAGES,
  FOOTAGE_Y,
  GATE_SPAN,
  GATE_X,
  LANE_ORIGIN,
  LAST_STAGE,
  LOOP,
  NETWORKS,
  SEGMENT_W,
  TIMELINE_LENGTH,
  captionChips,
  clipPose,
  clipPoseAt,
  engineStateAt,
  hookX,
  laneDirection,
  readout,
  segmentX,
  smoothstep,
  stageFormation,
  stageIndex,
  stageState,
  timecode,
  waveAmplitude,
} from "./clip-engine.ts";

const clips = Array.from({ length: CLIP_COUNT }, (_, index) => index);
const on = (key: Parameters<typeof stageIndex>[0]) => stageState(stageIndex(key));

test("the engine runs ten stages from the assembled timeline to the online lap", () => {
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
    ENGINE_STAGES.map((_, index) => stageFormation(index)),
    ["track", "track", "track", "split", "reframe", "gate", "lanes", "bin", "loop", "track"],
  );
});

test("each stage switches on the parts that do its work", () => {
  assert.equal(on("ingest").ingest, 1);
  assert.equal(on("detect").hooks, 1);
  assert.equal(on("cut").razor, 1);
  assert.equal(on("render").captions, 1);
  assert.equal(on("render").tether, 1);
  assert.equal(on("approve").gate, 1);
  assert.equal(on("publish").lanes, 1);
  assert.equal(on("library").bin, 1);
  assert.equal(on("agent").loop, 1);
  const core = on("core");
  assert.equal(core.gate + core.lanes + core.loop + core.razor + core.ingest, 0);
});

test("the online stage finishes a full camera lap back to the assembled view", () => {
  const core = on("core").cam;
  const online = on("online").cam;
  assert.equal(online.rot - core.rot, 360);
  assert.deepEqual({ ...online, rot: 0 }, { ...core, rot: 0 });
});

test("engine state lands exactly on each stage and eases between them", () => {
  const approve = stageIndex("approve");
  assert.deepEqual(engineStateAt(approve), stageState(approve));
  const halfway = engineStateAt(approve + 0.5);
  assert.equal(halfway.gate, 0.5);
  assert.equal(halfway.lanes, 0.5);
  assert.equal(halfway.cam.x, (on("approve").cam.x + on("publish").cam.x) / 2);
});

test("progress outside the run clamps to the first and last stage", () => {
  assert.deepEqual(engineStateAt(-3), stageState(0));
  assert.deepEqual(engineStateAt(42), stageState(LAST_STAGE));
});

test("smoothstep eases in and out and clamps its input", () => {
  assert.deepEqual(
    [smoothstep(-1), smoothstep(0), smoothstep(0.5), smoothstep(1), smoothstep(2)],
    [0, 0, 0.5, 1, 1],
  );
});

test("the footage track tiles the timeline with flat clip segments", () => {
  const row = clips.map((index) => clipPose("track", index));
  assert.ok(Math.abs(row[0].x - (-TIMELINE_LENGTH / 2 + SEGMENT_W / 2)) < 0.001);
  row.slice(1).forEach((clip, index) => {
    assert.ok(Math.abs(clip.x - row[index].x - SEGMENT_W) < 0.002);
  });
  assert.ok(row.every((clip) => clip.rx === -90 && clip.w < SEGMENT_W));
  assert.ok(row.every((clip) => clip.y > FOOTAGE_Y && clip.y < FOOTAGE_Y + 0.1));
});

test("the cut lifts every segment off the track and pulls them apart", () => {
  const track = clips.map((index) => clipPose("track", index));
  const cut = clips.map((index) => clipPose("split", index, 0));
  cut.forEach((clip, index) => assert.ok(clip.y > track[index].y + 0.2));
  cut.slice(1).forEach((clip, index) => assert.ok(clip.x - cut[index].x > SEGMENT_W));
});

test("render stands every clip up as a vertical 9:16 card above the stack", () => {
  const cards = clips.map((index) => clipPose("reframe", index, 0));
  assert.ok(cards.every((card) => card.rx === 0 && card.w === CARD_W && card.h === CARD_H));
  assert.ok(Math.abs(CARD_H / CARD_W - 16 / 9) < 0.01);
  assert.ok(cards.every((card) => Math.abs(card.y - CARD_Y) <= 0.051));
});

test("the approval gate carries every clip through the gate on a conveyor", () => {
  for (const time of [0, 1.7, 9.3, 42]) {
    for (const index of clips) {
      const clip = clipPose("gate", index, time);
      assert.equal(clip.z, 0);
      assert.ok(Math.abs(clip.x - GATE_X) <= GATE_SPAN / 2);
      assert.ok(clip.scale >= 0 && clip.scale <= 1);
    }
  }
  const entering = clipPose("gate", 0, 0);
  assert.equal(entering.x, GATE_X - GATE_SPAN / 2);
  assert.equal(entering.scale, 0);
  const crossing = clipPose("gate", 0, 0.5 / 0.05);
  assert.ok(Math.abs(crossing.x - GATE_X) < 0.01);
  assert.equal(crossing.scale, 1);
});

test("publish sends three clips down each of the four network lanes", () => {
  const perLane = NETWORKS.map((_, lane) =>
    clips.filter((index) => index % NETWORKS.length === lane),
  );
  assert.ok(perLane.every((lane) => lane.length === 3));
  for (const time of [0, 2.5, 11]) {
    clips.forEach((index) => {
      const clip = clipPose("lanes", index, time);
      const dir = laneDirection(index % NETWORKS.length);
      const dx = clip.x - LANE_ORIGIN.x;
      const dy = clip.y - CARD_H * 0.36 - LANE_ORIGIN.y;
      assert.ok(Math.abs(dx * dir.y - dy * dir.x) < 0.01);
      assert.ok(dx * dir.x + dy * dir.y > 0);
    });
  }
});

test("the library files every clip flat into a six by two media bin", () => {
  const bin = clips.map((index) => clipPose("bin", index));
  assert.ok(bin.every((clip) => clip.rx === -90));
  assert.equal(new Set(bin.map((clip) => clip.x)).size, BIN_COLUMNS);
  assert.equal(new Set(bin.map((clip) => clip.z)).size, CLIP_COUNT / BIN_COLUMNS);
  assert.equal(new Set(bin.map((clip) => `${clip.x}:${clip.z}`)).size, CLIP_COUNT);
});

test("the Hermes loop keeps every clip on the loop around the machine", () => {
  for (const time of [0, 3.3]) {
    clips.forEach((index) => {
      const clip = clipPose("loop", index, time);
      const r = (clip.x / LOOP.x) ** 2 + ((clip.z - LOOP.center) / LOOP.z) ** 2;
      assert.ok(Math.abs(r - 1) < 0.01);
    });
  }
});

test("clip poses blend between the formations of neighbouring stages", () => {
  const cut = stageIndex("cut");
  const from = clipPose("split", 4, 0);
  const to = clipPose("reframe", 4, 0);
  const between = clipPoseAt(cut + 0.5, 4, 0);
  assert.ok(Math.abs(between.x - (from.x + to.x) / 2) < 0.002);
  assert.ok(Math.abs(between.rx - (from.rx + to.rx) / 2) < 0.002);
  assert.deepEqual(clipPoseAt(cut, 4, 0), from);
});

test("every clip carries one hook inside its own segment", () => {
  clips.forEach((index) => {
    const x = hookX(index);
    assert.ok(x > segmentX(index) - SEGMENT_W / 2 && x < segmentX(index) + SEGMENT_W / 2);
  });
});

test("the waveform spikes at the hooks only while hook detection runs", () => {
  const at = hookX(3);
  assert.ok(waveAmplitude(at, 1.2, 1) > waveAmplitude(at, 1.2, 0) + 0.3);
  assert.ok(waveAmplitude(at, 1.2, 1) <= 0.62);
  assert.ok(waveAmplitude(segmentX(3) + SEGMENT_W * 0.3, 1.2, 1) < 0.3);
});

test("caption chips run left to right across the caption track without overlapping", () => {
  const chips = captionChips();
  chips.slice(1).forEach((chip, index) => {
    const prev = chips[index];
    assert.ok(chip.x - chip.w / 2 > prev.x + prev.w / 2);
  });
  const first = chips[0];
  const last = chips[chips.length - 1];
  assert.ok(first.x - first.w / 2 >= -TIMELINE_LENGTH / 2);
  assert.ok(last.x + last.w / 2 <= TIMELINE_LENGTH / 2);
});

test("networks cover X, YouTube, Instagram and TikTok", () => {
  assert.deepEqual([...NETWORKS], ["X", "YouTube", "Instagram", "TikTok"]);
});

test("timecode counts 24fps frames across three seconds per stage", () => {
  assert.equal(timecode(0), "00:00:00:00");
  assert.equal(timecode(1), "00:00:27:00");
  assert.equal(timecode(0.5), "00:00:13:12");
});

test("the readout names the track in focus and the zoom", () => {
  assert.equal(readout(0), "all tracks · zoom 1.08x");
  assert.ok(readout(stageIndex("cut")).startsWith("V1 razor · zoom "));
  assert.ok(readout(stageIndex("publish")).startsWith("out 4 lanes"));
});
