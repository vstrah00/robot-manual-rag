import type { ManualSection, RetrievedSource } from "./types";

export type EmbeddedChunk = ManualSection & { embedding: number[] };

export function validVector(vector: unknown): vector is number[] {
  return (
    Array.isArray(vector) &&
    vector.length > 0 &&
    vector.every(
      (value) => typeof value === "number" && Number.isFinite(value),
    ) &&
    vector.some((value) => value !== 0)
  );
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (!validVector(a) || !validVector(b) || a.length !== b.length) {
    throw new Error(
      "Cosine similarity needs non-zero vectors of matching dimensions.",
    );
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return Math.max(-1, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB))));
}

export function rankChunks(
  query: number[],
  chunks: EmbeddedChunk[],
  limit = 3,
): RetrievedSource[] {
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error("The result limit must be a positive integer.");
  return chunks
    .map(({ embedding, ...source }) => ({
      ...source,
      score: cosineSimilarity(query, embedding),
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);
}
