// Shared data contracts. These contain no server code or credentials.
export type ManualSection = {
  id: string;
  title: string;
  text: string;
};

export type RetrievedSource = ManualSection & { score: number };
export type AnswerStatus = "supported" | "partial" | "not_in_manual";

export type RetrievalInfo = {
  strategy: string;
  totalSections: number;
  selectedSections: number;
  completeManual: boolean;
  budgetLimited: boolean;
  contextCharacters: number;
  characterBudget: number;
};

export type ChatResponse = {
  mode: "answer";
  retrieval: RetrievalInfo;
  answer: string;
  sources: RetrievedSource[];
  model: string;
  embeddingModel: string;
  status: AnswerStatus;
  sourceIds: string[];
};

export const MAX_QUESTION_LENGTH = 400;
