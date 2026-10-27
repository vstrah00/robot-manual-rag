// Server/CLI module. Import it from server-only entry points, never the browser.
import { AppError } from "./errors";
import { createOpenAIClient, openAIError } from "./openai";

export function embeddingModel() {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
}

export async function embedTexts(texts: string[], signal?: AbortSignal) {
  if (!texts.length || texts.some((text) => !text.trim())) {
    throw new AppError("Cannot embed empty text.");
  }
  const client = createOpenAIClient();
  try {
    const result = await client.embeddings.create(
      {
        model: embeddingModel(),
        input: texts,
        encoding_format: "float",
      },
      { signal },
    );
    const ordered = [...result.data].sort((a, b) => a.index - b.index);
    if (
      ordered.length !== texts.length ||
      ordered.some((item, index) => item.index !== index)
    ) {
      throw new AppError(
        "The embedding service returned an incomplete result. Please try again.",
        502,
      );
    }
    return {
      vectors: ordered.map((item) => item.embedding),
      tokens: result.usage.total_tokens,
    };
  } catch (error) {
    throw openAIError(error, "embedding");
  }
}
