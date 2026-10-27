import { writeFile } from "node:fs/promises";

// Paid integration checks against a running local app: one embedding request
// and one generation request per question. npm test stays fully offline.
import { evaluationCases as cases, qualityFailures } from "./evaluation-cases";

async function main() {
  const results = [];
  let failures = 0;
  for (const item of cases) {
    const response = await fetch("http://127.0.0.1:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: item.question }),
      signal: AbortSignal.timeout(50_000),
    });
    const result = await response.json();
    const sourceIds: unknown = result.sourceIds;
    const validCitations =
      Array.isArray(sourceIds) &&
      Array.isArray(result.sources) &&
      sourceIds.every((id) =>
        result.sources.some((source: { id: string }) => source.id === id),
      );
    const qualityIssues = qualityFailures(item, result.answer ?? "");
    const passed =
      response.ok &&
      result.mode === "answer" &&
      result.status === item.status &&
      validCitations &&
      (item.sources.length ? item.sources.every((id) => sourceIds.includes(id)) : sourceIds.length === 0) &&
      (!item.completeManual || result.retrieval?.completeManual === true) &&
      qualityIssues.length === 0;
    if (!passed) failures++;
    console.log(`${passed ? "PASS" : "FAIL"}: ${item.question}`);
    if (!response.ok) {
      // The API returns intentionally safe errors, never provider request details.
      throw new Error(result.error || "Chat endpoint failed.");
    }
    console.log(`  ${result.status}: ${result.answer}`);
    for (const issue of qualityIssues) console.log(`  ${issue}`);
    results.push({
      question: item.question,
      expectedStatus: item.status,
      requiredFacts: item.requiredFacts.map((check) => check.description),
      forbiddenClaims: (item.forbiddenClaims ?? []).map((check) => check.description),
      qualityIssues,
      passed,
      ...result,
    });
  }
  const lines = [
    "# Live answer evaluation",
    "",
    `${cases.length} calls through the real local HTTP endpoint. Each makes an embedding request and a generation request.`,
    "",
    "Automated checks cover status, required citations, retrieval coverage, required fact signals, and forbidden claim patterns. Patterns allow paraphrases but are heuristic; inspect the recorded answers against their excerpts. This small set is not proof against hallucination.",
    "",
  ];
  for (const result of results) {
    lines.push(
      `## ${result.passed ? "Pass" : "Fail"}: ${result.question}`,
      "",
      `Expected: ${result.expectedStatus}. Returned: ${result.status}. Model: ${result.model}.`,
      "",
      `Required facts: ${result.requiredFacts.join("; ") || "none"}.`,
      `Forbidden claims: ${result.forbiddenClaims.join("; ") || "none"}.`,
      `Quality findings: ${result.qualityIssues.join("; ") || "none"}.`,
      "",
      result.answer,
      "",
      `Cited sources: ${result.sourceIds.join(", ") || "none"}.`,
      "",
    );
  }
  lines.push(
    `Result: ${cases.length - failures}/${cases.length} automated checks passed.`,
    "",
  );
  await writeFile("answer-evaluation.md", lines.join("\n"));
  if (failures) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Evaluation failed.");
  process.exitCode = 1;
});
