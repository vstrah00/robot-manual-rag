import "server-only";

// The CLI shares document processing; this entry point protects page imports.
export { readManualSections } from "./document";
