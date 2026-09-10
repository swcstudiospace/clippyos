import assert from "node:assert/strict";
import { test } from "node:test";
import { isMissingColumn, isMissingTable } from "./mappers.ts";

test("PGRST205 schema-cache miss is a missing table, not a missing column", () => {
  const error = {
    code: "PGRST205",
    message: "Could not find the table 'public.social_posts' in the schema cache",
  };
  assert.equal(isMissingTable(error), true);
  assert.equal(isMissingColumn(error), false);
});

test("Postgres 42P01-style relation missing is a missing table", () => {
  const error = { message: 'relation "media_assets" does not exist' };
  assert.equal(isMissingTable(error), true);
});

test("PGRST204 column miss is a missing column, not a missing table", () => {
  const byCode = { code: "PGRST204" };
  assert.equal(isMissingColumn(byCode), true);
  assert.equal(isMissingTable(byCode), false);

  const byMessage = { message: "column X does not exist" };
  assert.equal(isMissingColumn(byMessage), true);
  assert.equal(isMissingTable(byMessage), false);
});

test("null and empty errors are neither missing table nor missing column", () => {
  assert.equal(isMissingTable(null), false);
  assert.equal(isMissingColumn(null), false);

  const empty = {};
  assert.equal(isMissingTable(empty), false);
  assert.equal(isMissingColumn(empty), false);
});
