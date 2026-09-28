export const ENGINE_STAGES = [
  { key: "core", mode: "Assembled", live: true },
  { key: "ingest", mode: "Ingest", live: false },
  { key: "detect", mode: "Detect", live: false },
  { key: "cut", mode: "Cut", live: false },
  { key: "render", mode: "Caption + render", live: false },
  { key: "approve", mode: "Approve", live: true },
  { key: "publish", mode: "Publish", live: true },
  { key: "library", mode: "Library", live: true },
  { key: "agent", mode: "Hermes loop", live: true },
  { key: "online", mode: "Online", live: true },
] as const;

export type EngineStageKey = (typeof ENGINE_STAGES)[number]["key"];

export const STAGE_COUNT = ENGINE_STAGES.length;
export const LAST_STAGE = STAGE_COUNT - 1;
export const CLIP_COUNT = 12;

export const TIMELINE_LENGTH = 8;
export const TRACK_DEPTH = 1.5;
export const TRACKS = [
  { key: "A1", label: "Audio", y: 0.9 },
  { key: "V1", label: "Footage", y: 1.85 },
  { key: "C1", label: "Captions", y: 2.8 },
] as const;
export const FOOTAGE_Y = 1.85;
export const RULER_Y = 3.75;
export const CARD_Y = 4.9;
export const SEGMENT_W = TIMELINE_LENGTH / CLIP_COUNT;
export const CARD_W = 0.5;
export const CARD_H = 0.89;
export const GATE_X = 0;
export const GATE_SPAN = TIMELINE_LENGTH;
export const LANE_ORIGIN = { x: 4.7, y: RULER_Y, z: 0 } as const;
export const LANE_ANGLES = [0, 22, 44, 66] as const;
export const LANE_LENGTH = 4;
export const BIN_COLUMNS = 6;
export const BIN_ROWS = 2;
export const BIN_Z = 1.6;
export const LOOP = { x: 5.9, z: 3.2, y: 1.85, center: 0.5 } as const;
export const WAVE_BARS = 112;
export const CAPTION_WORDS = 14;

export const NETWORKS = ["X", "YouTube", "Instagram", "TikTok"] as const;
export const PIPELINE_STEPS = ["Ingest", "Detect", "Cut", "Caption + render"] as const;
export const STORAGE_LAYERS = [
  { label: "Cloud storage", detail: "immutable" },
  { label: "Overflow", detail: "optional" },
  { label: "Content pin", detail: "optional" },
] as const;
export const AGENT_LINES = ["MCP tools", "Playbooks", "Isolated skills", "Linear sync"] as const;
export const ENGINE_PARTS = [
  { count: 1, label: "playhead" },
  { count: TRACKS.length, label: "tracks" },
  { count: NETWORKS.length, label: "output lanes" },
  { count: CLIP_COUNT, label: "clips" },
] as const;

export type EngineCamera = {
  rot: number;
  pitch: number;
  dist: number;
  x: number;
  y: number;
  z: number;
};

export type EngineState = {
  cam: EngineCamera;
  sweep: number;
  ingest: number;
  wave: number;
  hooks: number;
  razor: number;
  tether: number;
  captions: number;
  gate: number;
  lanes: number;
  bin: number;
  loop: number;
  glow: number;
};

export type FormationKey = "track" | "split" | "reframe" | "gate" | "lanes" | "bin" | "loop";

export type ClipPose = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  w: number;
  h: number;
  scale: number;
};

type StageConfig = EngineState & { formation: FormationKey; focus: string };

const BASE: Omit<StageConfig, "cam" | "formation" | "focus"> = {
  sweep: 1,
  ingest: 0,
  wave: 0.5,
  hooks: 0,
  razor: 0,
  tether: 0,
  captions: 0.2,
  gate: 0,
  lanes: 0,
  bin: 0.25,
  loop: 0,
  glow: 1,
};

