import { loadEnvConfig } from "@next/env";
import { readManualDocument } from "../src/lib/document";
import { embedTexts, embeddingModel } from "../src/lib/embeddings";
import { publicError } from "../src/lib/errors";
import { readVectorIndex, writeVectorIndex } from "../src/lib/vector-store";

async function main() {
  loadEnvConfig(process.cwd());
  const document = await readManualDocument();
  const model = embeddingModel();
  if (process.argv.includes("--dry-run")) {
    console.log(
      `Dry run: ${document.sections.length} chunks, model ${model}. No API requests.`,
    );
    for (const section of document.sections) {
      console.log(
        `${section.id}: ${section.title} (${section.text.length} characters)`,
      );
    }
    return;
  }
  if (!process.argv.includes("--force")) {
    try {
      const existing = await readVectorIndex(document.sourceHash, model);
      console.log(
        `Index is current: ${existing.chunks.length} chunks, ${model}. No API call needed.`,
      );
      return;
    } catch {
      /* A missing or outdated index needs a new embedding batch. */
    }
  }
  const texts = document.sections.map(
    (section) => `${section.title}\n\n${section.text}`,
  );
  const result = await embedTexts(texts);
  const dimensions = result.vectors[0]?.length ?? 0;
  await writeVectorIndex({
    version: 1,
    model,
    sourceHash: document.sourceHash,
    dimensions,
    createdAt: new Date().toISOString(),
    chunks: document.sections.map((section, index) => ({
      ...section,
      embedding: result.vectors[index],
    })),
  });
  console.log(
    `Indexed ${texts.length} chunks with ${model} (${dimensions} dimensions).`,
  );
  console.log(
    `Embedding input: ${result.tokens} tokens. Saved to data/index.json.`,
  );
}

main().catch((error) => {
  console.error(publicError(error).message);
  process.exitCode = 1;
});
