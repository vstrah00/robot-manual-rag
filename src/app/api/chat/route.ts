import { retrieveChunks } from "@/lib/retrieval";
import { publicError } from "@/lib/errors";
import { generateAnswer } from "@/lib/generation";
import { MAX_QUESTION_LENGTH, type ChatResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Send a valid JSON request." },
      { status: 400 },
    );
  }

  const question =
    body && typeof body === "object" && "question" in body
      ? body.question
      : undefined;

  if (typeof question !== "string" || !question.trim()) {
    return Response.json(
      { error: "Please enter a question." },
      { status: 400 },
    );
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return Response.json(
      { error: `Keep your question to ${MAX_QUESTION_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  try {
    const result = await retrieveChunks(question.trim(), request.signal);
    const generated = await generateAnswer(
      question.trim(),
      result.sources,
      request.signal,
      result.retrieval,
    );

    const response: ChatResponse = {
      mode: "answer",
      retrieval: result.retrieval,
      answer: generated.answer,
      sources: result.sources,
      model: generated.model,
      embeddingModel: result.model,
      status: generated.status,
      sourceIds: generated.sourceIds,
    };

    return Response.json(response, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const safe = publicError(error);
    return Response.json({ error: safe.message }, { status: safe.status });
  }
}
