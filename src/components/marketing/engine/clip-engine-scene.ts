import * as THREE from "three";
import { animate, type JSAnimation } from "animejs";
import {
  CLIP_COUNT,
  FILM_FRAMES,
  GATE_Z,
  PISTON_COUNT,
  ROTOR_HEIGHTS,
  TRANSMITTER_COUNT,
  clipPoseAt,
  engineStateAt,
  isHookFrame,
  transmitterAngle,
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

type Palette = {
  body: string;
  panel: string;
  deep: string;
  metal: string;
  accent: string;
  crystal: string;
  edge: string;
  glass: string;
  fog: string;
  grid: string;
  shadow: number;
  hemi: number;
  sky: string;
  ground: string;
  clips: string[];
  film: string;
};

const PALETTES: Record<EngineTheme, Palette> = {
  dark: {
    body: "#1c2b24",
    panel: "#253a30",
    deep: "#0b3d2c",
    metal: "#7d948a",
    accent: "#10b981",
    crystal: "#6ee7b7",
    edge: "#34d399",
    glass: "#10b981",
    fog: "#050a08",
    grid: "#14532d",
    shadow: 0.55,
    hemi: 1.8,
    sky: "#d1fae5",
    ground: "#052e1f",
    clips: ["#1f6f55", "#7a4a1f", "#1f4f6f", "#5b2f7a"],
    film: "#0a1410",
  },
  light: {
    body: "#eef8f3",
    panel: "#d5efe2",
    deep: "#047857",
    metal: "#9fb8ad",
    accent: "#059669",
    crystal: "#34d399",
    edge: "#059669",
    glass: "#34d399",
    fog: "#f3faf6",
    grid: "#a7dcc4",
    shadow: 0.16,
    hemi: 2.4,
    sky: "#ffffff",
    ground: "#a7f3d0",
    clips: ["#2f9e78", "#c07a3a", "#3a78a8", "#8a55b5"],
    film: "#10231b",
  },
};

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const EDGE_ANGLE = 28;
const SPARK_COUNT = 24;

function seg(value: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (value - start) / (end - start)));
}

function outBack(t: number): number {
  const c = 1.4;
  const x = t - 1;
  return t <= 0 ? 0 : 1 + (c + 1) * x * x * x + c * x * x;
}

function shadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(0.55, "rgba(0,0,0,0.45)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const view = options.view;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PALETTES[options.theme].fog, 22, 42);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);

  const geometries: THREE.BufferGeometry[] = [];
  const track = <T extends THREE.BufferGeometry>(geometry: T): T => {
    geometries.push(geometry);
    return geometry;
  };

  const mat = {
    body: new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.18, flatShading: true }),
    panel: new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2, flatShading: true }),
    deep: new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.3, flatShading: true }),
    metal: new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.75, flatShading: true }),
    accent: new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.2, flatShading: true }),
    crystal: new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.1, flatShading: true }),
    glass: new THREE.MeshPhysicalMaterial({
      roughness: 0.08,
      metalness: 0,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    film: new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.1 }),
    frame: new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.05 }),
    clip: new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }),
    rim: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9 }),
    glow: new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    ripple: new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    spark: new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    edge: new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 }),
    shadow: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthWrite: false }),
  };
  const shadowMap = shadowTexture();
  mat.shadow.map = shadowMap;

  const mesh = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: [number, number, number] = [0, 0, 0],
    edges = true,
  ) => {
    const m = new THREE.Mesh(track(geometry), material);
    m.position.set(position[0], position[1], position[2]);
    if (edges)
      m.add(new THREE.LineSegments(track(new THREE.EdgesGeometry(geometry, EDGE_ANGLE)), mat.edge));
    return m;
  };
  const cyl = (
    top: number,
    bottom: number,
    height: number,
    sides: number,
    material: THREE.Material,
    position: [number, number, number],
    edges = true,
  ) => mesh(new THREE.CylinderGeometry(top, bottom, height, sides), material, position, edges);
  const box = (
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    position: [number, number, number],
    edges = true,
  ) => mesh(new THREE.BoxGeometry(w, h, d), material, position, edges);

  const root = new THREE.Group();
  scene.add(root);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1.5);
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(5, 9, 7);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2);
  rim.position.set(-6, 5, -5);
  const coreLight = new THREE.PointLight(0xffffff, 10, 9, 2);
  coreLight.position.set(0, 2.2, 0);
  const flash = new THREE.PointLight(0xffffff, 0, 4, 2);
  flash.position.set(0, 1.2, 2.6);
  scene.add(hemi, key, rim, coreLight, flash);

  const grid = new THREE.GridHelper(22, 44);
  const gridMaterial = grid.material as THREE.LineBasicMaterial;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.35;
  gridMaterial.depthWrite = false;
  grid.position.y = -0.002;
  track(grid.geometry);
  const shadow = new THREE.Mesh(track(new THREE.CircleGeometry(4.6, 48)), mat.shadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.004;
  root.add(grid, shadow);

  const chassis = new THREE.Group();
  const plinth = cyl(2.62, 2.84, 0.4, 8, mat.body, [0, 0.2, 0]);
  const deck = cyl(2.3, 2.44, 0.22, 8, mat.panel, [0, 0.51, 0]);
  const trim = cyl(2.68, 2.68, 0.07, 8, mat.accent, [0, 0.41, 0], false);
  [plinth, deck, trim].forEach((part) => (part.rotation.y = Math.PI / 8));
  chassis.add(plinth, deck, trim);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    const vent = box(
      1.05,
      0.18,
      0.08,
      mat.deep,
      [Math.sin(a) * 2.66, 0.2, Math.cos(a) * 2.66],
      false,
    );
    vent.rotation.y = a;
    chassis.add(vent);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + Math.PI / 8;
    chassis.add(
      cyl(0.07, 0.07, 0.06, 6, mat.metal, [Math.sin(a) * 2.05, 0.65, Math.cos(a) * 2.05], false),
    );
  }
  root.add(chassis);

  const core = new THREE.Group();
  core.add(cyl(1.02, 1.14, 0.3, 6, mat.panel, [0, 0.76, 0]));
  core.add(cyl(1.02, 1.02, 0.2, 6, mat.panel, [0, 3.62, 0]));
  core.add(
    mesh(new THREE.CylinderGeometry(0.93, 0.93, 2.66, 6, 1, true), mat.glass, [0, 2.2, 0], false),
  );
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    core.add(
      box(0.09, 2.66, 0.09, mat.metal, [Math.sin(a) * 0.96, 2.2, Math.cos(a) * 0.96], false),
    );
  }
  const crystal = mesh(new THREE.OctahedronGeometry(0.52, 0), mat.crystal, [0, 2.2, 0]);
  crystal.scale.set(1, 2.05, 1);
  const clipRing = mesh(new THREE.TorusGeometry(0.62, 0.05, 6, 6), mat.accent, [0, 2.2, 0], false);
  core.add(crystal, clipRing);
  const sparks = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(0.07, 0.07, 0.07)),
    mat.spark,
    SPARK_COUNT,
  );
  sparks.frustumCulled = false;
  core.add(sparks);
  root.add(core);

  const pistons = Array.from({ length: PISTON_COUNT }, (_, i) => {
    const arm = new THREE.Group();
    arm.rotation.y = (i / PISTON_COUNT) * TAU + Math.PI / 6;
    const slide = new THREE.Group();
    slide.position.z = 1.9;
    slide.add(cyl(0.2, 0.22, 1.05, 12, mat.metal, [0, 1.13, 0]));
    slide.add(cyl(0.25, 0.25, 0.1, 12, mat.panel, [0, 0.66, 0]));
    const head = new THREE.Group();
    head.position.y = 1.66;
    head.add(cyl(0.075, 0.075, 0.5, 10, mat.body, [0, 0.1, 0], false));
    head.add(cyl(0.27, 0.27, 0.16, 12, mat.accent, [0, 0.36, 0]));
    slide.add(head);
    arm.add(slide);
    root.add(arm);
    return { arm, head };
  });

  const rotors = ROTOR_HEIGHTS.map((height, k) => {
    const mount = new THREE.Group();
    mount.position.y = height;
    const spin = new THREE.Group();
    const ring = mesh(new THREE.TorusGeometry(1.1, 0.07, 8, 40), mat.metal, [0, 0, 0], false);
    ring.rotation.x = Math.PI / 2;
    const outer = mesh(new THREE.TorusGeometry(1.56, 0.035, 6, 48), mat.metal, [0, 0, 0], false);
    outer.rotation.x = Math.PI / 2;
    spin.add(ring, outer);
    const finMaterial = k === 0 ? mat.accent : k === 1 ? mat.deep : mat.panel;
    for (let i = 0; i < 14; i++) {
      const holder = new THREE.Group();
      holder.rotation.y = (i / 14) * TAU;
      const fin = box(0.44, 0.05, 0.22, finMaterial, [1.33, 0, 0], false);
      fin.rotation.x = 0.55;
      holder.add(fin);
      spin.add(holder);
    }
    mount.add(spin);
    root.add(mount);
    return { mount, spin };
  });

  const crown = new THREE.Group();
  const crownBase = cyl(1.32, 1.18, 0.2, 8, mat.body, [0, 3.86, 0]);
  crownBase.rotation.y = Math.PI / 8;
  crown.add(crownBase);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const fin = box(
      0.06,
      0.44,
      0.5,
      mat.metal,
      [Math.sin(a) * 0.92, 4.18, Math.cos(a) * 0.92],
      false,
    );
    fin.rotation.y = a;
    crown.add(fin);
  }
  crown.add(cyl(0.56, 0.72, 0.26, 8, mat.panel, [0, 4.52, 0]));
  crown.add(cyl(0.17, 0.27, 0.5, 12, mat.accent, [0, 4.88, 0]));
  const beacon = mesh(new THREE.SphereGeometry(0.12, 16, 12), mat.crystal, [0, 5.2, 0], false);
  crown.add(beacon);
  const ripples: THREE.Mesh[] = [];
  const transmitters = Array.from({ length: TRANSMITTER_COUNT }, (_, k) => {
    const holder = new THREE.Group();
    holder.rotation.y = transmitterAngle(k) * DEG;
    const rod = box(0.07, 0.07, 0.95, mat.metal, [0, 4.5, 1.05], false);
    rod.rotation.x = -0.45;
    const dish = cyl(0.34, 0.07, 0.12, 16, mat.accent, [0, 4.72, 1.52]);
    dish.rotation.x = 1.05;
    holder.add(rod, dish);
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.4, 0.018, 6, 40)),
        mat.ripple.clone(),
      );
      ring.position.set(0, 4.8, 1.62);
      ring.rotation.x = 1.05 - Math.PI / 2;
      holder.add(ring);
      ripples.push(ring);
    }
    crown.add(holder);
    return holder;
  });
  root.add(crown);

  const reels = [-1, 1].map((side) => {
    const group = new THREE.Group();
    group.position.set(side * 2.75, 0, -0.3);
    group.add(box(0.16, 2.62, 0.16, mat.metal, [0, 1.72, -0.05], false));
    const reel = new THREE.Group();
    reel.position.y = 3.08;
    const rimOuter = mesh(
      new THREE.TorusGeometry(1.02, 0.07, 8, 48),
      mat.accent,
      [0, 0, 0.1],
      false,
    );
    const rimBack = mesh(
      new THREE.TorusGeometry(1.02, 0.07, 8, 48),
      mat.metal,
      [0, 0, -0.1],
      false,
    );
    const pack = mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.16, 40), mat.film, [0, 0, 0], false);
    pack.rotation.x = Math.PI / 2;
    const hub = cyl(0.22, 0.22, 0.34, 12, mat.panel, [0, 0, 0]);
    hub.rotation.x = Math.PI / 2;
    reel.add(rimOuter, rimBack, pack, hub);
    for (let i = 0; i < 5; i++) {
      const spoke = box(0.12, 0.84, 0.05, mat.body, [0, 0, 0.12], false);
      spoke.position.set(Math.sin((i / 5) * TAU) * 0.46, Math.cos((i / 5) * TAU) * 0.46, 0.12);
      spoke.rotation.z = -(i / 5) * TAU;
      reel.add(spoke);
    }
    group.add(reel);
    root.add(group);
    return { group, reel, side };
  });

  const filmPoints = [
    [-2.75, 2.2, -0.1],
    [-2.35, 1.3, 1.1],
    [-1.25, 0.96, 2.25],
    [0, 0.92, 2.55],
    [1.25, 0.96, 2.25],
    [2.35, 1.3, 1.1],
    [2.75, 2.2, -0.1],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const filmCurve = new THREE.CatmullRomCurve3(filmPoints);
  const railCurve = (offset: number) =>
    new THREE.CatmullRomCurve3(filmPoints.map((p) => new THREE.Vector3(p.x, p.y + offset, p.z)));
  const film = new THREE.Group();
  [-0.14, 0.14].forEach((offset) => {
    film.add(
      new THREE.Mesh(track(new THREE.TubeGeometry(railCurve(offset), 120, 0.016, 5)), mat.metal),
    );
  });
  const frames = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(0.34, 0.22, 0.025)),
    mat.frame,
    FILM_FRAMES,
  );
  const hookGlow = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(0.4, 0.28, 0.01)),
    mat.glow,
    FILM_FRAMES,
  );
  frames.frustumCulled = false;
  hookGlow.frustumCulled = false;
  film.add(frames, hookGlow);
  root.add(film);

  const scanner = new THREE.Group();
  const scanRing = mesh(new THREE.TorusGeometry(1.3, 0.035, 8, 64), mat.accent, [0, 0, 0], false);
  scanRing.rotation.x = Math.PI / 2;
  const scanDisc = new THREE.Mesh(track(new THREE.RingGeometry(0.98, 1.28, 48)), mat.glow);
  scanDisc.rotation.x = -Math.PI / 2;
  scanner.add(scanRing, scanDisc);
  root.add(scanner);

  const cutter = new THREE.Group();
  cutter.position.set(0, 0, 2.55);
  cutter.add(box(0.1, 1.72, 0.1, mat.metal, [-0.52, 1.46, 0], false));
  cutter.add(box(0.1, 1.72, 0.1, mat.metal, [0.52, 1.46, 0], false));
  cutter.add(box(1.18, 0.16, 0.24, mat.body, [0, 2.36, 0]));
  const ram = new THREE.Group();
  ram.add(cyl(0.08, 0.08, 0.6, 10, mat.metal, [0, 0.3, 0], false));
  ram.add(box(0.86, 0.07, 0.3, mat.accent, [0, 0, 0]));
  cutter.add(ram);
  root.add(cutter);

  const gate = new THREE.Group();
  gate.position.set(0, 0, GATE_Z);
  gate.rotation.y = Math.PI / 2;
  const gateRing = mesh(new THREE.TorusGeometry(1.05, 0.08, 8, 48), mat.metal, [0, 1.9, 0], false);
  const gateInner = mesh(new THREE.TorusGeometry(0.86, 0.03, 6, 6), mat.accent, [0, 1.9, 0], false);
  gate.add(gateRing, gateInner);
  gate.add(box(0.12, 0.9, 0.12, mat.metal, [-0.75, 0.45, 0], false));
  gate.add(box(0.12, 0.9, 0.12, mat.metal, [0.75, 0.45, 0], false));
  root.add(gate);

  const vault = new THREE.Group();
  vault.position.set(0, 0, -3.3);
  const vaultBase = cyl(1.25, 1.36, 0.3, 8, mat.body, [0, 0.15, 0]);
  vaultBase.rotation.y = Math.PI / 8;
  vault.add(vaultBase, cyl(1.3, 1.3, 0.05, 8, mat.accent, [0, 0.31, 0], false));
  const platters = Array.from({ length: 6 }, () => {
    const platter = cyl(1.02, 1.02, 0.06, 32, mat.panel, [0, 0.36, 0], false);
    vault.add(platter);
    return platter;
  });
  root.add(vault);

  const clips = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(0.42, 0.74, 0.04)),
    mat.clip,
    CLIP_COUNT,
  );
  const clipRims = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(0.47, 0.79, 0.02)),
    mat.rim,
    CLIP_COUNT,
  );
  const captions = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(0.3, 0.05, 0.045)),
    mat.rim,
    CLIP_COUNT,
  );
  [clips, clipRims, captions].forEach((m) => {
    m.frustumCulled = false;
    root.add(m);
  });

  const matrix = new THREE.Matrix4();
  const local = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const xAxis = new THREE.Vector3();
  const yAxis = new THREE.Vector3();
  const zAxis = new THREE.Vector3();
  const color = new THREE.Color();
  const accentColor = new THREE.Color();
  const frameColors: THREE.Color[] = [];
  const clipColors: THREE.Color[] = [];

  let palette = PALETTES[options.theme];
  const applyTheme = (theme: EngineTheme) => {
    palette = PALETTES[theme];
    mat.body.color.set(palette.body);
    mat.panel.color.set(palette.panel);
    mat.deep.color.set(palette.deep);
    mat.metal.color.set(palette.metal);
    mat.accent.color.set(palette.accent);
    mat.accent.emissive.set(palette.accent);
    mat.accent.emissiveIntensity = 0.35;
    mat.crystal.color.set(palette.crystal);
    mat.crystal.emissive.set(palette.accent);
    mat.glass.color.set(palette.glass);
    mat.film.color.set(palette.film);
    mat.frame.color.set("#ffffff");
    mat.clip.color.set("#ffffff");
    mat.rim.color.set(palette.accent);
    mat.glow.color.set(palette.accent);
    mat.spark.color.set(palette.crystal);
    mat.edge.color.set(palette.edge);
    mat.shadow.opacity = palette.shadow;
    ripples.forEach((ring) => (ring.material as THREE.MeshBasicMaterial).color.set(palette.accent));
    hemi.color.set(palette.sky);
    hemi.groundColor.set(palette.ground);
    hemi.intensity = palette.hemi;
    rim.color.set(palette.accent);
    coreLight.color.set(palette.accent);
    (scene.fog as THREE.Fog).color.set(palette.fog);
    gridMaterial.color.set("#ffffff");
    const gridColors = grid.geometry.getAttribute("color");
    color.set(palette.grid);
    for (let i = 0; i < gridColors.count; i++) gridColors.setXYZ(i, color.r, color.g, color.b);
    gridColors.needsUpdate = true;
    accentColor.set(palette.accent);
    frameColors.length = 0;
    for (let i = 0; i < FILM_FRAMES; i++) frameColors.push(new THREE.Color(palette.clips[i % 4]));
    clipColors.length = 0;
    for (let i = 0; i < CLIP_COUNT; i++) {
      clipColors.push(new THREE.Color(palette.clips[i % 4]));
      clips.setColorAt(i, clipColors[i]);
    }
    if (clips.instanceColor) clips.instanceColor.needsUpdate = true;
  };
  applyTheme(options.theme);

  const rippleAnimations: JSAnimation[] = options.reduced
    ? []
    : ripples.flatMap((ring, index) => {
        const delay = (index % 3) * 800;
        return [
          animate(ring.scale, {
            x: [0.3, 2.6],
            y: [0.3, 2.6],
            z: [0.3, 2.6],
            duration: 2400,
            delay,
            ease: "out(2)",
            loop: true,
          }),
          animate(ring.material, {
            opacity: [0.8, 0],
            duration: 2400,
            delay,
            ease: "out(2)",
            loop: true,
          }),
        ];
      });

  let time = 0;
  let reelAngle = 0;
  let filmOffset = 0;
  const rotorAngles = ROTOR_HEIGHTS.map(() => 0);
  let crystalAngle = 0;
  let sparkOffset = 0;
  let gateAngle = 0;

  const update = (dt: number) => {
    time += dt;
    const s = engineStateAt(view.progress);
    const a = view.assembly;
    const pulse = view.pulse;

    const rot =
      (s.cam.rot + view.px * 8 + (options.reduced ? 0 : Math.sin(time * 0.15) * 2.5)) * DEG;
    const pitch = (s.cam.pitch + view.py * 4) * DEG;
    const dist = s.cam.dist + (1 - a) * 4;
    camera.position.set(
      Math.sin(rot) * Math.cos(pitch) * dist,
      s.cam.y - Math.sin(pitch) * dist,
      Math.cos(rot) * Math.cos(pitch) * dist,
    );
    camera.lookAt(0, s.cam.y, 0);

    const aChassis = outBack(seg(a, 0, 0.35));
    const aCore = outBack(seg(a, 0.15, 0.5));
    const aPistons = outBack(seg(a, 0.3, 0.65));
    const aCrown = outBack(seg(a, 0.55, 0.9));
    const aReels = outBack(seg(a, 0.45, 0.85));
    const aFilm = seg(a, 0.7, 1);
    const aClips = seg(a, 0.75, 1);

    chassis.position.y = (1 - aChassis) * -1.2;
    chassis.scale.setScalar(Math.max(0.001, aChassis));
    core.position.y = (1 - aCore) * 3;
    core.scale.setScalar(Math.max(0.001, aCore));
    crown.position.y = (1 - aCrown) * 2.4;
    crown.scale.setScalar(Math.max(0.001, aCrown));

    crystalAngle += dt * (0.6 + s.rotor * 0.2);
    crystal.rotation.y = crystalAngle;
    clipRing.rotation.set(Math.PI / 2, 0, -crystalAngle * 1.5);
    mat.crystal.emissiveIntensity = 0.55 + Math.sin(time * 2.2) * 0.2 + pulse * 0.8;
    coreLight.intensity = (6 + s.glow * 6 + pulse * 14) * aCore;

    sparkOffset = (sparkOffset + dt * (0.12 + s.rotor * 0.06)) % 1;
    for (let j = 0; j < SPARK_COUNT; j++) {
      const phase = (sparkOffset + j / SPARK_COUNT) % 1;
      const angle = j * 2.4 + phase * 6;
      const radius = 0.5 + Math.sin(j * 1.7) * 0.22;
      position.set(Math.sin(angle) * radius, 0.95 + phase * 2.5, Math.cos(angle) * radius);
      const size = Math.max(0.001, Math.sin(phase * Math.PI) * (0.7 + pulse * 0.6));
      scale.set(size, size, size);
      euler.set(phase * 6, angle, 0);
      quaternion.setFromEuler(euler);
      matrix.compose(position, quaternion, scale);
      sparks.setMatrixAt(j, matrix);
    }
    sparks.instanceMatrix.needsUpdate = true;

    pistons.forEach(({ arm, head }, i) => {
      const ai = outBack(seg(a, 0.3 + i * 0.04, 0.6 + i * 0.04));
      arm.scale.set(1, Math.max(0.001, ai), 1);
      head.position.y = 1.66 + s.pistons * 0.28 * Math.sin(time * 3 + i * 1.05) * aPistons;
    });

    rotors.forEach(({ mount, spin }, k) => {
      const ak = outBack(seg(a, 0.4 + k * 0.08, 0.72 + k * 0.08));
      rotorAngles[k] += (k % 2 ? -1 : 1) * (0.35 + k * 0.25) * s.rotor * dt;
      spin.rotation.y = rotorAngles[k];
      mount.position.y = ROTOR_HEIGHTS[k] + (1 - ak) * (2.5 + k);
      mount.scale.setScalar(Math.max(0.001, ak));
    });

    const crownLive = s.crown;
    transmitters.forEach((holder, k) => {
      holder.scale.setScalar(Math.max(0.001, 0.6 + crownLive * 0.4));
      holder.rotation.y = transmitterAngle(k) * DEG + Math.sin(time * 0.8 + k) * 0.06 * crownLive;
    });
    ripples.forEach((ring) => (ring.visible = crownLive > 0.05));
    beacon.scale.setScalar(1 + crownLive * 0.4 + Math.sin(time * 4) * 0.12 * crownLive);

    reelAngle += s.reel * TAU * dt;
    reels.forEach(({ group, reel, side }) => {
      group.position.x = side * (2.75 + (1 - aReels) * 2);
      group.scale.setScalar(Math.max(0.001, aReels));
      reel.rotation.z = -reelAngle;
    });

    filmOffset = (filmOffset + (s.strip / FILM_FRAMES) * dt) % 1;
    const filmScale = s.stripShow * aFilm;
    film.children.forEach((child) => {
      if (child !== frames && child !== hookGlow) child.scale.setScalar(Math.max(0.001, aFilm));
    });
    for (let i = 0; i < FILM_FRAMES; i++) {
      const u = (filmOffset + i / FILM_FRAMES) % 1;
      const edgeFade = Math.min(1, u / 0.06, (1 - u) / 0.06);
      filmCurve.getPointAt(u, position);
      filmCurve.getTangentAt(u, tangent);
      xAxis.copy(tangent).normalize();
      zAxis.crossVectors(xAxis, up).normalize();
      yAxis.crossVectors(zAxis, xAxis).normalize();
      matrix.makeBasis(xAxis, yAxis, zAxis);
      const sc = Math.max(0.001, filmScale * edgeFade);
      scale.set(sc, sc, sc);
      matrix.scale(scale);
      matrix.setPosition(position);
      frames.setMatrixAt(i, matrix);
      const hook = isHookFrame(i);
      color.copy(frameColors[i]).lerp(accentColor, hook ? s.hooks * 0.7 : 0);
      frames.setColorAt(i, color);
      const glowScale = Math.max(0.001, hook ? s.hooks * sc : 0.001);
      scale.set(glowScale, glowScale, glowScale);
      matrix.makeBasis(xAxis, yAxis, zAxis);
      matrix.scale(scale);
      matrix.setPosition(position.addScaledVector(zAxis, 0.02));
      hookGlow.setMatrixAt(i, matrix);
    }
    frames.instanceMatrix.needsUpdate = true;
    hookGlow.instanceMatrix.needsUpdate = true;
    if (frames.instanceColor) frames.instanceColor.needsUpdate = true;
    mat.glow.opacity = 0.35 + Math.sin(time * 6) * 0.15;

    scanner.position.y = 2.2 + Math.sin(time * 1.6) * 1.15;
    scanner.scale.setScalar(Math.max(0.001, s.scanner));
    scanner.rotation.y = time * 0.8;

    const cycle = (time % 1.1) / 1.1;
    const slam = cycle < 0.18 ? (cycle / 0.18) ** 2 : cycle < 0.3 ? 1 : 1 - (cycle - 0.3) / 0.7;
    cutter.scale.setScalar(Math.max(0.001, s.cutter));
    ram.position.y = 1.78 - slam * 0.7 * s.cutter;
    flash.intensity = s.cutter * (cycle >= 0.18 && cycle < 0.3 ? 26 : 0);
    flash.color.copy(accentColor);

    gateAngle += dt * 1.6 * s.gate;
    gateInner.rotation.z = gateAngle;
    gate.scale.setScalar(Math.max(0.001, s.gate));

    vault.scale.setScalar(Math.max(0.001, 0.55 + s.vault * 0.45));
    platters.forEach((platter, k) => {
      platter.position.y = 0.36 + k * 0.1 * s.vault;
      platter.visible = s.vault > 0.05 || k === 0;
    });

    for (let i = 0; i < CLIP_COUNT; i++) {
      const p = clipPoseAt(view.progress, i, options.reduced ? 0 : time);
      euler.set(p.rx * DEG, p.ry * DEG, 0, "YXZ");
      quaternion.setFromEuler(euler);
      const sc = Math.max(0.001, p.scale * aClips);
      position.set(p.x, p.y, p.z);
      scale.set(sc, sc, sc);
      matrix.compose(position, quaternion, scale);
      clips.setMatrixAt(i, matrix);
      color.copy(clipColors[i]).lerp(accentColor, p.x > 0 ? s.gate * 0.5 : 0);
      clips.setColorAt(i, color);
      local.makeTranslation(0, 0, -0.018);
      clipRims.setMatrixAt(i, local.premultiply(matrix));
      local.makeTranslation(0, -0.24, 0.004);
      captions.setMatrixAt(i, local.premultiply(matrix));
    }
    clips.instanceMatrix.needsUpdate = true;
    if (clips.instanceColor) clips.instanceColor.needsUpdate = true;
    clipRims.instanceMatrix.needsUpdate = true;
    captions.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  };

  const resize = () => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width / height < 0.8 ? 40 : 32;
    camera.updateProjectionMatrix();
    if (!running) update(0);
  };

  let running = false;
  let visible = true;
  let last = 0;
  const loop = (now: number) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    update(dt);
  };
  const setRunning = (next: boolean) => {
    if (options.reduced || next === running) return;
    running = next;
    last = 0;
    renderer.setAnimationLoop(next ? loop : null);
    rippleAnimations.forEach((animation) => (next ? animation.play() : animation.pause()));
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibility = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    setRunning(visible);
  });
  visibility.observe(host);
  resize();
  setRunning(visible);

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
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      visibility.disconnect();
      rippleAnimations.forEach((animation) => animation.pause());
      geometries.forEach((geometry) => geometry.dispose());
      Object.values(mat).forEach((material) => material.dispose());
      gridMaterial.dispose();
      ripples.forEach((ring) => (ring.material as THREE.Material).dispose());
      shadowMap.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
