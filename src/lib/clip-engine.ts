export const ENGINE_STAGES = [
  { key: "core", mode: "Engine", live: true },
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
export const CLIP_COUNT = 4;
export const FRAMES_PER_CLIP = 3;
export const FRAME_COUNT = CLIP_COUNT * FRAMES_PER_CLIP;
export const HOOK_SLOT = 1;
export const SPIN_STAGES: readonly EngineStageKey[] = ["core", "agent", "online"];

export const NETWORKS = ["X", "YouTube", "Instagram", "TikTok"] as const;
export const PIPELINE_STEPS = ["Ingest", "Detect", "Cut", "Caption + render"] as const;
export const STORAGE_LAYERS = [
  { label: "Cloud storage", detail: "immutable" },
  { label: "Overflow", detail: "optional" },
  { label: "Content pin", detail: "optional" },
] as const;
export const AGENT_LINES = ["MCP tools", "Playbooks", "Isolated skills", "Linear sync"] as const;

export type FramePose = {
  x: number;
  y: number;
  z: number;
  ry: number;
  rx: number;
  w: number;
  h: number;
  sp: number;
  hot: number;
  cap: number;
  pub: number;
};

export type RigPose = {
  rx: number;
  ry: number;
  zoom: number;
  core: number;
};

export type EngineFrame = {
  index: number;
  clip: number;
  slot: number;
  hook: boolean;
  poses: FramePose[];
};

const LAND = { w: 100, h: 56 };
const VERT = { w: 72, h: 128 };
const ORBIT = { w: 54, h: 96 };
const PLATTER = { w: 150, h: 84 };
const CUT = { w: 84, h: 47 };
const RING_RADIUS = 250;
const ORBIT_RADIUS = 200;
const ARC_RADIUS = 420;
const ARC_STEP = 38;
const PUBLISH_DROP = 44;
const STRIP_GAP = 106;
const CUT_STEP = 88;
const STRIP_SHIFT = -140;
const CUT_SHIFT = -40;
const CLIP_GAP = 360;
const CARD_GAP = 150;
const STACK_DEPTH = 16;
const PLATTER_STEP = 12;

export const BLADE_X = [-3, 0, 3].map((step) => step * STRIP_GAP + STRIP_SHIFT);
export const SCAN_RANGE = [
  -(FRAME_COUNT / 2) * STRIP_GAP + STRIP_SHIFT,
  (FRAME_COUNT / 2) * STRIP_GAP + STRIP_SHIFT,
] as const;

const RIG: Record<EngineStageKey, RigPose> = {
  core: { rx: -14, ry: 0, zoom: 1, core: 1 },
  ingest: { rx: -10, ry: -34, zoom: 0.72, core: 0 },
  detect: { rx: -12, ry: -24, zoom: 0.76, core: 0 },
  cut: { rx: -8, ry: -6, zoom: 0.6, core: 0 },
  render: { rx: -6, ry: -20, zoom: 1.05, core: 0 },
  approve: { rx: -4, ry: 0, zoom: 1.12, core: 0 },
  publish: { rx: -8, ry: 0, zoom: 0.94, core: 0 },
  library: { rx: -30, ry: 32, zoom: 1.08, core: 0 },
  agent: { rx: -34, ry: 18, zoom: 0.88, core: 0.8 },
  online: { rx: -14, ry: 0, zoom: 1.06, core: 1 },
};

function round(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return rounded === 0 ? 0 : rounded;
}

function sin(degrees: number): number {
  return Math.sin((degrees * Math.PI) / 180);
}

function cos(degrees: number): number {
  return Math.cos((degrees * Math.PI) / 180);
}

function stageKey(stage: number): EngineStageKey {
  const clamped = Math.min(LAST_STAGE, Math.max(0, Math.round(stage)));
  return ENGINE_STAGES[clamped].key;
}

function pose(values: Partial<FramePose>): FramePose {
  const full: FramePose = {
    x: 0,
    y: 0,
    z: 0,
    ry: 0,
    rx: 0,
    ...LAND,
    sp: 0,
    hot: 0,
    cap: 0,
    pub: 0,
    ...values,
  };
  return {
    x: round(full.x),
    y: round(full.y),
    z: round(full.z),
    ry: round(full.ry),
    rx: round(full.rx),
    w: round(full.w),
    h: round(full.h),
    sp: round(full.sp),
    hot: round(full.hot),
    cap: round(full.cap),
    pub: round(full.pub),
  };
}

export function stageIndex(key: EngineStageKey): number {
  return ENGINE_STAGES.findIndex((stage) => stage.key === key);
}

export function frameClip(index: number): number {
  return Math.floor(index / FRAMES_PER_CLIP);
}

export function frameSlot(index: number): number {
  return index % FRAMES_PER_CLIP;
}

export function isHook(index: number): boolean {
  return frameSlot(index) === HOOK_SLOT;
}

export function ringAngle(index: number): number {
  return (index - (FRAME_COUNT - 1) / 2) * (360 / FRAME_COUNT);
}

function stackDepth(slot: number): number {
  if (slot === HOOK_SLOT) return 0;
  return slot < HOOK_SLOT ? -STACK_DEPTH : -STACK_DEPTH * 2;
}

export function framePose(index: number, stage: number): FramePose {
  const clip = frameClip(index);
  const slot = frameSlot(index);
  const hook = slot === HOOK_SLOT;
  const angle = ringAngle(index);
  const strip = (index - (FRAME_COUNT - 1) / 2) * STRIP_GAP + STRIP_SHIFT;
  const lane = clip - (CLIP_COUNT - 1) / 2;
  const depth = stackDepth(slot);

  switch (stageKey(stage)) {
    case "core":
    case "online":
      return pose({ x: RING_RADIUS * sin(angle), z: RING_RADIUS * cos(angle), ry: angle });
    case "ingest":
      return pose({ x: strip, sp: 1 });
    case "detect":
      return pose({ x: strip, y: hook ? -18 : 0, z: hook ? 36 : 0, sp: 1, hot: hook ? 1 : 0 });
    case "cut":
      return pose({
        x: lane * CLIP_GAP + (slot - HOOK_SLOT) * CUT_STEP + CUT_SHIFT,
        y: hook ? -10 : 0,
        z: hook ? 20 : 0,
        ...CUT,
        sp: 1,
        hot: hook ? 1 : 0,
      });
    case "render":
      return pose({ x: lane * CARD_GAP, z: depth, ...VERT, cap: hook ? 1 : 0 });
    case "approve":
      return pose({ x: lane * CARD_GAP, z: 30 + depth, ...VERT, cap: hook ? 1 : 0 });
    case "publish": {
      const theta = lane * ARC_STEP;
      return pose({
        x: ARC_RADIUS * sin(theta),
        y: PUBLISH_DROP + (clip % 2 === 0 ? -18 : 18),
        z: ARC_RADIUS * cos(theta) - ARC_RADIUS + depth,
        ry: -theta * 0.6,
        ...VERT,
        cap: hook ? 1 : 0,
        pub: hook ? 1 : 0,
      });
    }
    case "library":
      return pose({ y: 96 - index * PLATTER_STEP, rx: 90, ...PLATTER });
    case "agent":
      return pose({
        x: ORBIT_RADIUS * sin(angle),
        z: ORBIT_RADIUS * cos(angle),
        ry: angle,
        ...ORBIT,
      });
  }
}

export function rigPose(stage: number): RigPose {
  return RIG[stageKey(stage)];
}

export function engineFrames(): EngineFrame[] {
  return Array.from({ length: FRAME_COUNT }, (_, index) => ({
    index,
    clip: frameClip(index),
    slot: frameSlot(index),
    hook: isHook(index),
    poses: ENGINE_STAGES.map((_, stage) => framePose(index, stage)),
  }));
}

export function hookNetwork(clip: number): (typeof NETWORKS)[number] {
  return NETWORKS[clip % NETWORKS.length];
}

export function spinsAt(stage: number): boolean {
  return SPIN_STAGES.includes(stageKey(stage));
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
