import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import {
  BIN_COLUMNS,
  BIN_Z,
  CAPTION_WORDS,
  CARD_Y,
  CLIP_COUNT,
  FOOTAGE_Y,
  GATE_X,
  LANE_LENGTH,
  LANE_ORIGIN,
  NETWORKS,
  RULER_SECONDS,
  RULER_Y,
  SEGMENT_W,
  TIMELINE_LENGTH,
  TRACKS,
  TRACK_DEPTH,
  WAVE_BARS,
  captionChips,
  clipApproved,
  clipPoseAt,
  engineStateAt,
  hookX,
  laneDirection,
  loopPoint,
  segmentX,
  waveAmplitude,
} from "@/lib/clip-engine";

export type EngineTheme = "dark" | "light";

export type EngineView = {
  progress: number;
  assembly: number;
  px: number;
  py: number;
  pulse: number;
};

export type EngineHandle = {
  view: EngineView;
  setTheme: (theme: EngineTheme) => void;
  renderOnce: () => void;
  dispose: () => void;
};

type Tone = "line" | "dim" | "hot";

type Palette = Record<Tone, string> & {
  face: string;
  fog: string;
  additive: boolean;
  lineAlpha: number;
  haloAlpha: number;
  faceAlpha: number;
  labelAlpha: number;
};

const PALETTES: Record<EngineTheme, Palette> = {
  dark: {
    line: "#34d399",
    dim: "#0f6b52",
    hot: "#b4f5d9",
    face: "#10b981",
    fog: "#050a08",
    additive: true,
    lineAlpha: 0.95,
    haloAlpha: 0.18,
    faceAlpha: 0.2,
    labelAlpha: 0.9,
  },
  light: {
    line: "#0f766e",
    dim: "#8fcdb5",
    hot: "#059669",
    face: "#10b981",
    fog: "#f3faf6",
    additive: false,
    lineAlpha: 0.9,
    haloAlpha: 0.1,
    faceAlpha: 0.1,
    labelAlpha: 0.95,
  },
};

type Layer = {
  tone: Tone;
  core: LineMaterial;
  halo: LineMaterial;
  glow: number;
  vis: number;
};

type Holo = {
  geometry: LineSegmentsGeometry;
  count: number;
  from: number;
  to: number;
};

type Label = {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  texture: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
  text: string;
  size: number;
  layer: Layer;
};

type Segs = number[];

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const HALF = TIMELINE_LENGTH / 2;
const PLATE_X0 = -HALF - 0.2;
const PLATE_X1 = HALF + 0.2;
const HEADER_X0 = -HALF - 1;
const HEADER_X1 = -HALF - 0.35;
const HALF_DEPTH = TRACK_DEPTH / 2;
const FRONT = HALF_DEPTH + 0.05;
const DECK = { x0: -6.4, x1: 6.2, z0: -1.5, z1: 3.55 };
const SRC = { x: -5.9, size: 0.62 };
const INGEST_PARTICLES = 18;
const JOG = { x: 4.1, z: 1.9 };
const LOOP_PULSES = 3;
const FONT = '600 44px "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSweep;
  uniform float uTime;
  uniform float uEdge;
  uniform float uFade;
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vec2 d = abs(vUv - 0.5) * 2.0;
    float edge = smoothstep(0.78, 1.0, max(d.x, d.y));
    float scan = 0.55 + 0.45 * step(1.5, mod(gl_FragCoord.y, 3.0));
    float band = exp(-pow((vWorld.x - uSweep) * 2.4, 2.0));
    float drift = 0.5 + 0.5 * sin(vWorld.x * 1.4 + vWorld.z * 2.1 - uTime * 1.3);
    float fade = mix(1.0, 1.0 - vUv.y, uFade);
    float alpha = uOpacity * (0.16 + 0.12 * drift + edge * uEdge + band * 0.85) * scan * fade;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

function seg(value: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (value - start) / (end - start)));
}

function wrap(value: number): number {
  return ((value % 1) + 1) % 1;
}

function line(s: Segs, ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
  s.push(ax, ay, az, bx, by, bz);
}

function rectXZ(s: Segs, x0: number, x1: number, y: number, z0: number, z1: number) {
  line(s, x0, y, z0, x1, y, z0);
  line(s, x1, y, z0, x1, y, z1);
  line(s, x1, y, z1, x0, y, z1);
  line(s, x0, y, z1, x0, y, z0);
}

function rectXY(s: Segs, x0: number, x1: number, y0: number, y1: number, z: number) {
  line(s, x0, y0, z, x1, y0, z);
  line(s, x1, y0, z, x1, y1, z);
  line(s, x1, y1, z, x0, y1, z);
  line(s, x0, y1, z, x0, y0, z);
}

function rectYZ(s: Segs, x: number, y0: number, y1: number, z0: number, z1: number) {
  line(s, x, y0, z0, x, y1, z0);
  line(s, x, y1, z0, x, y1, z1);
  line(s, x, y1, z1, x, y0, z1);
  line(s, x, y0, z1, x, y0, z0);
}

