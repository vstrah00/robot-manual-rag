# Classroom Rover — Robot Manual Chat

A small RAG application that answers questions using a fictional educational robot manual. Built for the [original technical assignment](ORIGINAL_TASK.md) with Next.js, TypeScript, Tailwind CSS, and the OpenAI SDK.

The interface displays generated answers and expandable manual excerpts, marks cited sources, and distinguishes supported, partial, and unsupported answers. It includes a browsable manual, example questions, loading/error states, and a 400-character question limit. The layout supports desktop and phone screens. A light/dark switch follows the browser preference initially and remembers a manual choice on that browser.

## Run locally

Requirements: a Node.js version supported by the installed Next.js release (Node 20.9 or newer), npm, and an OpenAI API key with available API credit and access to the configured models. Installation needs access to the npm registry; indexing and chat need access to OpenAI.

From the extracted `robot-manual-rag` directory:

```sh
npm ci
cp .env.example .env.local
```

Enter your key in `.env.local`:

```dotenv
OPENAI_API_KEY=your_key_here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-6-luna
```

Then prepare the index and start the app:

```sh
npm run index:manual
npm run dev
```

Open the Local URL printed by Next.js, normally http://127.0.0.1:3000. Stop the server with Ctrl+C. To inspect chunking without making an API request, run `npm run index:manual -- --dry-run`.

The submission excludes `.env.local`, `data/index.json`, installed dependencies, and build output. Create your own environment file and generate the index before asking questions. Never prefix the key with `NEXT_PUBLIC_`; credentials stay in server/CLI code.

For a production run:

```sh
npm run build
npm start
```

Stop an existing server first, or choose a different port. If Turbopack cannot open an internal worker port in a restricted environment, build with `npm run build -- --webpack` instead, then run `npm start`. On macOS/Linux, `WATCHPACK_POLLING=true npm run dev` is available when native file watching is unavailable.

## Architecture

Step 0 prepares the manual. Steps 1–4 follow one question from submission to its displayed answer. Each component has a column; time flows downward.

![Complete application sequence](docs/architecture.png)

| Component | Purpose and implementation |
| --- | --- |
| Frontend | React chat and manual viewer in `src/components/chat.tsx`; sends questions to our backend and displays answers and sources. |
| Backend | Next.js `POST /api/chat`; validates questions, coordinates retrieval and generation, and returns safe errors. |
| Document processing | `src/lib/document.ts` parses numbered Markdown sections and calculates a source-file hash. |
| Embeddings | OpenAI `text-embedding-3-small` converts manual chunks and questions into comparable vectors. |
| Vector storage | Local `data/index.json` stores chunk text, IDs, vectors, model information, and the manual hash. No dedicated vector database is needed for ten chunks. |
| Retrieval | `src/lib/similarity.ts` calculates cosine similarity; `src/lib/retrieval.ts` selects context with embedding ranking, explicit topic coverage, and a character budget. |
| LLM and validation | `src/lib/generation.ts` calls OpenAI Responses; `src/lib/answer.ts` assembles context-only instructions and validates answer status and cited source IDs. |

