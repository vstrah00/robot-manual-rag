import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { parseManual } from "../src/lib/document";
import { selectContext } from "../src/lib/context-selection";
import { answerInput } from "../src/lib/answer";

// Deliberately recreate the reported failure: battery-related chunks rank ahead
// of requested sensors/motors. Coverage must not depend on lucky ranking.
const manual = parseManual(readFileSync("data/manual.md", "utf8"));
const ranked = [...manual].sort((a, b) =>
  Number(/battery|maintenance/i.test(b.title)) - Number(/battery|maintenance/i.test(a.title)),
).map((section, i) => ({ ...section, score: 1 - i / manual.length }));
const summary = "Summarize what the manual says about sensors, motors, battery handling, charging, classroom safety, programming, maintenance and troubleshooting.";

test("broad summary covers every manual section despite biased similarity ranking", () => {
  assert.ok(!ranked.slice(0, 3).some((source) => source.id === "section-4"));
  const result = selectContext(summary, ranked);
  assert.equal(result.sources.length, manual.length);
  assert.equal(result.retrieval.completeManual, true);
  assert.equal(result.retrieval.strategy, "manual-overview");
  assert.ok(result.sources.some((source) => source.id === "section-2"));
  assert.ok(result.sources.some((source) => source.id === "section-4"));
});

test("explicit sensor and motor topics survive low similarity ranks", () => {
  const result = selectContext("Explain the sensors and motors.", ranked);
  for (const id of ["section-2", "section-3", "section-4"])
    assert.ok(result.sources.some((source) => source.id === id), id);
  assert.equal(result.retrieval.strategy, "topic-coverage");
});

test("focused questions retain selective vector ranking", () => {
  const result = selectContext("How should I charge it?", ranked);
  assert.deepEqual(result.sources.map((source) => source.id), ranked.slice(0, 3).map((source) => source.id));
  assert.equal(result.retrieval.strategy, "focused");
});

test("budget preserves whole excerpts and cannot claim complete coverage", () => {
  const result = selectContext(summary, ranked, 600);
  assert.ok(result.retrieval.contextCharacters <= 600);
  assert.equal(result.retrieval.budgetLimited, true);
  assert.equal(result.retrieval.completeManual, false);
  for (const source of result.sources)
    assert.equal(source.text, manual.find((section) => section.id === source.id)?.text);
  const input = JSON.parse(answerInput(summary, result.sources, result.retrieval));
  assert.equal(input.contextScope, "selected_excerpts");
  assert.equal(input.budgetLimited, true);
});
