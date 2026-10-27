import assert from "node:assert/strict";
import test from "node:test";
import { answerInput, validateAnswer } from "../src/lib/answer";
import { AppError } from "../src/lib/errors";
import { openAIError } from "../src/lib/openai";
import type { RetrievedSource } from "../src/lib/types";

const sources: RetrievedSource[] = [
  {
    id: "section-4",
    title: "Motors",
    text: "Two motors turn the wheels.",
    score: 0.6,
  },
];

test("generation input contains only the question and retrieved excerpt data", () => {
  const data = JSON.parse(answerInput("What makes it move?", sources));
  assert.equal(data.question, "What makes it move?");
  assert.deepEqual(data.excerpts, [
    { id: "section-4", title: "Motors", text: "Two motors turn the wheels." },
  ]);
  assert.ok(!("score" in data.excerpts[0]));
  assert.ok(!("embedding" in data.excerpts[0]));
});

test("supported and partial answers require retrieved source references", () => {
  for (const status of ["supported", "partial"]) {
    assert.equal(
      validateAnswer(
        {
          answer: " Two motors turn the wheels. ",
          status,
          sourceIds: ["section-4"],
        },
        sources,
      ).answer,
      "Two motors turn the wheels.",
    );
    assert.throws(() =>
      validateAnswer({ answer: "Motors.", status, sourceIds: [] }, sources),
    );
  }
});

test("invented or duplicate citations are rejected", () => {
  for (const sourceIds of [["section-99"], ["section-4", "section-4"], [42]]) {
    assert.throws(() =>
      validateAnswer(
        { answer: "Motors.", status: "supported", sourceIds },
        sources,
      ),
    );
  }
});

test("unsupported responses use a fixed abstention without outside facts", () => {
  const result = validateAnswer(
    {
      answer: "Paris is the capital of France.",
      status: "not_in_manual",
      sourceIds: [],
    },
    sources,
  );
  assert.equal(
    result.answer,
    "The retrieved excerpts do not provide enough information to answer that question.",
  );
  assert.equal(result.status, "not_in_manual");
  assert.deepEqual(result.sourceIds, []);
  assert.throws(() =>
    validateAnswer(
      { answer: "Unknown.", status: "not_in_manual", sourceIds: ["section-4"] },
      sources,
    ),
  );
});

test("malformed output cannot be displayed as an answer", () => {
  for (const value of [
    null,
    {},
    { answer: "", status: "supported", sourceIds: ["section-4"] },
    { answer: "Motors.", status: "guessed", sourceIds: ["section-4"] },
  ]) {
    assert.throws(() => validateAnswer(value, sources));
  }
});

test("untrusted errors cannot expose provider request details", () => {
  const error = openAIError(
    new Error("request contained secret-key-value"),
    "answer-generation",
  );
  assert.ok(error instanceof AppError);
  assert.ok(!error.message.includes("secret-key-value"));
  const known = new AppError("Safe message", 502);
  assert.equal(openAIError(known, "answer-generation"), known);
});
