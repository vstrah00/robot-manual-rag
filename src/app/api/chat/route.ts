import { parseHistory } from "@/lib/conversation";
import { resolveQuestion } from "@/lib/resolve-question";
import { loadRetrievalIndex, retrieveChunks } from "@/lib/retrieval";
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
    const history = parseHistory(body && typeof body === "object" && "history" in body ? body.history : undefined);
    const index = await loadRetrievalIndex();
    const retrievalQuestion = await resolveQuestion(question.trim(), history, request.signal);
    const result = await retrieveChunks(retrievalQuestion, request.signal, index);
    const generated = await generateAnswer(
      retrievalQuestion,
      result.sources,
      request.signal,
      result.retrieval,
    );

    const response: ChatResponse = {
      mode: "answer",
      retrievalQuestion,
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
