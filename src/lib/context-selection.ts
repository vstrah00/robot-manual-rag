import type { RetrievedSource } from "./types";

// A character budget is deterministic and conservative for this short English
// manual. It is a context-size bound, not an exact tokenizer/token count.
export const MAX_CONTEXT_CHARACTERS = 16_000;

const topics = [
  { question: /\bsensors?\b/i, title: /sensor/i },
  { question: /\b(?:motors?|wheels?|movement)\b/i, title: /motors? and movement/i },
  { question: /\bbatter(?:y|ies)\b/i, title: /battery/i },
  { question: /\b(?:charg\w*|storage)\b/i, title: /charging|storage/i },
  { question: /\b(?:safety|safely|classroom)\b/i, title: /classroom safety/i },
  { question: /\b(?:programming|programs?|code|coding)\b/i, title: /programming/i },
  { question: /\b(?:maintenance|connections?|cleaning)\b/i, title: /maintenance/i },
  { question: /\b(?:troubleshoot\w*|diagnos\w*)\b/i, title: /troubleshooting/i },
];

export function selectContext(
  question: string,
  ranked: RetrievedSource[],
  budget = MAX_CONTEXT_CHARACTERS,
) {
  if (!Number.isInteger(budget) || budget < 1)
    throw new Error("Context budget must be a positive integer.");
  const overview =
    (/\b(?:summari[sz]e|summary|overview)\b/i.test(question) &&
      /\b(?:manual|document|robot)\b/i.test(question)) ||
    /\b(?:whole|entire|all)\s+(?:manual|document|sections|topics)\b/i.test(question);
  const requestedTopics = topics.filter((topic) => topic.question.test(question));
  const multiTopic = requestedTopics.length > 1;
  const strategy = overview ? "manual-overview" : multiTopic ? "topic-coverage" : "focused";
  // Topic matches supplement embedding search; they never supply answer facts.
  // Select every matching heading for explicit multi-topic requests so a high
  // battery score cannot displace a requested motor/sensor section.
  const mandatory = multiTopic
    ? ranked.filter((source) => requestedTopics.some((topic) => topic.title.test(source.title)))
    : [];
  const wantedIds = new Set(mandatory.map((source) => source.id));
  for (const source of ranked.slice(0, 3)) wantedIds.add(source.id);
  const candidates = overview
    ? [...ranked].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    : [...mandatory, ...ranked.filter((source) => wantedIds.has(source.id) && !mandatory.includes(source))];
  const sources: RetrievedSource[] = [];
  let characters = 0;
  for (const source of candidates) {
    const size = JSON.stringify({ id: source.id, title: source.title, text: source.text }).length;
    // Preserve complete paragraphs. Do not silently cut off sentences.
    if (characters + size > budget) continue;
    sources.push(source);
    characters += size;
  }
  return {
    sources,
    retrieval: {
      strategy,
      totalSections: ranked.length,
      selectedSections: sources.length,
      completeManual: sources.length === ranked.length && ranked.length > 0,
      budgetLimited: sources.length < candidates.length,
      contextCharacters: characters,
      characterBudget: budget,
    },
  };
}
