import {
  animate,
  createAnimatable,
  createTimeline,
  onScroll,
  scrambleText,
  splitText,
  stagger,
  utils,
  type AnimatableObject,
  type AnimationParams,
  type JSAnimation,
} from "animejs";
import {
  ENGINE_STAGES,
  HOOK_SLOT,
  LAST_STAGE,
  SCAN_RANGE,
  framePose,
  rigPose,
  spinsAt,
  stageIndex,
  timecode,
  type FramePose,
} from "@/lib/clip-engine";

type Cleanup = () => void;

const STAGE_MS = 1000;
const SPIN_MS = 28000;
const noop: Cleanup = () => {};
const FRAME_PROPS = [
  "x",
  "y",
  "z",
  "ry",
  "rx",
  "w",
  "h",
  "sp",
  "hot",
  "cap",
  "pub",
] as const satisfies readonly (keyof FramePose)[];

function all<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

function one<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T | null {
  return root.querySelector<T>(selector);
}

function pad(value: number, size = 2) {
  return String(value).padStart(size, "0");
}

function scramble(el: HTMLElement, text: string, chars = "uppercase") {
  animate(el, { innerHTML: scrambleText({ text, chars, cursor: true }), duration: 460 });
}

function frameIndex(el: unknown) {
  return Number((el as HTMLElement).dataset.index);
}

function frameTween(stage: number): AnimationParams {
  const params: AnimationParams = {};
  FRAME_PROPS.forEach((prop) => {
    params[`--${prop}`] = (el: unknown) => [
      framePose(frameIndex(el), stage - 1)[prop],
      framePose(frameIndex(el), stage)[prop],
    ];
  });
  return params;
}

function applyStage(
  frames: HTMLElement[],
  rig: HTMLElement,
  core: HTMLElement | null,
  stage: number,
) {
  frames.forEach((frame) => {
    const pose = framePose(frameIndex(frame), stage);
    FRAME_PROPS.forEach((prop) => frame.style.setProperty(`--${prop}`, String(pose[prop])));
  });
  const camera = rigPose(stage);
  rig.style.setProperty("--cam-rx", String(camera.rx));
  rig.style.setProperty("--cam-ry", String(camera.ry));
  rig.style.setProperty("--zoom", String(camera.zoom));
  core?.style.setProperty("--core", String(camera.core));
}

function heroIntro(root: HTMLElement, reduced: boolean): Cleanup {
  const title = one(root, "[data-hero-title]");
  const items = all(root, "[data-hero-item]");
  const frames = all(root, "[data-frame]");
  const core = one(root, "[data-engine-core]");
  const leds = all(root, "[data-led]");
  const status = one(root, "[data-engine-status]");
  if (!title) return noop;
  if (reduced) {
    utils.set(leds, { "--lit": 1 });
    if (status) status.textContent = "Engine online";
    return noop;
  }

  const split = splitText(title, { words: { wrap: "clip" }, chars: true });
  utils.set(split.chars, { y: "115%" });
  utils.set(items, { opacity: 0, "--rise": 24 });
  utils.set(frames, { "--drop": 320, opacity: 0 });
  if (core) utils.set(core, { "--boot": 0 });

  const ledsOn = 620;
  const ledStep = 200;
  const online = ledsOn + leds.length * ledStep + 300;

  const intro = createTimeline({ defaults: { ease: "out(4)" } })
    .add(split.chars, { y: "0%", duration: 900, delay: stagger(14) }, 120)
    .add(items, { opacity: 1, "--rise": 0, duration: 900, delay: stagger(110) }, 520)
    .add(
      frames,
      {
        "--drop": 0,
        opacity: 1,
        duration: 1100,
        ease: "outBack(1.2)",
        delay: stagger(55, { from: "center" }),
      },
      240,
    )
    .add(leds, { "--amber": [0, 1], duration: 90, delay: stagger(ledStep) }, ledsOn)
    .add(leds, { "--lit": [0, 1], duration: 160 }, online);
  if (core)
    intro.add(core, { "--boot": [0, 1], duration: 900, ease: "outBack(1.6)" }, online - 200);
  intro.call(() => {
    if (status) scramble(status, "Engine online", "lowercase");
  }, online);

  return () => {
    split.revert();
  };
}

