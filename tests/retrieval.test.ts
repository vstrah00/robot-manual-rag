import assert from "node:assert/strict";
import test from "node:test";
import { parseManual } from "../src/lib/document";
import { cosineSimilarity, rankChunks } from "../src/lib/similarity";
import { validateIndex, type VectorIndex } from "../src/lib/vector-store";

test("chunking preserves source headings and complete paragraph text", () => {
  assert.deepEqual(
    parseManual(
      "# Robot\n\nIntroduction.\n\n## 2. Motors\n\nLeft wheel. Right wheel.\n\n## 3. Battery\n\nKeep dry.",
    ),
    [
      { id: "section-2", title: "Motors", text: "Left wheel. Right wheel." },
      { id: "section-3", title: "Battery", text: "Keep dry." },
    ],
  );
  assert.equal(
    parseManual("## 1. Motors\r\n\r\nTurn wheels.")[0].text,
    "Turn wheels.",
  );
});

test("invalid or duplicate sections cannot silently replace sources", () => {
  assert.throws(() => parseManual("No headings"));
  assert.throws(() => parseManual("## 1. Empty\n\n"));
  assert.throws(() => parseManual("## 1. A\nFirst\n## 1. B\nSecond"));
});

test("cosine measures direction rather than vector magnitude", () => {
  assert.ok(Math.abs(cosineSimilarity([1, 2], [10, 20]) - 1) < 1e-10);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1);
});

test("incompatible and invalid vectors fail instead of yielding misleading scores", () => {
  for (const vector of [[], [0, 0], [NaN, 1], [Infinity, 1], [1, 2, 3]]) {
    assert.throws(() => cosineSimilarity([1, 0], vector));
  }
});

test("retrieval sorts by score, respects top-k, and never returns raw embeddings", () => {
  const chunks = [
    { id: "a", title: "Battery", text: "Power.", embedding: [0, 1] },
    { id: "b", title: "Motors", text: "Movement.", embedding: [1, 0] },
    { id: "c", title: "Programming", text: "Instructions.", embedding: [1, 1] },
  ];
  const result = rankChunks([1, 0], chunks, 2);
  assert.deepEqual(
    result.map((source) => source.id),
    ["b", "c"],
  );
  assert.ok(result.every((source) => !("embedding" in source)));
  assert.equal(chunks.length, 3);
});

const fixture: VectorIndex = {
  version: 1,
  model: "embedding-test",
  sourceHash: "hash-a",
  dimensions: 2,
  createdAt: "2026-10-21T00:00:00Z",
  chunks: [{ id: "a", title: "Motors", text: "Movement.", embedding: [1, 0] }],
};

test("stale documents and different embedding models require rebuilding", () => {
  assert.equal(validateIndex(fixture, "hash-a", "embedding-test"), fixture);
  assert.throws(
    () => validateIndex(fixture, "hash-b", "embedding-test"),
    /changed/,
  );
  assert.throws(
    () => validateIndex(fixture, "hash-a", "different-model"),
    /changed/,
  );
});

test("corrupt indexes are rejected before ranking", () => {
  for (const value of [
    null,
    {},
    { ...fixture, dimensions: 3 },
    { ...fixture, chunks: [] },
    { ...fixture, chunks: [fixture.chunks[0], fixture.chunks[0]] },
    { ...fixture, chunks: [{ ...fixture.chunks[0], embedding: [0, 0] }] },
  ]) {
    assert.throws(() => validateIndex(value, "hash-a", "embedding-test"));
  }
});
