# Live retrieval check

Model: text-embedding-3-small. Manual: 10 chunks, 1536 dimensions.

Questions were embedded in one batch. No answer-generation calls were made.

| Question | Closest section | Top score | Expected section in top 3 |
| --- | --- | --- | --- |
| What is an ultrasonic sensor? | Ultrasonic distance sensor | 0.647 | Pass |
| How does the robot use motors? | Motors and movement | 0.637 | Pass |
| What should we be careful about when using the battery? | Battery handling | 0.538 | Pass |
| How do we use the robot safely in a classroom? | Classroom safety | 0.726 | Pass |
| What makes the robot move? | Motors and movement | 0.631 | Pass |
| How does it follow a dark line? | Line sensor | 0.499 | Pass |
| What is the capital of France? | Battery handling | 0.021 | Not applicable: unsupported question |

The unrelated question still returns nearest passages. Similarity is not answerability or factual confidence; this check does not establish an abstention threshold.

Query embedding input: 57 tokens. Six answerable questions checked for expected-source recall in the top three.
