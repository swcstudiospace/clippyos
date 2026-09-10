import assert from "node:assert/strict";
import { test } from "node:test";
import {
  editableTextToStrategy,
  parseStrategy,
  serializeStrategy,
  strategyToEditableText,
} from "./strategy.ts";

test("strategyToEditableText renders bullets, style, and growth as readable lines", () => {
  const raw = serializeStrategy({
    bullets: [
      { title: "Post a weekly recap", reasoning: "Recaps drive returning views." },
      { title: "Try longer intros", reasoning: "" },
    ],
    style: "High-energy reaction format",
    growth: "Collab with adjacent creators",
  });
  const text = strategyToEditableText(raw);
  assert.equal(
    text,
    [
      "- Post a weekly recap",
      "  Recaps drive returning views.",
      "- Try longer intros",
      "Style: High-energy reaction format",
      "Growth: Collab with adjacent creators",
    ].join("\n"),
  );
});

test("editableTextToStrategy round-trips through parseStrategy", () => {
  const text = [
    "- Post a weekly recap",
    "  Recaps drive returning views.",
    "- Try longer intros",
    "Style: High-energy reaction format",
    "Growth: Collab with adjacent creators",
  ].join("\n");
  const doc = parseStrategy(editableTextToStrategy(text));
  assert.deepEqual(doc.bullets, [
    { title: "Post a weekly recap", reasoning: "Recaps drive returning views." },
    { title: "Try longer intros", reasoning: "" },
  ]);
  assert.equal(doc.style, "High-energy reaction format");
  assert.equal(doc.growth, "Collab with adjacent creators");
});

test("editableTextToStrategy produces valid JSON parseStrategy reads structurally, not as a single fallback bullet", () => {
  // Regression: saveClient previously ran the whole serialized JSON string
  // through an HTML-escaper, turning every `"` into `&quot;` and corrupting
  // the structure so parseStrategy's JSON.parse failed and fell back to
  // treating the entire blob as one plain-text bullet.
  const serialized = editableTextToStrategy('- Cover "breaking news" reactions');
  assert.doesNotThrow(() => JSON.parse(serialized));
  const doc = parseStrategy(serialized);
  assert.equal(doc.bullets.length, 1);
  assert.equal(doc.bullets[0]?.title, 'Cover "breaking news" reactions');
});

test("editableTextToStrategy stores bullet text raw, not HTML-escaped", () => {
  // StrategyBullet renders {title} as a plain React text node, which already
  // escapes on display — pre-escaping here would show a literal "&lt;" to
  // the user instead of the "<" they typed.
  const doc = parseStrategy(editableTextToStrategy("- Try <script>alert(1)</script> titles"));
  assert.equal(doc.bullets[0]?.title, "Try <script>alert(1)</script> titles");
});

test("parseStrategy recovers legacy rows corrupted by the HTML-escaping bug", () => {
  // Rows saved before the clients.ts fix have their JSON's own quotes
  // HTML-escaped (`"` -> `&quot;`), so a direct JSON.parse fails. parseStrategy
  // should decode the entities and retry rather than dumping the raw blob as
  // a single fallback bullet.
  const corrupted =
    '{&quot;bullets&quot;:[{&quot;title&quot;:&quot;Ship a weekly recap&quot;,&quot;reasoning&quot;:&quot;&quot;}],&quot;style&quot;:&quot;Fast cuts&quot;}';
  const doc = parseStrategy(corrupted);
  assert.deepEqual(doc.bullets, [{ title: "Ship a weekly recap", reasoning: "" }]);
  assert.equal(doc.style, "Fast cuts");
});
