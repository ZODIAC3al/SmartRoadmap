# SmartRoadmap — AI Architecture

> Where the AI lives in the codebase, what each part does, and how the pieces connect.
> Every path below is a real file in this repository.

---

## 1. Where the AI code lives

All AI capability is isolated in one folder — `apps/api/src/ai/` — and injected into the
feature modules that need it. No feature module talks to OpenAI directly.

```
apps/api/src/
│
├── ai/                                  ← THE AI LAYER (all of it)
│   ├── openai.client.ts        (24 loc)   Single OpenAI client + mock-mode decision
│   ├── llm.service.ts         (175 loc)   Text generation: roadmaps, quizzes, generic completions
│   ├── embedding.service.ts    (63 loc)   Vector embeddings (single + batch)
│   ├── rag.service.ts         (166 loc)   Qdrant vector store: index + semantic search
│   └── ai.module.ts            (11 loc)   @Global() module — exports the three services
│
├── modules/                             ← THE CONSUMERS
│   ├── roadmap/roadmap.service.ts        → llmService.generateRoadmap()
│   ├── assessment/assessment.service.ts  → llmService.generateQuiz()   + adaptive logic
│   ├── cv/cv.service.ts                  → llmService.complete()  ×2   (parse + enhance)
│   └── hiring/hiring.service.ts          → skill-overlap matching + closeSkillGap()
│
└── config/env.validation.ts             ← AI config: model names, keys, MOCK_MODE
```

**The one rule:** `ai/` owns the OpenAI client, the prompts, the JSON parsing, and the
failure handling. Feature services just call a typed method. If we swap OpenAI for
Anthropic or a local model tomorrow, only `ai/` changes.

---

## 2. The five AI touchpoints, in order of the user journey

### ① CV parsing — `modules/cv/cv.service.ts:307`

**What happens:** the user uploads a PDF résumé. `pdf-parse` extracts the raw text, then
we ask the model to turn that unstructured text into a structured object.

```
PDF → pdf-parse → raw text → llmService.complete(prompt, { json: true }) → CVData
```

- **Model:** `gpt-4o-mini` (`OPENAI_MODEL_FAST`)
- **Technique:** JSON mode (`response_format: { type: 'json_object' }`) with an explicit
  schema in the prompt: `personal{}`, `experience[]`, `education[]`, `skills[]`, `projects[]`.
- **Why JSON mode:** the output is consumed by code, not read by a human. Free-form text
  would need brittle regex parsing.
- **Fallback:** `parseTextHeuristically()` — a regex/heuristic parser (email, phone, section
  headings). Used when the model is unavailable or returns malformed JSON.

### ② Roadmap generation — `ai/llm.service.ts:86`, called from `modules/roadmap/roadmap.service.ts:22`

**What happens:** given a target role plus the skills we extracted from the CV, the model
produces a dependency-ordered learning graph.

```
{ targetRole, skills[] } → gpt-4o → { title, totalEstimatedHours, modules[] }
```

Each module carries: `id`, `title`, `description`, `prerequisites[]`, `estimatedHours`,
`topics[]`, `difficulty`, `status`, and `positionX/positionY` (so the frontend can draw the graph).

- **Model:** `gpt-4o` (`OPENAI_MODEL_SMART`) — the *only* place we use the expensive model.
- **Why the stronger model here:** this output is a **graph**, not a list. If the model emits
  an inconsistent prerequisite edge (module 3 requires module 5, which requires module 3),
  the learner gets an unlearnable path. Correctness matters more than cost on this one call,
  and it happens once per user.
- **Validation:** the response is parsed and rejected if `modules` is empty or missing.
- **Fallback:** `mockRoadmap()` — a deterministic 3-module template.

### ③ Quiz generation + adaptive assessment — `ai/llm.service.ts:146`, logic in `modules/assessment/assessment.service.ts`

**What happens:** the AI writes the questions; **deterministic code** runs the adaptivity.

```
{ topic, difficulty, count } → gpt-4o-mini → [{ question, options[], correctAnswer, explanation }]
```

- **Model:** `gpt-4o-mini` — high volume, and a slightly weaker question is not a correctness
  disaster the way a broken graph is.
- **Adaptive difficulty** (`assessment.service.ts`): two correct answers in a row → difficulty
  goes up; two wrong → down. This is plain code, not a model decision — it must be
  predictable and auditable.
- **Weighted scoring:** easy = 1, medium = 1.5, hard = 2. Pass threshold = 70%
  (`assessment.service.ts:138`).

### ④ Adaptive outcome — the feedback loop  `assessment.service.ts:149`

This is the part that makes the roadmap *adaptive* rather than *generated once*:

| Outcome | What the system does | Code |
|---|---|---|
| **Pass** (≥70%) | Unlocks every module whose prerequisites are now all satisfied | `unlockNextRoadmapModules()` — line 238 |
| **Fail** (<70%) | Builds a **remedial module** from the exact questions the learner got wrong, and marks the failed module `failed` | `addRemedialModule()` — line 191 |

The remedial module's `topics[]` are literally the missed questions. The learner is never
left stuck at a wall — the roadmap reshapes itself around the evidence.

### ⑤ Skill-gap analysis → back into the roadmap — `modules/hiring/hiring.service.ts:169`

**What happens:** each job match returns a `matchScore` and a `skillsGap`. The learner clicks
"add these to my roadmap", and the server writes the missing skills in as new modules.

```
verified skills (from completed modules)
        ↓  compare against job.requiredSkills
{ matchScore, skillsGap[] }
        ↓  POST /hiring/jobs/:id/close-gap
new modules appended to the active roadmap
```

The gap is **recomputed server-side** at close-gap time (`closeSkillGap`), not trusted from
the client — the client could otherwise ask for arbitrary modules.