const STAGES: Record<EngineStageKey, StageConfig> = {
  core: {
    ...BASE,
    cam: { rot: 42, pitch: -21, dist: 19.5, x: -0.2, y: 1.9, z: 0.6 },
    formation: "track",
    focus: "all tracks",
  },
  ingest: {
    ...BASE,
    cam: { rot: 50, pitch: -14, dist: 13, x: -3.4, y: 1.9, z: 0 },
    sweep: 1.4,
    ingest: 1,
    wave: 0.3,
    formation: "track",
    focus: "V1 source in",
  },
  detect: {
    ...BASE,
    cam: { rot: 12, pitch: -22, dist: 12.5, x: -0.8, y: 1.4, z: 0 },
    sweep: 0.8,
    wave: 1,
    hooks: 1,
    glow: 1.2,
    formation: "track",
    focus: "A1 hook scan",
  },
  cut: {
    ...BASE,
    cam: { rot: -20, pitch: -28, dist: 13.5, x: 1, y: 2.5, z: 0 },
    sweep: 1.8,
    wave: 0.6,
    hooks: 0.6,
    razor: 1,
    tether: 0.3,
    glow: 1.3,
    formation: "split",
    focus: "V1 razor",
  },
  render: {
    ...BASE,
    cam: { rot: 10, pitch: -12, dist: 18, x: 0.4, y: 5.4, z: 0 },
    sweep: 0.6,
    wave: 0.4,
    tether: 1,
    captions: 1,
    glow: 1.3,
    formation: "reframe",
    focus: "C1 captions 9:16",
  },
  approve: {
    ...BASE,
    cam: { rot: -24, pitch: -10, dist: 15.5, x: 0.6, y: 5.5, z: 0 },
    sweep: 0.4,
    wave: 0.3,
    captions: 0.5,
    gate: 1,
    glow: 1.1,
    formation: "gate",
    focus: "review gate",
  },
  publish: {
    ...BASE,
    cam: { rot: 14, pitch: -16, dist: 17.5, x: 7.6, y: 6.7, z: 0 },
    sweep: 0.5,
    wave: 0.3,
    lanes: 1,
    glow: 1.4,
    formation: "lanes",
    focus: "out 4 lanes",
  },
  library: {
    ...BASE,
    cam: { rot: 6, pitch: -46, dist: 14, x: 0.6, y: 0.6, z: 1.8 },
    sweep: 0.3,
    wave: 0.2,
    bin: 1,
    formation: "bin",
    focus: "media bin",
  },
  agent: {
    ...BASE,
    cam: { rot: 150, pitch: -28, dist: 20, x: 0, y: 2, z: 0.4 },
    sweep: 1.2,
    wave: 0.6,
    captions: 0.5,
    loop: 1,
    glow: 1.3,
    formation: "loop",
    focus: "hermes loop",
  },
  online: {
    ...BASE,
    cam: { rot: 402, pitch: -21, dist: 19.5, x: -0.2, y: 1.9, z: 0.6 },
    wave: 0.6,
    captions: 0.4,
    glow: 1.2,
    formation: "track",
    focus: "all tracks",
  },
};

const NUMERIC_KEYS = [
  "sweep",
  "ingest",
  "wave",
  "hooks",
  "razor",
  "tether",
  "captions",
  "gate",
  "lanes",
  "bin",
  "loop",
  "glow",
] as const satisfies readonly (keyof EngineState)[];

const CAMERA_KEYS = [
  "rot",
  "pitch",
  "dist",
  "x",
  "y",
  "z",
] as const satisfies readonly (keyof EngineCamera)[];

const TAU = Math.PI * 2;

function clampStage(stage: number): number {
  return Math.min(LAST_STAGE, Math.max(0, stage));
}

