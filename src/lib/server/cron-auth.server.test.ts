import assert from "node:assert/strict";
import { test } from "node:test";
import { authorizeCronRequest } from "./cron-auth.server.ts";

function req(headers: Record<string, string>) {
  return {
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
  };
}

test("cron auth fails closed without CRON_SECRET even with x-vercel-cron", () => {
  assert.equal(authorizeCronRequest(req({ "x-vercel-cron": "1" }), {}), false);
  assert.equal(
    authorizeCronRequest(req({ "x-vercel-cron": "1", authorization: "Bearer x" }), { CRON_SECRET: "" }),
    false,
  );
});

test("cron auth requires a matching Bearer secret and ignores the Vercel header", () => {
  const env = { CRON_SECRET: "cron-test-secret" };
  assert.equal(authorizeCronRequest(req({ authorization: "Bearer cron-test-secret" }), env), true);
  assert.equal(authorizeCronRequest(req({ authorization: "Bearer other" }), env), false);
  assert.equal(authorizeCronRequest(req({ "x-vercel-cron": "1" }), env), false);
  assert.equal(
    authorizeCronRequest(req({ "x-vercel-cron": "1", authorization: "Bearer cron-test-secret" }), env),
    true,
  );
});
