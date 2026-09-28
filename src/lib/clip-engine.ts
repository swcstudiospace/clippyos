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
export const FILM_FRAMES = 26;
export const HOOK_EVERY = 4;
export const PISTON_COUNT = 6;
export const ROTOR_HEIGHTS = [1.45, 2.25, 3.05] as const;
export const TRANSMITTER_COUNT = 4;
export const GATE_X = -1.5;
export const GATE_Z = 4.1;
export const GATE_SPAN = 7;

export const NETWORKS = ["X", "YouTube", "Instagram", "TikTok"] as const;
export const PIPELINE_STEPS = ["Ingest", "Detect", "Cut", "Caption + render"] as const;
export const STORAGE_LAYERS = [
  { label: "Cloud storage", detail: "immutable" },
  { label: "Overflow", detail: "optional" },
  { label: "Content pin", detail: "optional" },
] as const;
export const AGENT_LINES = ["MCP tools", "Playbooks", "Isolated skills", "Linear sync"] as const;
export const ENGINE_PARTS = [
  { count: 2, label: "film reels" },
  { count: ROTOR_HEIGHTS.length, label: "render rotors" },
  { count: TRANSMITTER_COUNT, label: "transmitters" },
  { count: CLIP_COUNT, label: "clips" },
] as const;

export type EngineCamera = { rot: number; pitch: number; dist: number; y: number };

export type EngineState = {
  cam: EngineCamera;
  reel: number;
  strip: number;
  stripShow: number;
  hooks: number;
  scanner: number;
  cutter: number;
  rotor: number;
  pistons: number;
  gate: number;
  crown: number;
  vault: number;
  glow: number;
};

export type FormationKey =
  "halo" | "reel" | "cut" | "spiral" | "gate" | "broadcast" | "vault" | "orbit";

export type ClipPose = { x: number; y: number; z: number; rx: number; ry: number; scale: number };

type StageConfig = EngineState & { formation: FormationKey };

const BASE: Omit<StageConfig, "cam" | "formation"> = {
  reel: 0.25,
  strip: 1.2,
  stripShow: 1,
  hooks: 0,
  scanner: 0,
  cutter: 0,
  rotor: 1,
  pistons: 0.4,
  gate: 0,
  crown: 0.4,
  vault: 0,
  glow: 1.2,
};

const STAGES: Record<EngineStageKey, StageConfig> = {
  core: { ...BASE, cam: { rot: 30, pitch: -16, dist: 20.5, y: 2.5 }, formation: "halo" },
  ingest: {
    ...BASE,
    cam: { rot: 0, pitch: -8, dist: 16.5, y: 2.3 },
    reel: 1.4,
    strip: 6,
    rotor: 0.6,
    pistons: 0.3,
    crown: 0,
    glow: 1,
    formation: "reel",
  },
  detect: {
    ...BASE,
    cam: { rot: -28, pitch: -12, dist: 15.5, y: 2.2 },
    reel: 0.8,
    strip: 3,
    hooks: 1,
    scanner: 1,
    rotor: 0.6,
    pistons: 0.3,
    crown: 0,
    glow: 1.4,
    formation: "reel",
  },
  cut: {
    ...BASE,
    cam: { rot: 18, pitch: -13, dist: 17, y: 1.9 },
    reel: 0.6,
    strip: 2.4,
    hooks: 1,
    cutter: 1,
    rotor: 0.8,
    pistons: 0.6,
    crown: 0,
    glow: 1.6,
    formation: "cut",
  },
  render: {
    ...BASE,
    cam: { rot: 70, pitch: -20, dist: 18.5, y: 3 },
    reel: 0.3,
    strip: 1,
    stripShow: 0.6,
    rotor: 4,
    pistons: 1,
    crown: 0.2,
    glow: 2.2,
    formation: "spiral",
  },
  approve: {
    ...BASE,
    cam: { rot: -22, pitch: -11, dist: 19, y: 2.2 },
    reel: 0.2,
    strip: 0.8,
    stripShow: 0.5,
    gate: 1,
    crown: 0.2,
    glow: 1.4,
    formation: "gate",
  },
  publish: {
    ...BASE,
    cam: { rot: 40, pitch: -22, dist: 19, y: 3.8 },
    reel: 0.2,
    strip: 0.6,
    stripShow: 0.4,
    rotor: 1.5,
    pistons: 0.5,
    crown: 1,
    glow: 2,
    formation: "broadcast",
  },
  library: {
    ...BASE,
    cam: { rot: 150, pitch: -28, dist: 18.5, y: 1.8 },
    reel: 0.2,
    strip: 0.5,
    stripShow: 0.4,
    rotor: 0.6,
    pistons: 0.2,
    crown: 0.3,
    vault: 1,
    formation: "vault",
  },
  agent: {
    ...BASE,
    cam: { rot: 215, pitch: -30, dist: 19.5, y: 2.8 },
    reel: 0.5,
    strip: 1.5,
    stripShow: 0.8,
    rotor: 2,
    pistons: 0.8,
    crown: 0.6,
    vault: 0.4,
    glow: 1.8,
    formation: "orbit",
  },
  online: {
    ...BASE,
    cam: { rot: 390, pitch: -16, dist: 20.5, y: 2.5 },
    crown: 0.6,
    glow: 1.6,
    formation: "halo",
  },
};

