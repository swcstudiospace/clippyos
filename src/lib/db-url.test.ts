import assert from "node:assert/strict";
import { test } from "node:test";
import { isSupabasePoolerUrl, preferTransactionPooler } from "./db-url.ts";

const SESSION = "postgresql://postgres.abc:pw%40ss@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require";

test("preferTransactionPooler moves a Supabase session-mode pooler URL to port 6543", () => {
  const out = preferTransactionPooler(SESSION, undefined);
  assert.match(out, /pooler\.supabase\.com:6543\/postgres\?sslmode=require$/);
  assert.match(out, /postgres\.abc:pw%40ss@/);
  assert.equal(isSupabasePoolerUrl(SESSION), true);
});

test("preferTransactionPooler leaves other URLs and explicit session mode alone", () => {
  assert.equal(preferTransactionPooler(SESSION, "session"), SESSION);
  const already = SESSION.replace(":5432", ":6543");
  assert.equal(preferTransactionPooler(already, undefined), already);
  const direct = "postgresql://postgres:pw@db.abc.supabase.co:5432/postgres";
  assert.equal(preferTransactionPooler(direct, undefined), direct);
  const neon = "postgresql://u:p@ep-x.us-east-1.aws.neon.tech/neondb?sslmode=require";
  assert.equal(preferTransactionPooler(neon, undefined), neon);
  assert.equal(preferTransactionPooler("", undefined), "");
  assert.equal(preferTransactionPooler("not a url", undefined), "not a url");
});
