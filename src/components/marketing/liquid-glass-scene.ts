import * as THREE from "three";

export const LIQUID_GLASS_BLOB_COUNT = 8;

export const LIQUID_GLASS_BACKGROUND_VERTEX = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const LIQUID_GLASS_BACKGROUND_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec3 uAccent;
uniform vec3 uTeal;
uniform vec3 uBg;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

float metaball(vec2 uv, vec2 center, float radius) {
  float d = length(uv - center);
  return radius / (d * d + 0.0008);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.22;
  vec2 pointer = uPointer * 0.28;

  vec2 warp = vec2(
    fbm(uv * 1.7 + vec2(t * 0.6, -t * 0.4)),
    fbm(uv * 1.7 + vec2(-t * 0.5, t * 0.7) + 12.4)
  );
  vec2 liquid = uv + (warp - 0.5) * 0.55 + pointer * 0.18;

  float field = 0.0;
  field += metaball(liquid, vec2(sin(t * 0.9) * 0.42, cos(t * 0.7) * 0.28), 0.16);
  field += metaball(liquid, vec2(cos(t * 0.65) * -0.38, sin(t * 1.1) * 0.32), 0.12);
  field += metaball(liquid, vec2(sin(t * 0.4 + 1.7) * 0.22, cos(t * 0.85) * -0.36), 0.14);
  field += metaball(liquid, vec2(cos(t * 1.05 + 0.6) * 0.5, sin(t * 0.55) * 0.18), 0.09);
  field += metaball(liquid, pointer * 1.4, 0.07);

  float ridge = pow(abs(sin(liquid.x * 9.0 + warp.y * 6.0 + t * 1.8)), 8.0);
  float caustic = pow(max(fbm(liquid * 4.5 + t) * 1.35, 0.0), 3.0);
  float glass = smoothstep(1.1, 3.4, field);
  float rim = smoothstep(0.55, 1.4, field) - glass;

  vec3 interior = mix(uBg, uAccent, 0.42);
  vec3 sheen = mix(uTeal, vec3(0.92, 1.0, 0.96), ridge);
  vec3 color = mix(uBg, interior, 0.55 + glass * 0.45);
  color = mix(color, sheen, caustic * 0.55 + rim * 0.7);
  color += uAccent * glass * 0.28;
  color += vec3(0.85, 0.98, 0.92) * rim * 0.35;

  float chroma = rim * 0.18;
  color.r += chroma;
  color.b -= chroma * 0.6;

  float vignette = smoothstep(1.35, 0.15, length(uv * vec2(1.15, 1.0)));
  color = mix(uBg, color, 0.55 + vignette * 0.45);

  gl_FragColor = vec4(color, 1.0);
}
`;

export const LIQUID_GLASS_BLOB_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vWorld;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(normalMatrix * normal);
  vView = cameraPosition - world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const LIQUID_GLASS_BLOB_FRAGMENT = /* glsl */ `
