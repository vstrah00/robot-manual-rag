# Retrieval coverage and grounding improvements

The original ten-paragraph manual is unchanged. These changes address coverage and answer behavior rather than changing the document to hide a retrieval failure.

## Context selection

- Focused questions retain the top three cosine-similarity matches.
- Explicit multi-topic questions also select sections whose headings match the requested topic groups. Sensor and motor sections cannot be displaced by higher battery scores in the regression fixture.
- Whole-manual summaries select all ten sections in document order when they fit the context budget.
- Complete paragraphs are bounded by a 16,000-character excerpt budget. This is a character-based size estimate, not exact tokenization. The response exposes strategy, selected/total section counts, completeness, and budget-limitation metadata.
- English topic and overview detection are deliberate heuristics for this small manual. Larger or multilingual documents need broader evaluation and a more general retrieval strategy.

## Grounding

Missing selected context is not evidence that the complete manual lacks information. The fixed refusal now refers to “the retrieved excerpts,” and partial answers must distinguish retrieval gaps from specifications explicitly described as unspecified in an excerpt. The legacy API status `not_in_manual` is retained for compatibility; the interface displays “Not in these excerpts.”

The prompt also limits status classification to what was actually asked: an unrequested maximum sensor range should not make a sensor/motor explanation partial. Incorrect premises must be corrected using the excerpts.

## Validation

- 19 offline tests passed, including the battery-biased broad-summary regression, explicit sensor/motor coverage, focused ranking, whole-paragraph budget behavior, and a quality check that rejects the reported false summary.
- All 12 live cases passed status, required citation, required fact-pattern, forbidden-claim, and applicable coverage checks. See `answer-evaluation.md` for recorded answers.
- The broad-summary case covers sensors, motors, battery handling, charging, classroom safety, programming, maintenance, and troubleshooting using the same ten-section manual.
- TypeScript and the isolated Webpack production build passed.
- The manual was re-indexed as ten chunks, using 885 embedding input tokens; no generated index or API key is committed.

Fact patterns allow common paraphrases but cannot prove semantic correctness. The recorded final answers were also inspected against the manual. These checks reduce known failure modes rather than guaranteeing every future answer.

This pass does not add public request throttling or conversational history. Those remain separate improvements.
