import "server-only";
import { readManualDocument } from "./document";
import { embedTexts, embeddingModel } from "./embeddings";
import { selectContext } from "./context-selection";
import { rankChunks } from "./similarity";
import { readVectorIndex } from "./vector-store";

export async function retrieveChunks(question: string, signal?: AbortSignal) {
  const document = await readManualDocument();
  // Check the index BEFORE making a paid query-embedding request.
  const index = await readVectorIndex(document.sourceHash, embeddingModel());
  const { vectors } = await embedTexts([question], signal);
  return {
    ...selectContext(question, rankChunks(vectors[0], index.chunks, index.chunks.length)),
    model: index.model,
  };
}
