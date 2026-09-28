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
} from "animejs";
import { ENGINE_STAGES, LAST_STAGE, engineStateAt, stageIndex, timecode } from "@/lib/clip-engine";
import type {
  EngineHandle,
  EngineTheme,
  EngineView,
} from "@/components/marketing/engine/clip-engine-scene";

type Cleanup = () => void;

const STAGE_MS = 1000;
const noop: Cleanup = () => {};

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

function currentTheme(): EngineTheme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function cameraText(progress: number) {
  const { cam } = engineStateAt(progress);
  const orbit = ((Math.round(cam.rot) % 360) + 360) % 360;
  return `orbit ${pad(orbit, 3)}° · pitch ${Math.round(cam.pitch)}° · dist ${cam.dist.toFixed(1)}`;
}

function heroIntro(root: HTMLElement, reduced: boolean): Cleanup {
  const title = one(root, "[data-hero-title]");
  const items = all(root, "[data-hero-item]");
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

  const ledsOn = 620;
  const ledStep = 200;
  const online = ledsOn + leds.length * ledStep + 300;

  createTimeline({ defaults: { ease: "out(4)" } })
    .add(split.chars, { y: "0%", duration: 900, delay: stagger(14) }, 120)
    .add(items, { opacity: 1, "--rise": 0, duration: 900, delay: stagger(110) }, 520)
    .add(leds, { "--amber": [0, 1], duration: 90, delay: stagger(ledStep) }, ledsOn)
    .add(leds, { "--lit": [0, 1], duration: 160 }, online)
    .call(() => {
      if (status) scramble(status, "Engine online", "lowercase");
    }, online);

  return () => {
    split.revert();
  };
}

function clipEngine(root: HTMLElement, reduced: boolean): Cleanup {
  const spine = one(root, "[data-spine]");
  const host = one(root, "[data-engine-host]");
  if (!spine || !host) return noop;

  const mode = one(root, "[data-engine-mode]");
  const stageLabel = one(root, "[data-engine-stage]");
  const clock = one(root, "[data-engine-tc]");
  const camLabel = one(root, "[data-engine-cam]");
  const flag = one(root, "[data-engine-live]");
  const fills = all(root, "[data-step-fill]");

  const view: EngineView = { progress: 0, assembly: reduced ? 1 : 0, px: 0, py: 0, pulse: 0 };
  let engine: EngineHandle | null = null;
  let disposed = false;
  const themeObserver = new MutationObserver(() => engine?.setTheme(currentTheme()));
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  import("@/components/marketing/engine/clip-engine-scene")
    .then(({ createClipEngine }) => {
      if (disposed) return;
      engine = createClipEngine(host, { theme: currentTheme(), reduced, view });
      if (!engine) host.dataset.fallback = "true";
    })
    .catch(() => {
      host.dataset.fallback = "true";
    });

  const showFlag = (index: number) => {
    if (!flag) return;
    const live = ENGINE_STAGES[index].live;
    flag.textContent = live ? "Live" : "Rolling out";
    flag.dataset.live = String(live);
  };

  const cleanup = () => {
    disposed = true;
    themeObserver.disconnect();
    engine?.dispose();
    engine = null;
  };

  if (reduced) {
    if (mode) mode.textContent = ENGINE_STAGES[0].mode;
    showFlag(0);
    return cleanup;
  }

  animate(view, { assembly: [0, 1], duration: 2600, delay: 250, ease: "out(2)" });

  let offPointer: Cleanup = noop;
  if (window.matchMedia("(pointer: fine)").matches) {
    const tilt = createAnimatable(view, { px: 1200, py: 1200, ease: "out(3)" });
    const move = (event: PointerEvent) => {
      tilt.px((event.clientX / window.innerWidth) * 2 - 1);
      tilt.py((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", move, { passive: true });
    offPointer = () => window.removeEventListener("pointermove", move);
  }

  let current = -1;
  let camText = "";
  const setStage = (index: number) => {
    if (index === current) return;
    const first = current === -1;
    current = index;
    if (mode) scramble(mode, ENGINE_STAGES[index].mode);
    if (stageLabel) stageLabel.textContent = `${pad(index)}/${pad(LAST_STAGE)}`;
    showFlag(index);
    if (!first) animate(view, { pulse: [1, 0], duration: 1100, ease: "out(3)" });
  };

  const at = (stage: number, offset = 0) => stage * STAGE_MS + offset;

  const run = createTimeline({
    defaults: { duration: STAGE_MS, ease: "inOut(2)" },
    onUpdate: (timeline) => {
      setStage(Math.round(timeline.progress * LAST_STAGE));
      if (clock) clock.textContent = timecode(timeline.progress);
      const nextCam = cameraText(timeline.progress * LAST_STAGE);
      if (camLabel && nextCam !== camText) {
        camText = nextCam;
        camLabel.textContent = nextCam;
      }
    },
    autoplay: onScroll({
      target: spine,
      enter: "top top",
      leave: "bottom bottom",
      sync: 0.25,
    }),
  });

  run.add(view, { progress: [0, LAST_STAGE], duration: LAST_STAGE * STAGE_MS, ease: "linear" }, 0);

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
    offPointer();
    cleanup();
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