function stageKey(stage: number): EngineStageKey {
  return ENGINE_STAGES[Math.round(clampStage(stage))].key;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function round(value: number): number {
  const rounded = Math.round(value * 1000) / 1000;
  return rounded === 0 ? 0 : rounded;
}

function wrap(value: number): number {
  return ((value % 1) + 1) % 1;
}

export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function split(progress: number): { from: number; to: number; t: number } {
  const p = clampStage(progress);
  const from = Math.floor(p);
  const to = Math.min(LAST_STAGE, from + 1);
  return { from, to, t: smoothstep(p - from) };
}

export function stageIndex(key: EngineStageKey): number {
  return ENGINE_STAGES.findIndex((stage) => stage.key === key);
}

export function stageFormation(stage: number): FormationKey {
  return STAGES[stageKey(stage)].formation;
}

export function stageFocus(stage: number): string {
  return STAGES[stageKey(stage)].focus;
}

export function stageState(stage: number): EngineState {
  const { formation: _formation, focus: _focus, ...state } = STAGES[stageKey(stage)];
  return { ...state, cam: { ...state.cam } };
}

export function engineStateAt(progress: number): EngineState {
  const { from, to, t } = split(progress);
  const a = stageState(from);
  const b = stageState(to);
  const state = { ...a, cam: { ...a.cam } };
  NUMERIC_KEYS.forEach((key) => {
    state[key] = round(lerp(a[key], b[key], t));
  });
  CAMERA_KEYS.forEach((key) => {
    state.cam[key] = round(lerp(a.cam[key], b.cam[key], t));
  });
  return state;
}

export function readout(progress: number): string {
  const { cam } = engineStateAt(progress);
  const zoom = (21 / cam.dist).toFixed(2);
  return `${stageFocus(progress)} · zoom ${zoom}x`;
}

function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function pose(
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number,
  w: number,
  h: number,
  scale: number,
): ClipPose {
  return {
    x: round(x),
    y: round(y),
    z: round(z),
    rx: round(rx),
    ry: round(ry),
    w: round(w),
    h: round(h),
    scale: round(scale),
  };
}

export function segmentX(index: number): number {
  return -TIMELINE_LENGTH / 2 + (index + 0.5) * SEGMENT_W;
}

export function hookX(index: number): number {
  return segmentX(index) - SEGMENT_W / 2 + SEGMENT_W * 0.3;
}

export function waveAmplitude(x: number, time: number, hooks: number): number {
  const body =
    0.08 +
    0.16 * Math.abs(Math.sin(x * 3.1 + time * 2.3)) * Math.abs(Math.sin(x * 7.7 - time * 1.1));
  let peak = 0;
  for (let i = 0; i < CLIP_COUNT; i++) {
    const d = (x - hookX(i)) / 0.11;
    peak = Math.max(peak, Math.exp(-d * d));
  }
  return round(Math.min(0.62, body + peak * 0.36 * hooks));
}

export function captionChips(): { x: number; w: number }[] {
  const widths = Array.from({ length: CAPTION_WORDS }, (_, i) => 0.3 + ((i * 7) % 5) * 0.08);
  const gap = 0.1;
  const total = widths.reduce((sum, w) => sum + w, 0) + gap * (CAPTION_WORDS - 1);
  let cursor = -total / 2;
  return widths.map((w) => {
    const chip = { x: round(cursor + w / 2), w: round(w) };
    cursor += w + gap;
    return chip;
  });
}

export function laneDirection(lane: number): { x: number; y: number } {
  const a = (LANE_ANGLES[lane % LANE_ANGLES.length] * Math.PI) / 180;
  return { x: Math.cos(a), y: Math.sin(a) };
}

export function lanePoint(lane: number, u: number): { x: number; y: number; z: number } {
  const dir = laneDirection(lane);
  const d = 0.35 + u * (LANE_LENGTH + 0.07);
  return {
    x: round(LANE_ORIGIN.x + dir.x * d),
    y: round(LANE_ORIGIN.y + dir.y * d),
    z: LANE_ORIGIN.z,
  };
}

export function loopPoint(a: number): { x: number; y: number; z: number } {
  return {
    x: round(Math.cos(a) * LOOP.x),
    y: round(LOOP.y + Math.sin(a * 2) * 0.25),
    z: round(LOOP.center + Math.sin(a) * LOOP.z),
  };
}

function edgeFade(u: number, width = 0.08): number {
  return Math.min(1, Math.max(0, (0.5 - Math.abs(u - 0.5)) / width));
}

export function clipPose(formation: FormationKey, index: number, time = 0): ClipPose {
  const i = ((index % CLIP_COUNT) + CLIP_COUNT) % CLIP_COUNT;
  switch (formation) {
    case "track":
      return pose(
        segmentX(i),
        FOOTAGE_Y + 0.02,
        0,
        -90,
        0,
        SEGMENT_W * 0.92,
        TRACK_DEPTH * 0.72,
        1,
      );
    case "split": {
      const lift = 0.3 + (i % 2) * 0.12 + Math.sin(time * 2 + i) * 0.03;
      return pose(
        segmentX(i) * 1.12,
        FOOTAGE_Y + lift,
        0,
        -72,
        (i % 2 ? 1 : -1) * 6,
        SEGMENT_W * 0.86,
        TRACK_DEPTH * 0.66,
        1,
      );
    }
    case "reframe":
      return pose(
        segmentX(i),
        CARD_Y + Math.sin(time * 1.5 + i * 0.6) * 0.05,
        0,
        0,
        0,
        CARD_W,
        CARD_H,
        1,
      );
    case "gate": {
      const u = wrap(i / CLIP_COUNT + time * 0.05);
      return pose(
        GATE_X + (u - 0.5) * GATE_SPAN,
        CARD_Y + Math.sin(time * 2 + i) * 0.03,
        0,
        0,
        0,
        CARD_W,
        CARD_H,
        edgeFade(u),
      );
    }
    case "lanes": {
      const lane = i % NETWORKS.length;
      const slot = Math.floor(i / NETWORKS.length);
      const u = wrap(slot / 3 + time * 0.09 + lane * 0.07);
      const p = lanePoint(lane, u);
      return pose(p.x, p.y + CARD_H * 0.36, p.z, 0, 0, CARD_W, CARD_H, 0.62 * edgeFade(u, 0.12));
    }
    case "bin": {
      const col = i % BIN_COLUMNS;
      const row = Math.floor(i / BIN_COLUMNS);
      return pose(
        (col - (BIN_COLUMNS - 1) / 2) * 0.72,
        0.06,
        BIN_Z + row * 1.05,
        -90,
        0,
        CARD_W,
        CARD_H,
        1,
      );
    }
    case "loop": {
      const a = (i / CLIP_COUNT) * TAU + time * 0.3;
      const p = loopPoint(a);
      const nx = Math.cos(a) / LOOP.x;
      const nz = Math.sin(a) / LOOP.z;
      return pose(p.x, p.y, p.z, 0, degrees(Math.atan2(nx, nz)), CARD_W, CARD_H, 0.8);
    }
  }
}

export function clipPoseAt(progress: number, index: number, time = 0): ClipPose {
  const { from, to, t } = split(progress);
  const a = clipPose(stageFormation(from), index, time);
  const b = clipPose(stageFormation(to), index, time);
  return pose(
    lerp(a.x, b.x, t),
    lerp(a.y, b.y, t),
    lerp(a.z, b.z, t),
    lerp(a.rx, b.rx, t),
    lerp(a.ry, b.ry, t),
    lerp(a.w, b.w, t),
    lerp(a.h, b.h, t),
    lerp(a.scale, b.scale, t),
  );
}

export function timecode(progress: number, fps = 24, secondsPerStage = 3): string {
  const clamped = Math.min(1, Math.max(0, progress));
  const total = Math.round(clamped * LAST_STAGE * secondsPerStage * fps);
  const frames = total % fps;
  const seconds = Math.floor(total / fps) % 60;
  const minutes = Math.floor(total / (fps * 60)) % 60;
  const hours = Math.floor(total / (fps * 3600));
  return [hours, minutes, seconds, frames].map((part) => String(part).padStart(2, "0")).join(":");
}
