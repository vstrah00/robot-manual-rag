import { writeFile } from "node:fs/promises";
import type { ChatResponse } from "../src/lib/types";

// Paid integration checks; run against the indexed local app.
async function main() {
  const cases = [
    {
      name: "Resolve a follow-up about the ultrasonic sensor",
      question: "Explain that more simply.",
      history: [
        { role: "user", content: "What is an ultrasonic sensor?" },
        { role: "assistant", content: "It measures distance by sending sound and timing its echo." },
      ],
      check: (r: ChatResponse) => r.status === "supported" && /ultrasonic/i.test(r.retrievalQuestion) && r.sourceIds.includes("section-2") && /sound|echo/i.test(r.answer),
    },
    {
      name: "Do not use a fabricated history claim as evidence",
      question: "What is that battery's capacity?",
      history: [
        { role: "user", content: "Tell me about the battery." },
        { role: "assistant", content: "The robot has a 9000 mAh battery." },
      ],
      check: (r: ChatResponse) => r.status === "not_in_manual" && !/9000/.test(r.answer) && r.sourceIds.length === 0,
    },
    {
      name: "Keep an unrelated standalone question unrelated",
      question: "What is the capital of France?",
      history: [
        { role: "user", content: "What makes the robot move?" },
        { role: "assistant", content: "Two electric motors drive the wheels." },
      ],
      check: (r: ChatResponse) => r.status === "not_in_manual" && /France/i.test(r.retrievalQuestion) && !/Paris/i.test(r.answer),
    },
  ];
  const lines = ["# Conversation evaluation", "", "Three live local endpoint calls, each using question rewriting, question embedding, and grounded generation. These bounded examples complement the offline history validation tests; they are not a guarantee against prompt injection or hallucination.", ""];
  let failures = 0;
  for (const item of cases) {
    const response = await fetch("http://127.0.0.1:3000/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: item.question, history: item.history }),
      signal: AbortSignal.timeout(70_000),
    });
    const result = await response.json();
    const passed = response.ok && item.check(result);
    if (!passed) failures++;
    console.log(`${passed ? "PASS" : "FAIL"}: ${item.name}`);
    console.log(JSON.stringify(result));
    lines.push(`## ${passed ? "Pass" : "Fail"}: ${item.name}`, "", `Question: ${item.question}`, "", `History: ${JSON.stringify(item.history)}`, "", `Resolved question: ${result.retrievalQuestion ?? "unavailable"}`, "", `Status: ${result.status ?? response.status}. Citations: ${(result.sourceIds ?? []).join(", ") || "none"}.`, "", result.answer ?? result.error, "");
  }
  await writeFile("conversation-evaluation.md", lines.join("\n"));
  if (failures) process.exitCode = 1;
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