Also included: a [component overview](docs/architecture-overview.png) and a [detailed indexing sequence](docs/indexing-flow.png). All diagrams have editable PlantUML sources in `docs/`. Paste [architecture.puml](docs/architecture.puml) into [PlantText](https://www.planttext.com/) and select **Save & Refresh** to edit the main diagram; `docs/planttext-link.txt` contains a preloaded editor link.

## How the RAG pipeline works

A question like **“What makes the robot turn?”** follows three steps:

1. **Prepare the manual.** Before the chat is used, each of the ten titled paragraphs becomes a chunk. OpenAI generates an embedding—a numerical representation of its meaning—for each chunk. Text, vectors, and source IDs are saved in a local JSON index. If the manual and embedding model haven't changed, the existing index is reused.

2. **Find the useful passages.** The backend embeds the question and compares it with the stored vectors using cosine similarity. For this example, the passage about motors and wheel speeds should rank highly. Focused questions retrieve the top three matches; questions covering several topics also include matching sections. A whole-manual summary can use all ten paragraphs.

3. **Answer from those passages.** The LLM receives the question and selected excerpts, with instructions to use only that context. The backend validates the response and its source IDs, then the interface displays the answer with expandable excerpts. If the context answers only part of the question, the response explains the gap; if it cannot answer, the assistant says so.

**Follow-ups work too.** After discussing the ultrasonic sensor, “Explain that more simply” is rewritten into a standalone question about that sensor before retrieval. Up to three recent exchanges help resolve the reference. The answer still uses freshly retrieved manual excerpts as its factual source. New chat or a refresh clears the conversation.

**Two distinctions matter:** a high similarity score means a passage is semantically close, not that it answers the question. And missing information in the retrieved excerpts does not prove it is missing from the entire manual.

<details>
<summary>Implementation details</summary>

- `scripts/index-manual.ts` embeds section titles and paragraph text in one batch and writes the index atomically. Each paragraph is self-contained, so chunks do not overlap.
- `src/lib/context-selection.ts` combines vector ranking with explicit topic matching. It keeps whole paragraphs within a 16,000-character serialized-excerpt budget, rather than an exact token budget.
- The LLM returns structured JSON with an answer, support status, and cited source IDs. Supported and partial answers require citations from the retrieved set; malformed output is rejected. Unsupported answers use a fixed abstention message.
- The API's legacy `not_in_manual` status means unsupported by the supplied context; the interface labels it “Not in these excerpts”. Retrieved candidates and sources actually cited in the answer are marked separately.
- `src/lib/resolve-question.ts` handles follow-ups using at most six history messages and 12,000 characters. History is untrusted reference data and is not passed to the final answer model as evidence.
- The pipeline uses the OpenAI SDK and ordinary TypeScript functions. With ten chunks, a JSON index and exact cosine search make the retrieval process straightforward to inspect without LangChain or a separate vector database.

</details>

## Update the manual or models

1. Edit `data/manual.md`, keeping unique numbered headings such as `## 1. Robot overview` and a self-contained paragraph per section.
2. Run `npm run index:manual` to rebuild all chunk embeddings.
3. For production, rebuild and redeploy the app so the displayed manual also updates.

Requests reject an index whose manual hash or embedding model no longer matches; they never rebuild it automatically. `npm run index:manual -- --force` deliberately regenerates even a current index.

Changing `OPENAI_CHAT_MODEL` does not require re-embedding. The chosen answer model must support the Responses API, strict structured output, and `reasoning.effort: none`; repeat evaluation after changing it. Changing `OPENAI_EMBEDDING_MODEL` requires a new index.

See [retrieval improvements and regression results](docs/retrieval-improvements.md) for the coverage changes made against the unchanged ten-section manual.

## Validation

```sh
npm test
npm run typecheck
npm run build
```

The 24 offline tests check chunk preservation, invalid vectors, cosine ranking, stale/corrupt indexes, context assembly, answer/citation validation, safe errors, and history validation and bounds. They do not use an API key or call OpenAI.

For live evaluation, run the indexed app at http://127.0.0.1:3000, then:

```sh
npm run eval
```

This makes twelve question-embedding calls and twelve answer-generation calls, and writes `answer-evaluation.md`. The recorded [live evaluation](answer-evaluation.md) includes the four assignment questions, unsupported facts, partial questions, broad summaries, multi-topic coverage, incorrect premises, paraphrases, and an instruction to invent a specification. Cases specify required fact signals and forbidden claim patterns alongside status and citations. These paraphrase-tolerant patterns are heuristic; manually review the recorded answers against their context. Earlier [retrieval checks](retrieval-check.md) cover paraphrases and expected source ranking. These are bounded examples, not exhaustive guarantees.

Run `npm run eval:conversation` for three additional paid local checks covering a sensor follow-up, a fabricated battery claim in history, and an unrelated question. See [recorded conversation results](conversation-evaluation.md).

To check a production build while a development server uses `.next`, run `NEXT_DIST_DIR=.next-check npm run build` on macOS/Linux.

The [fresh source archive verification](docs/submission-check.md) records installation, indexing, tests, production build/start, and one live question from an extracted copy, including environment-specific limitations.

## API and operational behavior

`POST /api/chat` accepts JSON such as `{"question":"What is an ultrasonic sensor?"}`. An optional `history` array contains alternating `{role: "user" | "assistant", content: string}` pairs. The server rejects malformed roles, incomplete exchanges, more than six messages, user messages over 400 characters, assistant messages over 5,000 characters, or history over 12,000 characters before paid calls. A successful response includes `retrievalQuestion`, `answer`, `status`, `sourceIds`, retrieved `sources`, `model`, `embeddingModel`, and `mode: "answer"`.

Invalid JSON, blank/wrong-type questions, or questions longer than 400 characters return HTTP 400. Missing/corrupt indexes return 503; outdated indexes return 409. These checks happen before paid model calls. Provider failures receive safe messages rather than raw SDK errors.

A question without history uses one embedding request and one generation request. With history, it also uses one question-rewriting request, capped at 250 output tokens. SDK retries are disabled. Generation is capped at 700 output tokens for small contexts and 1,100 for contexts with more than six excerpts and uses `store: false`; this setting does not override the provider's general data retention policy.

## Public demo protection

The live Vercel project has a published Firewall rule matching **POST `/api/chat`**, with a **fixed window of six requests per 60 seconds per IP**, returning **HTTP 429** when exceeded. This runs before the application and OpenAI calls. The frontend displays a friendly wait-and-retry message, including when the firewall response is not JSON. A live check with invalid question bodies returned six HTTP 400 responses followed by HTTP 429, without paid API calls.

This rule is Vercel project configuration, not source code: a new deployment project must configure the same rule under Firewall → Rules → Add Rule. Keep the path, POST method, IP key, 60-second window, six-request limit, and 429 action, then publish. No Redis service is required. People sharing a school network can share an IP and therefore this quota.

Per-IP rate limits and bounded prompts/output reduce exposure, but **do not impose a global request, concurrency, or dollar spending cap**. Multiple IPs can still generate spending. Monitor API usage and available credit; disable the public endpoint if needed. Vercel hosting spending controls do not cap a separately billed OpenAI key.

## Scope and limitations

- This is a single-document technical-test prototype. Accounts, multi-user quotas, document uploads, persistent chat history, and shared spending quotas are outside the requested scope.
- Retrieval uses English topic patterns plus vector ranking. Whole-manual intent detection and topic matching are explicit heuristics, not a general query planner. The 16,000-character budget keeps whole excerpts; larger manuals can have incomplete coverage, which is passed to the answer model. No relevance cutoff has been calibrated, so unrelated questions can still retrieve candidates.
- Context-only instructions and valid citations reduce errors but do not prove factual grounding or eliminate hallucination and prompt-injection risk.
- Chat history exists only in browser memory and clears on refresh. Only the latest three completed exchanges are used to resolve follow-ups; older references may need to be restated.
- Larger document collections may need different chunking, a vector database, and broader evaluation. On read-only hosting, generate the index before deployment.
- Model IDs are configurable aliases rather than pinned snapshots. The robot and manual are fictional assignment data.
