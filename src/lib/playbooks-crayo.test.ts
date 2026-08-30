import assert from "node:assert/strict";
import { test } from "node:test";
import { crayoHermesPlaybooks, playbookById } from "./playbooks.ts";

test("Crayo playbooks are in the Hermes catalog and never start Daytona", () => {
  const short = playbookById("crayo_short_to_library");
  const auto = playbookById("crayo_autoclip_to_library");
  assert.ok(short);
  assert.ok(auto);
  assert.equal(short?.tools.includes("crayo.run_short"), true);
  assert.equal(auto?.tools.includes("crayo.run_autoclip"), true);
  assert.equal(short?.tools.some((tool) => tool.startsWith("computer.")), false);
  assert.match(short?.guardrail ?? "", /Never start the Social Machine/);
  const listed = crayoHermesPlaybooks();
  assert.equal(listed.length, 2);
  assert.equal(listed[0]?.id, "crayo_short_to_library");
});
