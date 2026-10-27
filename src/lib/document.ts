import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ManualSection } from "./types";

export function parseManual(markdown: string): ManualSection[] {
  // One titled, self-contained paragraph per chunk suits this curated document.
  // No overlap is needed because we do not cut paragraphs mid-sentence.
  const sections = markdown
    .replace(/\r\n/g, "\n")
    .split(/^## /m)
    .slice(1)
    .map((section) => {
      const newline = section.indexOf("\n");
      const heading = section.slice(0, newline).trim();
      const number = heading.match(/^(\d+)\.\s+/)?.[1];
      if (!number || newline < 0)
        throw new Error("Manual sections need numbered headings.");
      return {
        id: `section-${number}`,
        title: heading.replace(/^\d+\.\s+/, ""),
        text: section.slice(newline + 1).trim(),
      };
    });
  if (
    !sections.length ||
    sections.some((section) => !section.text || !section.title)
  ) {
    throw new Error("The manual must contain non-empty numbered sections.");
  }
  if (new Set(sections.map((section) => section.id)).size !== sections.length) {
    throw new Error("Manual section numbers must be unique.");
  }
  return sections;
}

export async function readManualDocument() {
  const markdown = await readFile(
    path.join(process.cwd(), "data/manual.md"),
    "utf8",
  );
  return {
    sourceHash: createHash("sha256").update(markdown).digest("hex"),
    sections: parseManual(markdown),
  };
}

export async function readManualSections() {
  return (await readManualDocument()).sections;
}
