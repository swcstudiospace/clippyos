import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveGoogleSocial } from "./google-social.ts";

test("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET configure native Google", () => {
  const resolved = resolveGoogleSocial({
    GOOGLE_CLIENT_ID: "gid",
    GOOGLE_CLIENT_SECRET: "gsecret",
  });
  assert.deepEqual(resolved, { clientId: "gid", clientSecret: "gsecret" });
});

test("missing or blank Google credentials resolve to null", () => {
  assert.equal(resolveGoogleSocial({}), null);
  assert.equal(resolveGoogleSocial({ GOOGLE_CLIENT_ID: "gid" }), null);
  assert.equal(resolveGoogleSocial({ GOOGLE_CLIENT_SECRET: "gsecret" }), null);
  assert.equal(
    resolveGoogleSocial({ GOOGLE_CLIENT_ID: "  ", GOOGLE_CLIENT_SECRET: "gsecret" }),
    null,
  );
  assert.equal(
    resolveGoogleSocial({ GOOGLE_CLIENT_ID: "gid", GOOGLE_CLIENT_SECRET: "" }),
    null,
  );
});

test("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET aliases configure native Google", () => {
  const resolved = resolveGoogleSocial({
    AUTH_GOOGLE_ID: "alias-id",
    AUTH_GOOGLE_SECRET: "alias-secret",
  });
  assert.deepEqual(resolved, { clientId: "alias-id", clientSecret: "alias-secret" });
});
