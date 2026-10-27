# Fresh source archive verification

Verified on 27 October 2026 on macOS (Apple Silicon), Node.js 26.11.1, and npm. This records a local verification run; it is not a claim of testing every supported platform or Node version.

The source archive was extracted into a new directory without dependencies, a vector index, environment secrets, or build output.

| Check | Result |
| --- | --- |
| Dependency installation | `npm ci --offline --no-audit --no-fund` succeeded using the existing package cache and included lockfile: 54 packages installed. |
| Offline tests | `npm test`: all 13 passed. |
| Chunk inspection | `npm run index:manual -- --dry-run`: ten chunks; no API requests. |
| Live manual indexing | Ten chunks embedded with `text-embedding-3-small`, 1,536 dimensions, 885 input tokens. |
| Repeated indexing | Current index reused without an API request. |
| TypeScript | `npm run typecheck` passed. |
| Production build | `npm run build -- --webpack` passed, including static page generation and the chat API route. |
| Production page | A temporary production server on a separate port returned HTTP 200 with the chat and manual. |
| Input validation | A 401-character question returned HTTP 400. |
| Live question | “How does the robot use motors?” returned HTTP 200, status `supported`, and a citation to `section-4` (Motors and movement). No raw embeddings were returned. |
| Documentation | All README file and image links resolved. |
| Archive hygiene | Includes lockfile and `.env.example`; excludes `.env.local`, generated index, dependencies, and builds. |

The temporary production server was stopped after the checks. The existing development server was left running. The existing API key was supplied through the verification process environment; it was not copied into the fresh directory or packaged.

## Environment-specific adjustments

The `tsx` CLI attempted to open a local IPC pipe that this managed environment disallows. Project scripts now use `node --import tsx`, which runs the same TypeScript entry points without the CLI's IPC server. Tests, dry-run indexing, and live indexing succeeded using these scripts.

The default Turbopack build could not bind an internal worker port in this environment, including after network access was granted. The supported Webpack build completed successfully and was used for the production-server checks. The default Turbopack build was therefore not verified here; use `npm run build -- --webpack` if this restriction applies.

Earlier eight-case live grounding/citation evaluation is recorded separately in `answer-evaluation.md`. This fresh-copy check added one real question; it did not repeat the full paid evaluation.
