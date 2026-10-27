import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "./errors";
import { validVector, type EmbeddedChunk } from "./similarity";

export type VectorIndex = {
  version: 1;
  model: string;
  sourceHash: string;
  dimensions: number;
  createdAt: string;
  chunks: EmbeddedChunk[];
};

const rebuild = "Run npm run index:manual to rebuild the index.";
export function validateIndex(
  value: unknown,
  sourceHash: string,
  model: string,
): VectorIndex {
  const index = value as Partial<VectorIndex> | null;
  if (
    !index ||
    index.version !== 1 ||
    typeof index.model !== "string" ||
    typeof index.sourceHash !== "string" ||
    typeof index.createdAt !== "string" ||
    !Number.isInteger(index.dimensions) ||
    (index.dimensions ?? 0) < 1 ||
    !Array.isArray(index.chunks) ||
    !index.chunks.length
  ) {
    throw new AppError(`The saved vector index is invalid. ${rebuild}`, 503);
  }
  if (index.model !== model || index.sourceHash !== sourceHash) {
    throw new AppError(
      `The manual or embedding model changed. ${rebuild}`,
      409,
    );
  }
  const ids = new Set<string>();
  for (const chunk of index.chunks) {
    if (
      !chunk ||
      typeof chunk.id !== "string" ||
      !chunk.id ||
      ids.has(chunk.id) ||
      typeof chunk.title !== "string" ||
      !chunk.title ||
      typeof chunk.text !== "string" ||
      !chunk.text ||
      !validVector(chunk.embedding) ||
      chunk.embedding.length !== index.dimensions
    ) {
      throw new AppError(
        `The saved vector index contains invalid chunks. ${rebuild}`,
        503,
      );
    }
    ids.add(chunk.id);
  }
  return index as VectorIndex;
}

export async function readVectorIndex(
  sourceHash: string,
  model: string,
): Promise<VectorIndex> {
  let raw: string;
  try {
    raw = await readFile(path.join(process.cwd(), "data/index.json"), "utf8");
  } catch {
    throw new AppError(`No readable vector index was found. ${rebuild}`, 503);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError(`The vector index is not valid JSON. ${rebuild}`, 503);
  }
  return validateIndex(parsed, sourceHash, model);
}

export async function writeVectorIndex(index: VectorIndex) {
  validateIndex(index, index.sourceHash, index.model);
  const destination = path.join(process.cwd(), "data/index.json");
  const temporary = `${destination}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(index), { mode: 0o600 });
  // Publish only a complete file, so requests cannot see a half-written index.
  await rename(temporary, destination);
}
