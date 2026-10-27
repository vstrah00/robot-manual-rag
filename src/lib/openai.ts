// Shared server/CLI client. Never import this module in a client component.
import OpenAI from "openai";
import { AppError } from "./errors";

export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey)
    throw new AppError(
      "Add OPENAI_API_KEY to .env.local and restart the server.",
      503,
    );
  return new OpenAI({ apiKey, timeout: 20_000, maxRetries: 0 });
}

export function openAIError(error: unknown, operation: string): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401)
      return new AppError(
        "OpenAI rejected the API key. Check .env.local and restart the server.",
        503,
      );
    if (error.code === "insufficient_quota")
      return new AppError(
        "OpenAI reports insufficient API credit or quota. Check API billing and project limits.",
        503,
      );
    if (error.status === 429)
      return new AppError(
        "OpenAI's request limit was reached. Wait a little before trying again.",
        429,
      );
    if (error.status === 403 || error.status === 404)
      return new AppError(
        `The selected ${operation} model is unavailable to this project. Check the model setting and project permissions.`,
        503,
      );
  }
  // Raw SDK errors may contain request information; expose only safe messages.
  return new AppError(
    `OpenAI ${operation} failed. Check your connection and model setting, then try again.`,
    502,
  );
}