const NUMERIC_KEYS = [
  "reel",
  "strip",
  "stripShow",
  "hooks",
  "scanner",
  "cutter",
  "rotor",
  "pistons",
  "gate",
  "crown",
  "vault",
  "glow",
] as const satisfies readonly (keyof EngineState)[];

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

export function stageState(stage: number): EngineState {
  const { formation: _formation, ...state } = STAGES[stageKey(stage)];
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
  state.cam = {
    rot: round(lerp(a.cam.rot, b.cam.rot, t)),
    pitch: round(lerp(a.cam.pitch, b.cam.pitch, t)),
    dist: round(lerp(a.cam.dist, b.cam.dist, t)),
    y: round(lerp(a.cam.y, b.cam.y, t)),
  };
  return state;
}

function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function pose(x: number, y: number, z: number, rx: number, ry: number, scale: number): ClipPose {
  return {
    x: round(x),
    y: round(y),
    z: round(z),
    rx: round(rx),
    ry: round(ry),
    scale: round(scale),
  };
}

export function transmitterAngle(index: number): number {
  return 45 + (index % TRANSMITTER_COUNT) * 90;
}

export function clipPose(formation: FormationKey, index: number, time = 0): ClipPose {
  const i = ((index % CLIP_COUNT) + CLIP_COUNT) % CLIP_COUNT;
  switch (formation) {
    case "halo": {
      const a = (i / CLIP_COUNT) * TAU + time * 0.25;
      return pose(
        Math.sin(a) * 3.4,
        2.4 + Math.sin(3 * a) * 0.18,
        Math.cos(a) * 3.4,
        0,
        degrees(a),
        1,
      );
    }
    case "reel":
      return pose(-2.7, 3.05, -0.2, 0, 0, 0);
    case "cut":
      return pose(
        (i - (CLIP_COUNT - 1) / 2) * 0.4,
        0.42 + Math.sin(time * 2 + i) * 0.04,
        3.7,
        -18,
        0,
        0.62,
      );
    case "spiral": {
      const a = (i / CLIP_COUNT) * TAU * 1.5 + time * 0.9;
      const r = 2.05;
      return pose(
        Math.sin(a) * r,
        1.1 + (i / (CLIP_COUNT - 1)) * 3.1,
        Math.cos(a) * r,
        0,
        degrees(a),
        0.85,
      );
    }
    case "gate": {
      const u = (i / CLIP_COUNT + time * 0.06) % 1;
      const fade = Math.min(1, (0.5 - Math.abs(u - 0.5)) / 0.08);
      return pose(
        GATE_X + (u - 0.5) * GATE_SPAN,
        1.9 + Math.sin(time * 2 + i) * 0.03,
        GATE_Z,
        0,
        0,
        0.9 * fade,
      );
    }
    case "broadcast": {
      const k = i % TRANSMITTER_COUNT;
      const j = Math.floor(i / TRANSMITTER_COUNT);
      const a = (transmitterAngle(k) * Math.PI) / 180;
      const spin = time * 0.8 + (j * TAU) / 3;
      const r = 2.5 + Math.cos(spin) * 0.35;
      return pose(
        Math.sin(a) * r,
        4.7 + j * 0.42 + Math.sin(spin) * 0.12,
        Math.cos(a) * r,
        0,
        transmitterAngle(k),
        0.72,
      );
    }
    case "vault":
      return pose(0, 0.42 + i * 0.09, -3.3, -90, i * 7, 1.05);
    case "orbit": {
      const a = (i / CLIP_COUNT) * TAU + time * 0.6;
      const tilt = (28 * Math.PI) / 180;
      const r = 3.1;
      const flat = Math.cos(a) * r;
      return pose(
        Math.sin(a) * r,
        2.7 + flat * Math.sin(tilt),
        flat * Math.cos(tilt),
        0,
        degrees(a),
        0.8,
      );
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
    lerp(a.scale, b.scale, t),
  );
}

export function isHookFrame(index: number): boolean {
  return index % HOOK_EVERY === 1;
}

export function hookNetwork(clip: number): (typeof NETWORKS)[number] {
  return NETWORKS[clip % NETWORKS.length];
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
