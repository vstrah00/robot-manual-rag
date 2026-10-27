import assert from "node:assert/strict";
import test from "node:test";
import { BROAD_SUMMARY, evaluationCases, qualityFailures } from "../scripts/evaluation-cases";

test("valid-looking citations cannot hide a false or incomplete summary", () => {
  const item = evaluationCases.find((item) => item.question === BROAD_SUMMARY)!;
  const issues = qualityFailures(item, "The manual covers battery handling, charging and maintenance. The manual does not explain how the sensors or motors work.");
  assert.ok(issues.some((issue) => issue.includes("Forbidden claim")));
  assert.ok(issues.some((issue) => issue.includes("Missing fact")));
});

test("quality rubric accepts different wording for motor turning", () => {
  const item = evaluationCases.find((item) => item.question === "How does the robot use motors?")!;
  for (const answer of [
    "Motors drive the wheels. Turning happens when the wheels move at different speeds.",
    "Two electric motors turn the wheels. Changing the relative wheel speeds makes the robot turn.",
  ]) assert.deepEqual(qualityFailures(item, answer), []);
});