function clipEngine(root: HTMLElement, reduced: boolean): Cleanup {
  const spine = one(root, "[data-spine]");
  const rig = one(root, "[data-engine-rig]");
  const spinner = one(root, "[data-engine-spin]");
  if (!spine || !rig || !spinner) return noop;

  const core = one(root, "[data-engine-core]");
  const frames = all(root, "[data-frame]");
  const hooks = frames.filter((frame) => frame.dataset.slot === String(HOOK_SLOT));
  const scan = one(root, "[data-scan]");
  const blades = one(root, "[data-blades]");
  const mode = one(root, "[data-engine-mode]");
  const stageLabel = one(root, "[data-engine-stage]");
  const clock = one(root, "[data-engine-tc]");
  const flag = one(root, "[data-engine-live]");
  const fills = all(root, "[data-step-fill]");

  const showFlag = (index: number) => {
    if (!flag) return;
    const live = ENGINE_STAGES[index].live;
    flag.textContent = live ? "Live" : "Rolling out";
    flag.dataset.live = String(live);
  };

  if (reduced) {
    const still = stageIndex("publish");
    applyStage(frames, rig, core, still);
    hooks.forEach((hook) => hook.style.setProperty("--ok", "1"));
    if (mode) mode.textContent = ENGINE_STAGES[still].mode;
    if (stageLabel) stageLabel.textContent = `${pad(still)}/${pad(LAST_STAGE)}`;
    showFlag(still);
    return noop;
  }

  const cube = core
    ? animate(core, { "--cube": [0, 360], duration: 16000, ease: "linear", loop: true })
    : null;

  const spin = { deg: 0 };
  const paintSpin = () => spinner.style.setProperty("--spin", String(spin.deg));
  let spinning: JSAnimation | null = null;
  let settling: JSAnimation | null = null;
  const startSpin = () => {
    if (spinning) return;
    settling?.pause();
    settling = null;
    const from = spin.deg;
    spinning = animate(spin, {
      deg: [from, from + 360],
      duration: SPIN_MS,
      ease: "linear",
      loop: true,
      onUpdate: paintSpin,
    });
  };
  const stopSpin = () => {
    if (!spinning) return;
    spinning.pause();
    spinning = null;
    settling = animate(spin, {
      deg: Math.round(spin.deg / 360) * 360,
      duration: 900,
      ease: "out(3)",
      onUpdate: paintSpin,
    });
  };

  let current = -1;
  const setStage = (index: number) => {
    if (index === current) return;
    current = index;
    if (mode) scramble(mode, ENGINE_STAGES[index].mode);
    if (stageLabel) stageLabel.textContent = `${pad(index)}/${pad(LAST_STAGE)}`;
    showFlag(index);
    if (spinsAt(index)) startSpin();
    else stopSpin();
  };

  const at = (stage: number, offset = 0) => stage * STAGE_MS + offset;

  const run = createTimeline({
    defaults: { duration: STAGE_MS, ease: "inOut(2)" },
    onUpdate: (timeline) => {
      setStage(Math.round(timeline.progress * LAST_STAGE));
      if (clock) clock.textContent = timecode(timeline.progress);
    },
    autoplay: onScroll({
      target: spine,
      enter: "top top",
      leave: "bottom bottom",
      sync: 0.25,
    }),
  });

  for (let stage = 1; stage <= LAST_STAGE; stage++) {
    const from = rigPose(stage - 1);
    const to = rigPose(stage);
    run.add(frames, frameTween(stage), at(stage - 1));
    run.add(
      rig,
      {
        "--cam-rx": [from.rx, to.rx],
        "--cam-ry": [from.ry, to.ry],
        "--zoom": [from.zoom, to.zoom],
      },
      at(stage - 1),
    );
    if (core) run.add(core, { "--core": [from.core, to.core] }, at(stage - 1));
  }

  const detect = stageIndex("detect");
  if (scan) {
    run
      .add(scan, { "--scan-o": [0, 1], duration: 150 }, at(detect - 1))
      .add(
        scan,
        { "--scan": [SCAN_RANGE[0], SCAN_RANGE[1]], duration: 900, ease: "linear" },
        at(detect - 1),
      )
      .add(scan, { "--scan-o": [1, 0], duration: 200 }, at(detect - 1, 800));
  }

  const cut = stageIndex("cut");
  if (blades) {
    run
      .add(blades, { "--blade-o": [0, 1], duration: 120 }, at(cut - 1))
      .add(blades, { "--blade-o": [1, 0], duration: 380 }, at(cut - 1, 380));
  }

  run
    .add(
      hooks,
      { "--ok": [0, 1], duration: 320, delay: stagger(150) },
      at(stageIndex("approve") - 1, 350),
    )
    .add(hooks, { "--ok": [1, 0], duration: 250 }, at(stageIndex("library") - 1));

  const panel = (name: string, enter: number, exit: number) => {
    const el = one(root, `[data-panel="${name}"]`);
    if (!el) return;
    const rows = all(el, "[data-panel-row]");
    run
      .add(el, { opacity: [0, 1], "--rise": [18, 0], duration: 350 }, at(enter - 1, 400))
      .add(rows, { opacity: [0.25, 1], duration: 260, delay: stagger(110) }, at(enter - 1, 520))
      .add(el, { opacity: 0, "--rise": -12, duration: 300 }, at(exit - 1, 250));
  };

  panel("pipeline", stageIndex("ingest"), stageIndex("approve"));
  panel("approve", stageIndex("approve"), stageIndex("publish"));
  panel("publish", stageIndex("publish"), stageIndex("library"));
  panel("library", stageIndex("library"), stageIndex("agent"));
  panel("agent", stageIndex("agent"), stageIndex("online"));

  fills.forEach((fill, index) =>
    run.add(fill, { scaleX: [0, 1], duration: 850, ease: "linear" }, at(index, 100)),
  );

  setStage(0);
  return () => {
    spinning?.pause();
    settling?.pause();
    cube?.pause();
  };
}