**This closes the loop:** job → gap → roadmap → quiz → verified skill → better match.
That loop is the product. Everything else is plumbing.

---

## 3. The two cross-cutting design decisions

### 3.1 One client, one mock-mode decision — `ai/openai.client.ts`

Every AI service is constructed through `createOpenAIClient(config, logger)`, which returns
either a real `OpenAI` instance or `{ isMockMode: true, client: null }`.

Mock mode is entered only when:
- `MOCK_MODE=true` is set **explicitly**, or
- there is no usable `OPENAI_API_KEY` **and we are not in production**.

`config/env.validation.ts` rejects `MOCK_MODE=true` under `NODE_ENV=production` and requires
`OPENAI_API_KEY` there. **A live deployment can never silently serve fabricated AI output.**

### 3.2 Every AI call degrades gracefully — and terminates

Each generative method follows the same shape:

```ts
async generateRoadmap(role, skills) {
  if (this.isMockMode || !this.client) return this.mockRoadmap(role);   // offline path
  try {
    ... openai call ...
    if (!parsed.modules?.length) throw new Error('no modules');          // validate output
    return parsed;
  } catch (e) {
    this.logger.error(...);
    return this.mockRoadmap(role);        // ← a PURE FUNCTION, not the method itself
  }
}
```

The distinction in that last line is the important one. The original code did:

```ts
catch (error) { return this.generateRoadmap(role, skills); }   // ← infinite recursion
```

which would recurse until the call stack blew — taking down the whole API on the first
OpenAI hiccup. This bug existed in **four** places (`generateRoadmap`, `generateQuiz`,
`embed`, `createOrder`). The fix was to extract the mock responses into pure functions so
the fallback path always terminates.

**Consequence:** the platform is fully demonstrable with no API key and no internet, and a
provider outage degrades quality instead of causing an outage.

---

## 4. The vector-search layer (built, not yet wired)

`ai/embedding.service.ts` and `ai/rag.service.ts` implement semantic search:

- `embed(text)` / `embedBatch(texts[])` → `text-embedding-3-small`, 1536 dimensions.
  The batch method issues **one** request for N texts instead of N sequential ones.
- `RAGService.onModuleInit()` creates the `resources` and `jobs` Qdrant collections on boot
  (cosine distance).
- `upsert(collection, docs)` embeds and indexes documents; `retrieveJobs()` /
  `retrieveResources()` run cosine-similarity search.
- Deterministic mock embeddings (seeded PRNG, normalized) keep offline results stable.

**Honest status:** this layer works and is tested, but `HiringService.matchJobsForLearner()`
does **not** call it yet. Today's matching is a deterministic **skill-overlap score**:

```
matchScore = |verified skills ∩ job.requiredSkills| / |job.requiredSkills| × 100
skillsGap  = job.requiredSkills − verified skills
```

That is exact and explainable, but literal: a candidate with "React" does not match a job
asking for "modern frontend framework experience".

**The next step** is a hybrid: keep the overlap score for explainability, add the cosine
similarity from `RAGService.retrieveJobs()` for semantic recall, and blend them. The
infrastructure is already in place — what is missing is a job importer to populate the index.

---

## 5. Model selection & cost

| Call | Model | Frequency | Why this model |
|---|---|---|---|
| Roadmap generation | `gpt-4o` | Once per user | Graph consistency; a bad prerequisite edge breaks the product |
| Quiz generation | `gpt-4o-mini` | Every module | High volume; a slightly weaker question is recoverable |
| CV parsing | `gpt-4o-mini` | Once per upload | Extraction, not reasoning |
| Bullet enhancement | `gpt-4o-mini` | Many per CV | Short, cheap, high volume |
| Embeddings | `text-embedding-3-small` | Per indexed doc | Cheapest adequate embedding model |

Model names are **configuration, not constants** (`OPENAI_MODEL_SMART`, `OPENAI_MODEL_FAST`,
`OPENAI_EMBEDDING_MODEL`) — they can be swapped without a code change.

---

## 6. How the AI behaviour is tested

LLM output is non-deterministic, so we don't assert on its content. We assert on the
**contract** and on the **system's reaction** to it:

| Check | Where | What it proves |
|---|---|---|
| A roadmap is generated with ≥1 module | `smoke-test.mjs` §6 | The prompt → JSON → persistence path works end to end |
| The roadmap reacts to the quiz outcome | `smoke-test.mjs` §6 | Either the next module unlocked, or a remedial module was added |
| Closing a gap really writes modules | `smoke-test.mjs` §6b | The reported skills actually appear in the roadmap in the DB |
| Empty/invalid AI output is rejected | `llm.service.ts` | An empty `modules[]` throws and falls back to the mock |
| The whole platform runs with no API key | `MOCK_MODE=true` | Graceful degradation; the demo can't be broken by a provider |

The full suite (53 live checks) runs against a **running server**, so it verifies the deployed
behaviour rather than a mock: `npm run smoke`.

---

## 7. One-paragraph summary (for a reviewer)

> SmartRoadmap uses the LLM for four things — parsing a résumé into structured data,
> generating a dependency-ordered learning roadmap, writing assessment questions, and
> rewriting CV bullets — and uses embeddings for semantic retrieval. All AI code is isolated
> in a single `ai/` layer behind typed service methods, so no feature module depends on a
> provider. Every generative call uses JSON mode with a validated schema, and every call has
> a deterministic, terminating fallback, so the platform degrades in quality rather than
> failing when the provider is unavailable. The *adaptivity* — unlocking modules, generating
> remedial content on failure, folding a job's skill gap back into the roadmap — is
> deliberately implemented in plain, auditable code, not delegated to the model. The AI
> produces content; the system decides what to do with it.
