import "server-only";
import { ANSWER_INSTRUCTIONS, answerInput, validateAnswer } from "./answer";
import { AppError } from "./errors";
import { createOpenAIClient, openAIError } from "./openai";
import type { RetrievedSource } from "./types";

export function answerModel() {
  return process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-6-luna";
}

export async function generateAnswer(
  question: string,
  sources: RetrievedSource[],
  signal?: AbortSignal,
) {
  if (!sources.length)
    throw new AppError(
      "No manual excerpts are available to answer this question.",
      503,
    );
  const client = createOpenAIClient();
  const model = answerModel();
  try {
    const response = await client.responses.create(
      {
        model,
        instructions: ANSWER_INSTRUCTIONS,
        input: answerInput(question, sources),
        store: false,
        reasoning: { effort: "none" },
        max_output_tokens: 700,
        text: {
          format: {
            type: "json_schema",
            name: "manual_answer",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                answer: { type: "string" },
                status: {
                  type: "string",
                  enum: ["supported", "partial", "not_in_manual"],
                },
                sourceIds: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: sources.map((source) => source.id),
                  },
                },
              },
              required: ["answer", "status", "sourceIds"],
            },
          },
        },
      },
      { signal },
    );
    if (response.status !== "completed" || !response.output_text) {
      throw new AppError(
        "The model could not complete an answer. Please try again.",
        502,
      );
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(response.output_text);
    } catch {
      throw new AppError(
        "The model returned an unreadable answer. Please try again.",
        502,
      );
    }
    return { ...validateAnswer(parsed, sources), model };
  } catch (error) {
    throw openAIError(error, "answer-generation");
  }
}
