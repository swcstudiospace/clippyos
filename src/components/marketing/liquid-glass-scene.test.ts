import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LIQUID_GLASS_BACKGROUND_FRAGMENT,
  LIQUID_GLASS_BLOB_COUNT,
  LIQUID_GLASS_BLOB_FRAGMENT,
  liquidGlassShouldAnimate,
  mountLiquidGlassScene,
} from "./liquid-glass-scene.ts";

test("liquid glass background shader is mouse- and time-reactive", () => {
  assert.match(LIQUID_GLASS_BACKGROUND_FRAGMENT, /uniform float uTime/);
  assert.match(LIQUID_GLASS_BACKGROUND_FRAGMENT, /uniform vec2 uPointer/);
  assert.match(LIQUID_GLASS_BACKGROUND_FRAGMENT, /metaball/);
  assert.match(LIQUID_GLASS_BACKGROUND_FRAGMENT, /caustic/);
});

test("liquid glass blob shader uses fresnel glass", () => {
  assert.equal(LIQUID_GLASS_BLOB_COUNT, 8);
  assert.match(LIQUID_GLASS_BLOB_FRAGMENT, /fresnel/);
  assert.match(LIQUID_GLASS_BLOB_FRAGMENT, /iridescence/);
});

test("three.js scene stays still when the user prefers reduced motion", () => {
  assert.equal(
    liquidGlassShouldAnimate({ reducedMotion: true, documentHidden: false }),
    false,
  );
  assert.equal(
    liquidGlassShouldAnimate({ reducedMotion: false, documentHidden: true }),
    false,
  );
  assert.equal(
    liquidGlassShouldAnimate({ reducedMotion: false, documentHidden: false }),
    true,
  );
});

test("mounting the scene is a no-op without a window or when motion is reduced", () => {
  const reduced = mountLiquidGlassScene({} as HTMLElement, { reducedMotion: true });
  assert.equal(reduced.canvas, null);
  reduced.dispose();

  const headless = mountLiquidGlassScene({} as HTMLElement);
  assert.equal(headless.canvas, null);
  headless.dispose();
});