function bracketsXZ(
  s: Segs,
  x0: number,
  x1: number,
  y: number,
  z0: number,
  z1: number,
  size: number,
) {
  const corners: [number, number, number, number][] = [
    [x0, z0, 1, 1],
    [x1, z0, -1, 1],
    [x1, z1, -1, -1],
    [x0, z1, 1, -1],
  ];
  corners.forEach(([x, z, dx, dz]) => {
    line(s, x, y, z, x + dx * size, y, z);
    line(s, x, y, z, x, y, z + dz * size);
  });
}

function box(s: Segs, cx: number, cy: number, cz: number, size: number) {
  const h = size / 2;
  rectXZ(s, cx - h, cx + h, cy - h, cz - h, cz + h);
  rectXZ(s, cx - h, cx + h, cy + h, cz - h, cz + h);
  [
    [-h, -h],
    [h, -h],
    [h, h],
    [-h, h],
  ].forEach(([dx, dz]) => line(s, cx + dx, cy - h, cz + dz, cx + dx, cy + h, cz + dz));
}

function glowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createClipEngine(
  host: HTMLElement,
  options: { theme: EngineTheme; reduced: boolean; view: EngineView },
): EngineHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const view = options.view;
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(PALETTES[options.theme].fog, 16, 40);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 140);
  const target = new THREE.Vector3();

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const keep = <T extends THREE.BufferGeometry>(geometry: T): T => {
    geometries.push(geometry);
    return geometry;
  };

  const layers: Layer[] = [];
  const layer = (tone: Tone, width = 1.35, glow = 5): Layer => {
    const core = new LineMaterial({
      linewidth: width,
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    const halo = new LineMaterial({
      linewidth: glow,
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    materials.push(core, halo);
    const entry = { tone, core, halo, glow, vis: 1 };
    layers.push(entry);
    return entry;
  };

  const L = {
    frame: layer("line"),
    grid: layer("dim", 1, 0),
    wave: layer("line", 1.6, 4),
    waveHot: layer("line", 2, 7),
    hooks: layer("hot", 1.5, 7),
    razor: layer("hot", 1.6, 8),
    chips: layer("line", 1.2, 4),
    caret: layer("hot", 2, 8),
    tether: layer("line", 1, 3),
    jog: layer("line", 1.3, 5),
    jogHot: layer("hot", 2, 8),
    ingest: layer("hot", 1.6, 7),
    gate: layer("line", 1.5, 6),
    laser: layer("hot", 2.2, 10),
    lanes: layer("line", 1.4, 5),
    bin: layer("line", 1.2, 4),
    loop: layer("line", 1.5, 6),
    playhead: layer("hot", 2, 10),
    clip: layer("line", 1.5, 6),
    clipHot: layer("hot", 1.8, 9),
    clipGhost: layer("dim", 1, 0),
    check: layer("hot", 2, 8),
  };

  const sweep = { value: 0 };
  const clock = { value: 0 };
  const faces: { material: THREE.ShaderMaterial; tone: "face" | "hot"; alpha: number }[] = [];
  const faceMaterial = (tone: "face" | "hot", alpha: number, edge = 0.7, fade = 0) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color() },
        uOpacity: { value: 0 },
        uSweep: sweep,
        uTime: clock,
        uEdge: { value: edge },
        uFade: { value: fade },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    materials.push(material);
    faces.push({ material, tone, alpha });
    return material;
  };

  const faceMat = {
    plate: faceMaterial("face", 1),
    deck: faceMaterial("face", 0.35, 0.3),
    sheet: faceMaterial("hot", 0.9, 0.2, 1),
    clip: faceMaterial("face", 1.3),
    clipHot: faceMaterial("hot", 1.2),
    gate: faceMaterial("face", 0.7),
    lanes: faceMaterial("face", 0.6),
  };

  const holos: Holo[] = [];
  const holo = (
    segs: Segs,
    target: Layer,
    parent: THREE.Object3D,
    from = 0,
    to = 1,
  ): { geometry: LineSegmentsGeometry; core: LineSegments2; halo: LineSegments2 } => {
    const geometry = keep(new LineSegmentsGeometry());
    geometry.setPositions(segs);
    const core = new LineSegments2(geometry, target.core);
    const halo = new LineSegments2(geometry, target.halo);
    core.frustumCulled = false;
    halo.frustumCulled = false;
    parent.add(halo, core);
    holos.push({ geometry, count: segs.length / 6, from, to });
    return { geometry, core, halo };
  };

  const glowMap = glowTexture();
  textures.push(glowMap);
  const sprites: { material: THREE.SpriteMaterial; tone: Tone }[] = [];
  const glowSprite = (tone: Tone, size: number, parent: THREE.Object3D) => {
    const material = new THREE.SpriteMaterial({
      map: glowMap,
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    materials.push(material);
    sprites.push({ material, tone });
    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(size);
    parent.add(sprite);
    return sprite;
  };

  const labels: Label[] = [];
  const drawLabel = (label: Label) => {
    const ctx = label.canvas.getContext("2d");
    if (!ctx) return;
    ctx.font = FONT;
    const width = Math.ceil(ctx.measureText(label.text).width) + 24;
    label.canvas.width = width;
    label.canvas.height = 64;
    ctx.font = FONT;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(label.text, 12, 34);
    label.texture.needsUpdate = true;
    label.sprite.scale.set((label.size * width) / 64, label.size, 1);
  };
  const addLabel = (
    text: string,
    position: [number, number, number],
    parent: THREE.Object3D,
    target: Layer,
    size = 0.26,
  ) => {
    const canvas = document.createElement("canvas");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    textures.push(texture);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    materials.push(material);
    const sprite = new THREE.Sprite(material);
    sprite.position.set(position[0], position[1], position[2]);
    parent.add(sprite);
    const label = { sprite, material, texture, canvas, text, size, layer: target };
    labels.push(label);
    drawLabel(label);
    return label;
  };

  const root = new THREE.Group();
  scene.add(root);

  const grid = new THREE.GridHelper(48, 96);
  const gridMaterial = grid.material as THREE.LineBasicMaterial;
  gridMaterial.transparent = true;
  gridMaterial.depthWrite = false;
  gridMaterial.vertexColors = false;
  grid.position.y = -0.01;
  keep(grid.geometry);
  root.add(grid);

  const deck = new THREE.Group();
  const deckSegs: Segs = [];
  rectXZ(deckSegs, DECK.x0, DECK.x1, 0, DECK.z0, DECK.z1);
  const deckGrid: Segs = [];
  for (let x = Math.ceil(DECK.x0 * 2) / 2; x <= DECK.x1; x += 0.5) {
    line(deckGrid, x, 0, DECK.z0, x, 0, DECK.z1);
  }
  for (let z = Math.ceil(DECK.z0 * 2) / 2; z <= DECK.z1; z += 0.5) {
    line(deckGrid, DECK.x0, 0, z, DECK.x1, 0, z);
  }
  for (let x = DECK.x0 + 0.25; x < DECK.x1; x += 0.25) {
    const major = Math.abs((x * 4) % 4) < 0.01;
    line(deckSegs, x, 0, DECK.z1, x, 0, DECK.z1 - (major ? 0.22 : 0.1));
  }
  bracketsXZ(deckSegs, DECK.x0 - 0.18, DECK.x1 + 0.18, 0, DECK.z0 - 0.18, DECK.z1 + 0.18, 0.5);
  holo(deckGrid, L.grid, deck, 0, 0.3);
  holo(deckSegs, L.frame, deck, 0, 0.25);
  const deckFace = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(DECK.x1 - DECK.x0, DECK.z1 - DECK.z0)),
    faceMat.deck,
  );
  deckFace.rotation.x = -Math.PI / 2;
  deckFace.position.set((DECK.x0 + DECK.x1) / 2, 0, (DECK.z0 + DECK.z1) / 2);
  deck.add(deckFace);
  root.add(deck);

  const stack = new THREE.Group();
  const pillars: Segs = [];
  [PLATE_X0, PLATE_X1].forEach((x) =>
    [-HALF_DEPTH, HALF_DEPTH].forEach((z) => line(pillars, x, 0, z, x, RULER_Y + 0.2, z)),
  );
  [HEADER_X0].forEach((x) =>
    [-HALF_DEPTH, HALF_DEPTH].forEach((z) => line(pillars, x, 0, z, x, RULER_Y, z)),
  );
  holo(pillars, L.grid, stack, 0.05, 0.35);

  const levels = [
    ...TRACKS.map((track) => ({ key: track.key, y: track.y })),
    { key: "TC", y: RULER_Y },
  ];
  levels.forEach((level, index) => {
    const segs: Segs = [];
    rectXZ(segs, PLATE_X0, PLATE_X1, level.y, -HALF_DEPTH, HALF_DEPTH);
    rectXZ(segs, HEADER_X0, HEADER_X1, level.y, -HALF_DEPTH, HALF_DEPTH);
    bracketsXZ(
      segs,
      PLATE_X0 - 0.12,
      PLATE_X1 + 0.12,
      level.y,
      -HALF_DEPTH - 0.12,
      HALF_DEPTH + 0.12,
      0.28,
    );
    const start = 0.12 + index * 0.1;
    holo(segs, L.frame, stack, start, start + 0.3);
    const face = new THREE.Mesh(
      keep(new THREE.PlaneGeometry(PLATE_X1 - PLATE_X0, TRACK_DEPTH)),
      faceMat.plate,
    );
    face.rotation.x = -Math.PI / 2;
    face.position.set(0, level.y, 0);
    stack.add(face);
    addLabel(level.key, [(HEADER_X0 + HEADER_X1) / 2, level.y + 0.16, 0], stack, L.frame, 0.3);
  });

  const ruler: Segs = [];
  for (let k = 0; k <= TIMELINE_LENGTH * 4; k++) {
    const x = -HALF + k * 0.25;
    const major = k % 4 === 0;
    line(ruler, x, RULER_Y, HALF_DEPTH, x, RULER_Y, HALF_DEPTH - (major ? 0.32 : 0.14));
  }
  holo(ruler, L.frame, stack, 0.45, 0.7);
  for (let k = 0; k <= TIMELINE_LENGTH; k++) {
    const seconds = Math.round((k * RULER_SECONDS) / TIMELINE_LENGTH);
    addLabel(
      `00:${String(seconds).padStart(2, "0")}`,
      [-HALF + k, RULER_Y + 0.17, HALF_DEPTH - 0.18],
      stack,
      L.grid,
      0.17,
    );
  }
  root.add(stack);

  const waveXs = Array.from(
    { length: WAVE_BARS },
    (_, i) => -HALF + ((i + 0.5) / WAVE_BARS) * TIMELINE_LENGTH,
  );
  const nearHook = (x: number) =>
    Array.from({ length: CLIP_COUNT }, (_, i) => Math.abs(x - hookX(i))).some((d) => d < 0.13);
  const waveGroups = [false, true].map((hot) => {
    const xs = waveXs.filter((x) => nearHook(x) === hot);
    const segs: Segs = [];
    xs.forEach((x) => line(segs, x, TRACKS[0].y, 0, x, TRACKS[0].y, 0));
    const lines = holo(segs, hot ? L.waveHot : L.wave, stack, 0.5, 0.8);
    return { xs, geometry: lines.geometry };
  });

  const hookSegs: Segs = [];
  for (let i = 0; i < CLIP_COUNT; i++) {
    const x = hookX(i);
    const y = TRACKS[0].y + 0.78;
    line(hookSegs, x, y + 0.1, 0, x + 0.07, y, 0);
    line(hookSegs, x + 0.07, y, 0, x, y - 0.1, 0);
    line(hookSegs, x, y - 0.1, 0, x - 0.07, y, 0);
    line(hookSegs, x - 0.07, y, 0, x, y + 0.1, 0);
    for (let d = 0; d < 3; d++) {
      const y0 = y + 0.16 + d * 0.16;
      line(hookSegs, x, y0, 0, x, Math.min(FOOTAGE_Y - 0.03, y0 + 0.08), 0);
    }
  }
  const hookMarks = new THREE.Group();
  holo(hookSegs, L.hooks, hookMarks);
  stack.add(hookMarks);

  const razorSegs: Segs = [];
  for (let b = 0; b <= CLIP_COUNT; b++) {
    const x = -HALF + b * SEGMENT_W;
    line(razorSegs, x, FOOTAGE_Y - 0.28, FRONT, x, FOOTAGE_Y + 0.62, FRONT);
    line(razorSegs, x, FOOTAGE_Y + 0.005, -HALF_DEPTH, x, FOOTAGE_Y + 0.005, HALF_DEPTH);
    line(razorSegs, x - 0.07, FOOTAGE_Y + 0.62, FRONT, x + 0.07, FOOTAGE_Y + 0.72, FRONT);
    line(razorSegs, x + 0.07, FOOTAGE_Y + 0.62, FRONT, x - 0.07, FOOTAGE_Y + 0.72, FRONT);
  }
  holo(razorSegs, L.razor, stack);

  const chips = captionChips();
  const captionY = TRACKS[2].y + 0.01;
  const chipSegs: Segs = [];
  chips.forEach((chip) =>
    rectXZ(chipSegs, chip.x - chip.w / 2, chip.x + chip.w / 2, captionY, -0.17, 0.17),
  );
  holo(chipSegs, L.chips, stack, 0.55, 0.85);
  const caret = new THREE.Group();
  const caretSegs: Segs = [];
  rectXZ(caretSegs, -0.5, 0.5, 0, -0.5, 0.5);
  line(caretSegs, -0.5, 0, 0.72, 0.5, 0, 0.72);
  holo(caretSegs, L.caret, caret);
  caret.position.y = captionY + 0.01;
  stack.add(caret);

  const src = new THREE.Group();
  src.position.set(SRC.x, FOOTAGE_Y, 0);
  const srcSegs: Segs = [];
  box(srcSegs, 0, 0, 0, SRC.size);
  rectXZ(srcSegs, -0.2, 0.2, -SRC.size / 2 - 0.12, -0.2, 0.2);
  holo(srcSegs, L.frame, src, 0.3, 0.55);
  const chevron: Segs = [];
  [-0.12, 0.04].forEach((dx) => {
    line(chevron, dx, 0.14, SRC.size / 2 + 0.01, dx + 0.12, 0, SRC.size / 2 + 0.01);
    line(chevron, dx + 0.12, 0, SRC.size / 2 + 0.01, dx, -0.14, SRC.size / 2 + 0.01);
  });
  holo(chevron, L.ingest, src);
  addLabel("SRC", [0, SRC.size / 2 + 0.24, 0], src, L.frame, 0.24);
  root.add(src);
  const ingestParticles = Array.from({ length: INGEST_PARTICLES }, () =>
    glowSprite("hot", 0.2, root),
  );

  const playhead = new THREE.Group();
  const phSegs: Segs = [];
  line(phSegs, 0, 0, FRONT, 0, RULER_Y + 0.12, FRONT);
  const headY = RULER_Y + 0.12;
  line(phSegs, -0.2, headY + 0.36, FRONT, 0.2, headY + 0.36, FRONT);
  line(phSegs, 0.2, headY + 0.36, FRONT, 0, headY, FRONT);
  line(phSegs, 0, headY, FRONT, -0.2, headY + 0.36, FRONT);
  rectXY(phSegs, -0.2, 0.2, headY + 0.36, headY + 0.52, FRONT);
  line(phSegs, 0, RULER_Y, -HALF_DEPTH, 0, RULER_Y, HALF_DEPTH);
  holo(phSegs, L.playhead, playhead, 0.6, 0.85);
  const sheet = new THREE.Mesh(keep(new THREE.PlaneGeometry(TRACK_DEPTH, RULER_Y)), faceMat.sheet);
  sheet.rotation.y = Math.PI / 2;
  sheet.position.set(0, RULER_Y / 2, 0);
  playhead.add(sheet);
  const headGlow = glowSprite("hot", 0.9, playhead);
  headGlow.position.set(0, headY + 0.2, FRONT);
  const spark = glowSprite("hot", 1.1, playhead);
  spark.position.set(0, FOOTAGE_Y + 0.1, FRONT);
  stack.add(playhead);

  const tetherSegs: Segs = [];
  for (let i = 0; i < CLIP_COUNT; i++) line(tetherSegs, 0, 0, 0, 0, 0, 0);
  const tethers = holo(tetherSegs, L.tether, root);

  const gate = new THREE.Group();
  gate.position.set(GATE_X, 0, 0);
  const gateSegs: Segs = [];
  const gy0 = CARD_Y - 0.72;
  const gy1 = CARD_Y + 0.72;
  rectYZ(gateSegs, 0, gy0, gy1, -0.52, 0.52);
  rectYZ(gateSegs, 0, gy0 - 0.08, gy1 + 0.08, -0.6, 0.6);
  [-0.52, 0.52].forEach((z) => line(gateSegs, 0, RULER_Y, z, 0, gy0 - 0.08, z));
  [
    [gy1 + 0.2, 1],
    [gy0 - 0.2, -1],
  ].forEach(([y, dir]) => {
    line(gateSegs, 0, y, -0.72, 0, y, -0.4);
    line(gateSegs, 0, y, 0.4, 0, y, 0.72);
    line(gateSegs, 0, y, -0.72, 0, y - dir * 0.18, -0.72);
    line(gateSegs, 0, y, 0.72, 0, y - dir * 0.18, 0.72);
  });
  holo(gateSegs, L.gate, gate);
  const gateFace = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.04, 1.44)), faceMat.gate);
  gateFace.rotation.y = Math.PI / 2;
  gateFace.position.y = CARD_Y;
  gate.add(gateFace);
  const laser = new THREE.Group();
  const laserSegs: Segs = [];
  line(laserSegs, 0, 0, -0.62, 0, 0, 0.62);
  holo(laserSegs, L.laser, laser);
  gate.add(laser);
  addLabel("REVIEW", [0, gy1 + 0.42, 0], gate, L.gate, 0.24);
  root.add(gate);

  const lanes = new THREE.Group();
  const laneSegs: Segs = [];
  NETWORKS.forEach((network, k) => {
    const dir = laneDirection(k);
    const at = (d: number) => ({
      x: LANE_ORIGIN.x + dir.x * d,
      y: LANE_ORIGIN.y + dir.y * d,
    });
    const a = at(0.35);
    const b = at(LANE_LENGTH);
    [-0.3, 0.3].forEach((z) => line(laneSegs, a.x, a.y, z, b.x, b.y, z));
    for (let d = 0.5; d < LANE_LENGTH; d += 0.5) {
      const p = at(d);
      line(laneSegs, p.x, p.y, -0.3, p.x, p.y, 0.3);
    }
    const e = at(LANE_LENGTH + 0.42);
    const py = e.y + 0.32;
    rectXY(laneSegs, e.x - 0.27, e.x + 0.27, py - 0.48, py + 0.48, 0);
    rectXY(laneSegs, e.x - 0.33, e.x + 0.33, py - 0.54, py + 0.54, 0);
    line(laneSegs, e.x - 0.08, py + 0.42, 0, e.x + 0.08, py + 0.42, 0);
    line(laneSegs, e.x - 0.1, py - 0.44, 0, e.x + 0.1, py - 0.44, 0);
    addLabel(network, [e.x, py + 0.78, 0], lanes, L.lanes, 0.24);
    const face = new THREE.Mesh(
      keep(new THREE.PlaneGeometry(LANE_LENGTH - 0.35, 0.6)),
      faceMat.lanes,
    );
    const mid = at((LANE_LENGTH + 0.35) / 2);
    face.matrixAutoUpdate = false;
    face.matrix.makeBasis(
      new THREE.Vector3(dir.x, dir.y, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(dir.y, -dir.x, 0),
    );
    face.matrix.setPosition(mid.x, mid.y, 0);
    lanes.add(face);
  });
  rectXY(
    laneSegs,
    LANE_ORIGIN.x - 0.18,
    LANE_ORIGIN.x + 0.18,
    LANE_ORIGIN.y - 0.18,
    LANE_ORIGIN.y + 0.18,
    0,
  );
  holo(laneSegs, L.lanes, lanes);
  root.add(lanes);

  const bin = new THREE.Group();
  const binSegs: Segs = [];
  const binX = ((BIN_COLUMNS - 1) / 2) * 0.72 + 0.45;
  rectXZ(binSegs, -binX, binX, 0.02, BIN_Z - 0.62, BIN_Z + 1.05 + 0.62);
  bracketsXZ(binSegs, -binX - 0.12, binX + 0.12, 0.02, BIN_Z - 0.74, BIN_Z + 1.79, 0.3);
  for (let i = 0; i < CLIP_COUNT; i++) {
    const col = i % BIN_COLUMNS;
    const row = Math.floor(i / BIN_COLUMNS);
    const x = (col - (BIN_COLUMNS - 1) / 2) * 0.72;
    const z = BIN_Z + row * 1.05;
    rectXZ(binSegs, x - 0.3, x + 0.3, 0.02, z - 0.49, z + 0.49);
  }
  holo(binSegs, L.bin, bin);
  addLabel("BIN", [-binX - 0.45, 0.22, BIN_Z - 0.4], bin, L.bin, 0.26);
  root.add(bin);

  const loop = new THREE.Group();
  const loopSegs: Segs = [];
  const LOOP_STEPS = 128;
  for (let k = 0; k < LOOP_STEPS; k++) {
    const a = loopPoint((k / LOOP_STEPS) * TAU);
    const b = loopPoint(((k + 1) / LOOP_STEPS) * TAU);
    line(loopSegs, a.x, a.y, a.z, b.x, b.y, b.z);
  }
  holo(loopSegs, L.loop, loop);
  const pulses = Array.from({ length: LOOP_PULSES }, () => glowSprite("hot", 0.7, loop));
  const hermes = loopPoint(-Math.PI / 2);
  addLabel("HERMES", [hermes.x, hermes.y + 0.4, hermes.z], loop, L.loop, 0.26);
  root.add(loop);

  const jog = new THREE.Group();
  jog.position.set(JOG.x, 0.03, JOG.z);
  const ring = (segs: Segs, radius: number, steps: number) => {
    for (let k = 0; k < steps; k++) {
      const a0 = (k / steps) * TAU;
      const a1 = ((k + 1) / steps) * TAU;
      line(
        segs,
        Math.cos(a0) * radius,
        0,
        Math.sin(a0) * radius,
        Math.cos(a1) * radius,
        0,
        Math.sin(a1) * radius,
      );
    }
  };
  const jogBase: Segs = [];
  ring(jogBase, 1.08, 72);
  ring(jogBase, 0.24, 24);
  holo(jogBase, L.jog, jog, 0.3, 0.55);
  const jogOuter = new THREE.Group();
  const outerSegs: Segs = [];
  ring(outerSegs, 0.95, 64);
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * TAU;
    const r0 = k % 3 === 0 ? 0.78 : 0.86;
    line(
      outerSegs,
      Math.cos(a) * r0,
      0,
      Math.sin(a) * r0,
      Math.cos(a) * 0.95,
      0,
      Math.sin(a) * 0.95,
    );
  }
  holo(outerSegs, L.jog, jogOuter, 0.35, 0.6);
  const dimple: Segs = [];
  rectXZ(dimple, 0.58, 0.72, 0.01, -0.07, 0.07);
  holo(dimple, L.jogHot, jogOuter);
  const jogInner = new THREE.Group();
  const innerSegs: Segs = [];
  ring(innerSegs, 0.62, 48);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    line(
      innerSegs,
      Math.cos(a) * 0.3,
      0,
      Math.sin(a) * 0.3,
      Math.cos(a) * 0.6,
      0,
      Math.sin(a) * 0.6,
    );
  }
  holo(innerSegs, L.jog, jogInner, 0.4, 0.65);
  jog.add(jogOuter, jogInner);
  addLabel("JOG", [0, 0.2, 1.35], jog, L.jog, 0.22);
  root.add(jog);

  const cardSegs: Segs = [];
  rectXY(cardSegs, -0.5, 0.5, -0.5, 0.5, 0);
  line(cardSegs, -0.32, -0.3, 0.001, 0.32, -0.3, 0.001);
  line(cardSegs, -0.2, -0.38, 0.001, 0.2, -0.38, 0.001);
  line(cardSegs, -0.1, 0.16, 0.001, -0.1, -0.08, 0.001);
  line(cardSegs, -0.1, -0.08, 0.001, 0.12, 0.04, 0.001);
  line(cardSegs, 0.12, 0.04, 0.001, -0.1, 0.16, 0.001);
  const cardGeometry = keep(new LineSegmentsGeometry());
  cardGeometry.setPositions(cardSegs);
  holos.push({ geometry: cardGeometry, count: cardSegs.length / 6, from: 0.7, to: 1 });
  const checkSegs: Segs = [];
  line(checkSegs, 0.12, 0.34, 0.002, 0.2, 0.26, 0.002);
  line(checkSegs, 0.2, 0.26, 0.002, 0.36, 0.44, 0.002);
  const checkGeometry = keep(new LineSegmentsGeometry());
  checkGeometry.setPositions(checkSegs);
  const cardFace = keep(new THREE.PlaneGeometry(1, 1));
  const cards = Array.from({ length: CLIP_COUNT }, () => {
    const group = new THREE.Group();
    group.rotation.order = "YXZ";
    const face = new THREE.Mesh(cardFace, faceMat.clip);
    const halo = new LineSegments2(cardGeometry, L.clip.halo);
    const core = new LineSegments2(cardGeometry, L.clip.core);
    const check = new LineSegments2(checkGeometry, L.check.core);
    [halo, core, check].forEach((part) => (part.frustumCulled = false));
    group.add(face, halo, core, check);
    root.add(group);
    return { group, face, halo, core, check };
  });

  const color = new THREE.Color();
  let palette = PALETTES[options.theme];
  const toneColor = (tone: Tone | "face") => (tone === "face" ? palette.face : palette[tone]);
  const applyTheme = (theme: EngineTheme) => {
    palette = PALETTES[theme];
    const blending = palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    layers.forEach((entry) => {
      entry.core.color.set(toneColor(entry.tone));
      entry.halo.color.set(toneColor(entry.tone));
      entry.core.blending = blending;
      entry.halo.blending = blending;
    });
    faces.forEach((face) => {
      face.material.uniforms.uColor.value.set(face.tone === "hot" ? palette.hot : palette.face);
      face.material.blending = blending;
    });
    sprites.forEach((sprite) => {
      sprite.material.color.set(toneColor(sprite.tone));
      sprite.material.blending = blending;
    });
    labels.forEach((label) => {
      label.material.color.set(toneColor(label.layer.tone === "dim" ? "line" : label.layer.tone));
    });
    gridMaterial.color.set(palette.dim);
    fog.color.set(palette.fog);
  };
  applyTheme(options.theme);

  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.ready
      .then(() => {
        if (disposed) return;
        labels.forEach(drawLabel);
        if (!running) update(0);
      })
      .catch(() => {});
  }

  let time = 0;
  let disposed = false;
  let playU = 0.28;
  let jogAngle = 0;
  let revealed = false;
  const waveBuffers = waveGroups.map(
    (group) =>
      (group.geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute)
        .data as THREE.InstancedInterleavedBuffer,
  );
  const tetherBuffer = (
    tethers.geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute
  ).data as THREE.InstancedInterleavedBuffer;

  const update = (dt: number) => {
    time += dt;
    clock.value = time;
    const s = engineStateAt(view.progress);
    const a = view.assembly;
    const pulse = view.pulse;
    const motion = options.reduced ? 0 : 1;

    const rot = (s.cam.rot + view.px * 8 + Math.sin(time * 0.15) * 2.5 * motion) * DEG;
    const pitch = (s.cam.pitch + view.py * 4) * DEG;
    const dist = s.cam.dist + (1 - a) * 5;
    target.set(s.cam.x, s.cam.y, s.cam.z);
    camera.position.set(
      target.x + Math.sin(rot) * Math.cos(pitch) * dist,
      target.y - Math.sin(pitch) * dist,
      target.z + Math.cos(rot) * Math.cos(pitch) * dist,
    );
    camera.lookAt(target);
    fog.near = dist * 0.72;
    fog.far = dist * 1.95;

    playU = wrap(playU + dt * s.sweep * 0.07 * motion);
    const phX = -HALF + playU * TIMELINE_LENGTH;
    playhead.position.x = phX;
    sweep.value = phX;

    if (!revealed || a < 1) {
      holos.forEach((h) => {
        const r = seg(a, h.from, h.to);
        h.geometry.instanceCount = r >= 1 ? h.count : Math.ceil(h.count * r);
      });
      revealed = a >= 1;
    }
    const boot = a < 1 ? 0.55 + 0.45 * Math.abs(Math.sin(time * 37)) : 1;

    L.hooks.vis = s.hooks;
    L.razor.vis = s.razor;
    L.caret.vis = s.captions;
    L.chips.vis = 0.45 + s.captions * 0.55;
    L.tether.vis = s.tether;
    L.ingest.vis = 0.25 + s.ingest * 0.75;
    L.gate.vis = s.gate;
    L.laser.vis = s.gate;
    L.check.vis = Math.max(s.gate, s.lanes);
    L.lanes.vis = s.lanes;
    L.bin.vis = s.bin;
    L.loop.vis = s.loop;
    L.wave.vis = 0.55 + s.wave * 0.45;
    L.waveHot.vis = 0.55 + s.wave * 0.45;
    const glow = s.glow * (1 + pulse * 0.8);
    layers.forEach((entry) => {
      entry.core.opacity = palette.lineAlpha * entry.vis * boot;
      entry.halo.opacity = palette.haloAlpha * entry.vis * glow * boot;
      entry.core.visible = entry.vis > 0.01;
      entry.halo.visible = entry.vis > 0.01 && entry.halo.linewidth > 0;
    });
    L.waveHot.core.color.set(palette.line).lerp(color.set(palette.hot), s.hooks);
    L.waveHot.halo.color.copy(L.waveHot.core.color);

    const faceFade = seg(a, 0.2, 0.9);
    faces.forEach((face) => {
      face.material.uniforms.uOpacity.value = palette.faceAlpha * face.alpha * faceFade;
    });
    faceMat.gate.uniforms.uOpacity.value *= s.gate;
    faceMat.lanes.uniforms.uOpacity.value *= s.lanes;
    faceMat.sheet.uniforms.uOpacity.value *= 0.6 + s.razor * 0.6 + pulse * 0.5;

    labels.forEach((label) => {
      label.material.opacity = palette.labelAlpha * label.layer.vis * faceFade;
      label.sprite.visible = label.layer.vis > 0.01;
    });

    const waveMotion = options.reduced ? 0.8 : time;
    waveGroups.forEach((group, g) => {
      const array = waveBuffers[g].array as Float32Array;
      group.xs.forEach((x, i) => {
        const h = waveAmplitude(x, waveMotion, s.hooks) * (0.45 + s.wave * 0.75);
        array[i * 6 + 1] = TRACKS[0].y - h;
        array[i * 6 + 4] = TRACKS[0].y + h;
      });
      waveBuffers[g].needsUpdate = true;
    });
    hookMarks.position.y = Math.sin(time * 3) * 0.03 * s.hooks;

    const chipIndex = Math.floor(time * 2.6) % CAPTION_WORDS;
    const chip = chips[chipIndex];
    caret.position.x = chip.x;
    caret.scale.set(chip.w + 0.1, 1, 0.46);

    src.scale.setScalar(Math.max(0.001, seg(a, 0.2, 0.6)));
    ingestParticles.forEach((particle, k) => {
      const u = wrap(k / INGEST_PARTICLES + time * 0.45);
      const x0 = SRC.x + SRC.size / 2;
      particle.position.set(
        x0 + (phX - x0) * u,
        FOOTAGE_Y + 0.08 + Math.sin(k * 2.1) * 0.05,
        Math.sin(k * 1.7) * 0.5,
      );
      particle.material.opacity = s.ingest * Math.sin(u * Math.PI) * 0.9;
      particle.visible = s.ingest > 0.01;
    });

    const boundary = Math.min(
      ...Array.from({ length: CLIP_COUNT + 1 }, (_, b) =>
        Math.abs(phX - (-HALF + b * SEGMENT_W) * 1.06),
      ),
    );
    const flash = s.razor * Math.max(0, 1 - boundary / 0.18);
    spark.material.opacity = flash;
    spark.visible = flash > 0.01;
    spark.scale.setScalar(0.6 + flash * 1.2);
    headGlow.material.opacity = 0.35 + pulse * 0.5;

    laser.position.y = CARD_Y + Math.sin(time * 2.4) * 0.64;

    const tetherArray = tetherBuffer.array as Float32Array;
    cards.forEach((card, i) => {
      const p = clipPoseAt(view.progress, i, options.reduced ? 0 : time);
      const sc = p.scale * seg(a, 0.7, 1);
      card.group.visible = sc > 0.18;
      card.group.position.set(p.x, p.y, p.z);
      card.group.rotation.set(p.rx * DEG, p.ry * DEG, 0);
      card.group.scale.set(p.w * sc, p.h * sc, 1);
      const ghost = s.ingest > 0.5 && segmentX(i) > phX;
      const cutting = s.razor > 0.5 && Math.abs(p.x - phX) < SEGMENT_W * 0.55;
      const approved = clipApproved(s, i, options.reduced ? 0 : time);
      const hot = cutting || approved;
      const target = ghost ? L.clipGhost : hot ? L.clipHot : L.clip;
      card.core.material = target.core;
      card.halo.material = target.halo;
      card.halo.visible = !ghost;
      card.face.material = hot ? faceMat.clipHot : faceMat.clip;
      card.face.visible = !ghost;
      card.check.visible = approved && !ghost;
      const o = i * 6;
      tetherArray[o] = p.x;
      tetherArray[o + 1] = p.y - (p.h * sc) / 2;
      tetherArray[o + 2] = p.z;
      tetherArray[o + 3] = segmentX(i);
      tetherArray[o + 4] = FOOTAGE_Y;
      tetherArray[o + 5] = 0;
    });
    tetherBuffer.needsUpdate = true;

    jogAngle += dt * s.sweep * 1.4 * motion;
    jogOuter.rotation.y = -jogAngle;
    jogInner.rotation.y = jogAngle * 0.6;

    const loopLive = s.loop;
    pulses.forEach((pulseSprite, k) => {
      const q = loopPoint(time * 0.9 + (k / LOOP_PULSES) * TAU);
      pulseSprite.position.set(q.x, q.y, q.z);
      pulseSprite.material.opacity = loopLive;
      pulseSprite.visible = loopLive > 0.01;
    });

    gridMaterial.opacity = (palette.additive ? 0.22 : 0.4) * faceFade;

    renderer.render(scene, camera);
  };

  const resize = () => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width / height < 0.8 ? 42 : 32;
    const glowScale = Math.min(1, Math.max(0.5, width / 820));
    layers.forEach((entry) => (entry.halo.linewidth = entry.glow * glowScale));
    camera.updateProjectionMatrix();
    if (!running) update(0);
  };

  let running = false;
  let last = 0;
  const loopFrame = (now: number) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    update(dt);
  };
  const setRunning = (next: boolean) => {
    if (options.reduced || next === running) return;
    running = next;
    last = 0;
    renderer.setAnimationLoop(next ? loopFrame : null);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibility = new IntersectionObserver((entries) => {
    setRunning(entries.some((entry) => entry.isIntersecting));
  });
  visibility.observe(host);
  resize();
  setRunning(true);

  return {
    view,
    setTheme: (theme) => {
      applyTheme(theme);
      if (!running) update(0);
    },
    renderOnce: () => {
      if (!running) update(0);
    },
    dispose: () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      visibility.disconnect();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      gridMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