function scrollReveals(root: HTMLElement, reduced: boolean): Cleanup {
  if (reduced) return noop;
  const splitters = all(root, "[data-split]").map((heading) => {
    const split = splitText(heading, { words: { wrap: "clip" } });
    animate(split.words, {
      y: ["110%", "0%"],
      opacity: [0, 1],
      filter: ["blur(8px)", "blur(0px)"],
      duration: 600,
      ease: "out(3)",
      delay: stagger(70),
      autoplay: onScroll({
        target: heading,
        enter: "bottom top",
        leave: "bottom-=36% top",
        sync: 0.4,
      }),
    });
    return split;
  });

  all(root, "[data-reveal]").forEach((el) => {
    animate(el, {
      opacity: [0, 1],
      "--rise": [28, 0],
      duration: 600,
      ease: "out(3)",
      autoplay: onScroll({ target: el, enter: "bottom top", leave: "bottom-=24% top", sync: 0.4 }),
    });
  });

  all(root, "[data-stagger]").forEach((group) => {
    const items = Array.from(group.children) as HTMLElement[];
    utils.set(items, { opacity: 0, "--rise": 24 });
    animate(items, {
      opacity: 1,
      "--rise": 0,
      duration: 700,
      ease: "out(3)",
      delay: stagger(55),
      autoplay: onScroll({ target: group, enter: "bottom-=8% top", repeat: false }),
    });
  });

  return () => splitters.forEach((split) => split.revert());
}

function scrollHud(root: HTMLElement, reduced: boolean): Cleanup {
  const hud = one(root, "[data-hud]");
  if (!hud) return noop;
  const index = one(hud, "[data-hud-index]");
  const label = one(hud, "[data-hud-label]");
  const pct = one(hud, "[data-hud-pct]");
  const ruler = one(hud, "[data-hud-ruler]");
  const head = one(hud, "[data-hud-head]");
  const chapters = all(root, "[data-chapter]");
  if (!chapters.length || !ruler || !head) return noop;

  const names = chapters.map((chapter) => chapter.dataset.chapter ?? "");
  let active = -1;
  const setActive = (next: number) => {
    if (next === active) return;
    active = next;
    if (index) index.textContent = `${pad(next + 1)}/${pad(chapters.length)}`;
    if (!label) return;
    if (reduced) label.textContent = names[next];
    else scramble(label, names[next], "lowercase");
  };
  const locate = () => {
    const middle = window.innerHeight * 0.5;
    let found = 0;
    chapters.forEach((chapter, i) => {
      if (chapter.getBoundingClientRect().top <= middle) found = i;
    });
    setActive(found);
  };

  const observer = onScroll({
    target: root,
    enter: "top top",
    leave: "bottom bottom",
    sync: reduced ? true : 0.7,
    onUpdate: (self) => {
      if (pct) pct.textContent = pad(Math.round(self.progress * 100), 3);
      locate();
    },
  });
  animate(head, { x: [0, ruler.clientWidth], ease: "linear", duration: 1000, autoplay: observer });
  locate();
  return noop;
}

function magnets(root: HTMLElement, reduced: boolean): Cleanup {
  if (reduced || !window.matchMedia("(pointer: fine)").matches) return noop;
  const pulls = new WeakMap<HTMLElement, AnimatableObject>();
  const magnetOf = (target: EventTarget | null) => {
    const el = target instanceof Element ? target.closest<HTMLElement>("[data-magnet]") : null;
    return el && root.contains(el) ? el : null;
  };
  const pullOf = (el: HTMLElement) => {
    const existing = pulls.get(el);
    if (existing) return existing;
    const created = createAnimatable(el, { x: 450, y: 450, ease: "out(3)" });
    pulls.set(el, created);
    return created;
  };
  const move = (event: PointerEvent) => {
    const el = magnetOf(event.target);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pull = pullOf(el);
    pull.x((event.clientX - rect.left - rect.width / 2) * 0.28);
    pull.y((event.clientY - rect.top - rect.height / 2) * 0.4);
  };
  const out = (event: PointerEvent) => {
    const el = magnetOf(event.target);
    if (!el) return;
    if (event.relatedTarget instanceof Node && el.contains(event.relatedTarget)) return;
    const pull = pulls.get(el);
    pull?.x(0);
    pull?.y(0);
  };
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerout", out);
  return () => {
    root.removeEventListener("pointermove", move);
    root.removeEventListener("pointerout", out);
  };
}

export function mountLandingMotion(root: HTMLElement): Cleanup {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanups = [heroIntro, clipEngine, scrollReveals, scrollHud, magnets].map((mount) =>
    mount(root, reduced),
  );
  return () => cleanups.forEach((cleanup) => cleanup());
}

export function announce(el: HTMLElement | null, text: string) {
  if (!el) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = text;
    return;
  }
  scramble(el, text, "lowercase");
}
