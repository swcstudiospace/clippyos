import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDemoEmail, parseDemoName } from "./demo.ts";

test("demo email and name are strict", () => {
  assert.equal(parseDemoEmail("oveshen@studio.example"), "oveshen@studio.example");
  assert.equal(parseDemoEmail("not-an-email"), null);
  assert.equal(parseDemoName("Oveshen Govender"), "Oveshen Govender");
  assert.equal(parseDemoName("A"), null);
});
