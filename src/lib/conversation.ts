import { AppError } from "./errors";
import { MAX_QUESTION_LENGTH, type ChatHistoryMessage } from "./types";

export const MAX_HISTORY_MESSAGES = 6;
export const MAX_HISTORY_CHARACTERS = 12_000;
export const MAX_ASSISTANT_HISTORY_CHARACTERS = 5_000;

export function parseHistory(value: unknown): ChatHistoryMessage[] {
  if (value === undefined) return [];
  const invalid = () => new AppError("Send at most three completed conversation turns within the history size limit.", 400);
  if (!Array.isArray(value) || value.length > MAX_HISTORY_MESSAGES || value.length % 2)
    throw invalid();
  let characters = 0;
  return value.map((item: unknown, index) => {
    if (!item || typeof item !== "object" || !("role" in item) || !("content" in item))
      throw invalid();
    const role = index % 2 ? "assistant" : "user";
    const limit = role === "user" ? MAX_QUESTION_LENGTH : MAX_ASSISTANT_HISTORY_CHARACTERS;
    if (item.role !== role || typeof item.content !== "string" || !item.content.trim() || item.content.length > limit)
      throw invalid();
    characters += item.content.length;
    if (characters > MAX_HISTORY_CHARACTERS) throw invalid();
    return { role, content: item.content.trim() };
  });
}

// Only send completed exchanges. Failed requests leave user messages in the UI,
// but those messages are not a completed conversation and must not be replayed.
export function recentHistory(messages: { role: "user" | "assistant"; text: string }[]): ChatHistoryMessage[] {
  const history: ChatHistoryMessage[] = [];
  for (let i = 1; i < messages.length; i++) {
    const previous = messages[i - 1];
    const current = messages[i];
    if (previous.role !== "user" || current.role !== "assistant") continue;
    if (previous.text.length > MAX_QUESTION_LENGTH || current.text.length > MAX_ASSISTANT_HISTORY_CHARACTERS) continue;
    history.push({ role: "user", content: previous.text }, { role: "assistant", content: current.text });
  }
  while (history.length > MAX_HISTORY_MESSAGES || history.reduce((sum, item) => sum + item.content.length, 0) > MAX_HISTORY_CHARACTERS)
    history.splice(0, 2);
  return history;
}

export function rewriteInput(question: string, history: ChatHistoryMessage[]) {
  return JSON.stringify({ history, currentQuestion: question });
}

export function validateRetrievalQuestion(value: unknown) {
  if (!value || typeof value !== "object" || !("question" in value) ||
    typeof value.question !== "string" || !value.question.trim() || value.question.length > MAX_QUESTION_LENGTH)
    throw new AppError("Could not understand the follow-up question. Please rephrase it.", 502);
  return value.question.trim();
}
