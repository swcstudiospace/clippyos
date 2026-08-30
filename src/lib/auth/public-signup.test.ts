import assert from "node:assert/strict";
import { test } from "node:test";
import { publicSignUpEnabled } from "./public-signup.ts";

test("public self-serve signup stays off for the paid workspace", () => {
  assert.equal(publicSignUpEnabled, false);
});