uniform vec3 uAccent;
uniform vec3 uTeal;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vView;
varying vec3 vWorld;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vView);
  float fresnel = pow(1.0 - max(dot(normal, view), 0.0), 3.2);
  float iridescence = 0.5 + 0.5 * sin(fresnel * 12.0 + uTime * 0.8 + vWorld.y * 1.4);
  vec3 glass = mix(uAccent * 0.35, uTeal, iridescence);
  vec3 rim = mix(vec3(0.78, 1.0, 0.92), vec3(1.0), fresnel);
  vec3 color = mix(glass, rim, fresnel);
  float alpha = 0.22 + fresnel * 0.62;
  gl_FragColor = vec4(color, alpha);
}
`;

export function liquidGlassShouldAnimate(options: {
  reducedMotion: boolean;
  documentHidden: boolean;
}): boolean {
  return !options.reducedMotion && !options.documentHidden;
}

export type LiquidGlassHandle = {
  canvas: HTMLCanvasElement | null;
  dispose: () => void;
};

type BlobSpec = {
  mesh: THREE.Mesh;
  radius: number;
  orbit: number;
  speed: number;
  phase: number;
  lift: number;
};

function readThemeColor(name: string, fallback: string): THREE.Color {
  if (typeof document === "undefined") return new THREE.Color(fallback);
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  try {
    return new THREE.Color(raw || fallback);
  } catch {
    return new THREE.Color(fallback);
  }
}

export function mountLiquidGlassScene(
  host: HTMLElement,
  options: { reducedMotion?: boolean } = {},
): LiquidGlassHandle {
  if (options.reducedMotion || typeof window === "undefined") {
    return { canvas: null, dispose() {} };
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: window.innerWidth > 900,
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
    });
  } catch {
    return { canvas: null, dispose() {} };
  }

  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
  camera.position.set(0, 0.15, 8.2);

  const accent = readThemeColor("--accent", "#10b981");
  const teal = readThemeColor("--teal", "#6ee7b7");
  const bg = readThemeColor("--bg", "#050a08");
  renderer.setClearColor(bg, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 48),
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uAccent: { value: accent.clone() },
        uTeal: { value: teal.clone() },
        uBg: { value: bg.clone() },
      },
      vertexShader: LIQUID_GLASS_BACKGROUND_VERTEX,
      fragmentShader: LIQUID_GLASS_BACKGROUND_FRAGMENT,
      depthWrite: false,
    }),
  );
  background.position.z = -14;
  background.frustumCulled = false;
  scene.add(background);

  const blobMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uAccent: { value: accent.clone() },
      uTeal: { value: teal.clone() },
      uTime: { value: 0 },
    },
    vertexShader: LIQUID_GLASS_BLOB_VERTEX,
    fragmentShader: LIQUID_GLASS_BLOB_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const geometry = new THREE.IcosahedronGeometry(1, 3);
  const blobs: BlobSpec[] = [];
  for (let index = 0; index < LIQUID_GLASS_BLOB_COUNT; index += 1) {
    const mesh = new THREE.Mesh(geometry, blobMaterial);
    const radius = 0.55 + (index % 4) * 0.22;
    mesh.scale.setScalar(radius);
    scene.add(mesh);
    blobs.push({
      mesh,
      radius,
      orbit: 1.4 + (index % 5) * 0.38,
      speed: 0.16 + index * 0.037,
      phase: index * 0.82,
      lift: (index % 3) * 0.42 - 0.4,
    });
  }

  const particleGeo = new THREE.BufferGeometry();
  const particleCount = 90;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = (hash(i, 1) - 0.5) * 12;
    positions[i * 3 + 1] = (hash(i, 2) - 0.5) * 8;
    positions[i * 3 + 2] = (hash(i, 3) - 0.5) * 6 - 2;
  }
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      color: teal,
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  scene.add(particles);

  const pointer = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);
  const clock = new THREE.Clock();
  let frame = 0;
  let running = true;

  const backgroundMaterial = background.material as THREE.ShaderMaterial;

  function applyTheme() {
    const nextAccent = readThemeColor("--accent", "#10b981");
    const nextTeal = readThemeColor("--teal", "#6ee7b7");
    const nextBg = readThemeColor("--bg", "#050a08");
    backgroundMaterial.uniforms.uAccent.value.copy(nextAccent);
    backgroundMaterial.uniforms.uTeal.value.copy(nextTeal);
    backgroundMaterial.uniforms.uBg.value.copy(nextBg);
    blobMaterial.uniforms.uAccent.value.copy(nextAccent);
    blobMaterial.uniforms.uTeal.value.copy(nextTeal);
    (particles.material as THREE.PointsMaterial).color.copy(nextTeal);
    renderer.setClearColor(nextBg, 1);
  }

  function resize() {
    const width = Math.max(host.clientWidth || window.innerWidth, 1);
    const height = Math.max(host.clientHeight || window.innerHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    backgroundMaterial.uniforms.uResolution.value.set(
      width * renderer.getPixelRatio(),
      height * renderer.getPixelRatio(),
    );
  }

  function tick() {
    if (!running) return;
    frame = window.requestAnimationFrame(tick);
    const hidden = typeof document !== "undefined" && document.hidden;
    if (!liquidGlassShouldAnimate({ reducedMotion: false, documentHidden: hidden })) return;

    const time = clock.getElapsedTime();
    pointer.lerp(pointerTarget, 0.06);
    backgroundMaterial.uniforms.uTime.value = time;
    backgroundMaterial.uniforms.uPointer.value.copy(pointer);
    blobMaterial.uniforms.uTime.value = time;

    for (const blob of blobs) {
      const angle = time * blob.speed + blob.phase;
      blob.mesh.position.set(
        Math.cos(angle) * blob.orbit + pointer.x * 0.6,
        blob.lift + Math.sin(angle * 1.35) * 0.55 + pointer.y * 0.35,
        Math.sin(angle * 0.8) * 1.1 - 1.2,
      );
      const pulse = 1 + Math.sin(time * 1.4 + blob.phase) * 0.08;
      blob.mesh.scale.setScalar(blob.radius * pulse);
      blob.mesh.rotation.x = time * 0.18 + blob.phase;
      blob.mesh.rotation.y = time * 0.24 + blob.phase * 0.5;
    }

    particles.rotation.y = time * 0.03;
    camera.position.x = pointer.x * 0.55;
    camera.position.y = 0.15 + pointer.y * 0.28;
    camera.lookAt(0, 0, -2);
    renderer.render(scene, camera);
  }

  function onPointer(event: PointerEvent) {
    pointerTarget.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", applyVisibility);
  resize();
  applyTheme();
  tick();

  function applyVisibility() {
    if (!document.hidden && running && frame === 0) tick();
  }

  return {
    canvas,
    dispose() {
      running = false;
      window.cancelAnimationFrame(frame);
      frame = 0;
      observer.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", applyVisibility);
      geometry.dispose();
      particleGeo.dispose();
      blobMaterial.dispose();
      backgroundMaterial.dispose();
      background.geometry.dispose();
      (particles.material as THREE.PointsMaterial).dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}

function hash(index: number, salt: number): number {
  const n = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
