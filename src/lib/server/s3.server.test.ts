import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalRequest, objectUrl } from "./s3.server.ts";
import { FILEBASE_ENDPOINT, parseS3Config } from "../social-machine.ts";

test("object URLs are path-style so Filebase/Storj/R2 work", () => {
  const config = parseS3Config({
    endpoint: FILEBASE_ENDPOINT,
    region: "us-east-1",
    bucket: "clippy-clips",
    accessKey: "keykeykeykey",
    secret: "secretsecretsecret",
  });
  assert.ok(config);
  assert.equal(
    objectUrl(config, "asset-1/v1.mp4"),
    "https://s3.filebase.com/clippy-clips/asset-1/v1.mp4",
  );
});

test("canonical request is stable for SigV4", () => {
  const canonical = canonicalRequest({
    method: "PUT",
    path: "/clippy-clips/a/b.mp4",
    headers: {
      Host: "s3.filebase.com",
      "x-amz-content-sha256": "abc",
      "x-amz-date": "20260822T000000Z",
    },
    payloadHash: "abc",
  });
  assert.match(canonical, /^PUT\n\/clippy-clips\/a\/b.mp4\n\n/);
  assert.match(canonical, /host:s3.filebase.com/);
  assert.match(canonical, /host;x-amz-content-sha256;x-amz-date\nabc$/);
});
