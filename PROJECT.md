# Devotopia — Verified Skill Roadmaps

> AI career-preparation platform that turns a target job role into a personalised
> learning roadmap and verifies every skill with an adaptive exam.

ITI graduation project · Open Source Track · Alexandria
Repository name is `SmartRoadmap`; the product is branded **Devotopia**.

| | |
|---|---|
| **Team** | Ali Maher *(leader)* · Mohamed El-Saeed · Nada Nasr · Marina George |
| **Stack** | Turborepo monorepo — Next.js 14 client, NestJS 11 API, shared Zod package |
| **Scale** | 40 API modules · 118 HTTP routes · 49 Mongoose schemas · 24 page routes |

---

## 1. What it does

A completion certificate says a learner *attended*. A Devotopia verified skill says
they answered questions at a measured difficulty and passed a weighted threshold.
That difference is the whole product.

**For the learner** — state a target role; the system generates a
dependency-ordered curriculum, gates each module behind an adaptive exam, and
records a verified skill on every pass.

**For the employer** — the same records, in reverse: a candidate pipeline ranked
by measured exam performance instead of CV keywords.

**The loop closes** — a gap found against a real job posting can be injected
straight back into the learner's roadmap.

---

## 2. The adaptive assessment engine

This is the centre of the project. Five questions per module.

### Difficulty moves on a two-answer streak

Two consecutive correct answers move the ladder up one step
(`easy → medium → hard`); two consecutive wrong answers move it down; a mixed
pair holds position.

> Adapting after a *single* answer over-reacts to a lucky guess or a careless
> slip on a five-question exam.

`apps/api/src/modules/assessment/assessment.service.ts`

### Scoring is weighted by the difficulty actually faced

| Difficulty | Weight |
|---|---|
| easy | 1.0 |
| medium | 1.5 |
| hard | 2.0 |

Without weighting the ladder is decorative — a learner who climbs to hard
questions would score the same as one who stayed on easy. The weighting is also
what lets a recruiter filter on *skills passed at a measured difficulty*.

### Pass, fail, and the remedial loop

- **Pass threshold: 70%** of the weighted score. Passing unlocks dependent
  modules along the prerequisite graph and records a verified skill.
- **Remedial threshold: 30%** — once a topic's *running* fail percentage reaches
  30%, a shorter remedial module built from the missed questions is generated and
  inserted ahead of the failed one.

Because it is a running percentage per topic, one bad attempt does not trigger it
but a genuine pattern does.

Constants live in `apps/api/src/modules/roadmap/remedial-node-queue.service.ts`
(`REMEDIAL_THRESHOLD = 30`). Rules are covered by `remedial-trigger.spec.ts`.

### The design decision worth defending

> The model generates **content** — the curriculum, the questions, the remedial
> material. It never decides **control flow**.

Difficulty selection, pass/fail, prerequisite unlocking and remedial triggering
are all deterministic application code. That is what makes those rules
unit-testable, and it is why the product survives a total AI outage.

**It is not agentic**, and that is deliberate.

---

## 3. AI provider fallback chain

Every model call runs through one chain, tried in order, always ending in a
deterministic mock:

```
OpenAI → Gemini → Groq → HuggingFace → Mock
```

A provider that errors — or returns a reply failing the shape check — falls
through to the next, never to the user.

`apps/api/src/ai/ai-provider.factory.ts` · `llm.service.ts`

**This is not theoretical.** During screenshot capture all three configured live
providers failed simultaneously (OpenAI 429 no credits, Gemini and Groq invalid
credentials) and the application kept working end to end — roadmaps generated,
exams ran, scoring and unlocking unaffected. Only the *text quality* degraded.

---

## 4. Security model

Deny-by-default: a route is protected unless it explicitly opts out.

| Layer | Mechanism |
|---|---|
| Authentication | Global `JwtAuthGuard` |
| Authorization | `RolesGuard` — learner / company / mentor / admin |
| Ownership | `assertSelfOrAdmin()` against IDOR |
| Passwords | bcrypt, 12 rounds |
| Sessions | Refresh token in an httpOnly cookie scoped to `/auth`; access token in memory only |
| Rotation | Hashed per device, with replay-theft detection |
| Escalation | `admin` is rejected at the registration DTO, not in business logic |
| Rate limiting | 15 req/min on auth routes, 100 elsewhere |
| Headers | Helmet — CSP, HSTS, nosniff, frame policy |

Verified by `npm run smoke` — 44 checks covering authz, IDOR, privilege
escalation, Google spoofing, and rate limits.

---

## 5. Billing

Prices are resolved **server-side** from the plan name; the client never sends an
amount, so a tampered checkout cannot change what is charged.

| Plan | Price | Unlocks |
|---|---|---|
| Free | $0 | One roadmap, limited exams, community |
| Pro Learner | $19.99 / month | Unlimited roadmaps and exams, CV enhancement, certificates |
| Company | $99.99 / month | Verified candidate pipeline, search, job postings |

`apps/api/src/modules/payment/dto/payment.dto.ts` (`PLAN_PRICES`)

A production build refuses to boot without PayPal credentials, so mock payments
can never hand out free upgrades in production.

---

## 6. Technology

| Category | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router) · React 18 · TypeScript 5 · Tailwind · DaisyUI · Framer Motion (LazyMotion) · Recharts · Redux Toolkit · Monaco Editor · PWA |
| **Backend** | NestJS 11 · Node.js 20 · Express · RxJS · Zod · class-validator · Swagger · BullMQ · Helmet · Multer · pdf-parse |
| **Database** | MongoDB Atlas · Mongoose (49 schemas) · Qdrant (vector, cosine) · Redis |
| **AI** | OpenAI · Google Gemini · Groq · Hugging Face · AssemblyAI · deterministic mock |
| **Auth** | JWT + refresh rotation · bcrypt · Google Identity · httpOnly cookies |
| **Cloud** | Docker · GitHub Actions · Turborepo · Cloudinary · Appwrite |
| **Payments** | PayPal REST v2 |
| **Testing** | Playwright · Jest · Supertest · 44-check smoke suite · ESLint · Prettier |

> **Not applicable:** embedded, IoT, or automotive. This is a web platform — a
> browser client and an HTTP API. The only hardware it touches is the
> microphone, via the browser's standard `MediaRecorder` API.

---

## 7. Running it locally

```bash
npm install
npm run dev          # turbo runs both apps
```

| Service | URL |
|---|---|
| Web | http://localhost:3001 |
| API | http://localhost:3002 |

### Environment

Copy `.env.example` to `apps/api/.env`, then set at minimum:

```bash
PORT=3002                 # MUST match NEXT_PUBLIC_API_URL in apps/web/.env
MONGODB_URI=...
JWT_SECRET=...            # 32+ characters
JWT_REFRESH_SECRET=...    # 32+ characters
```

AI keys are optional — without them the chain falls to the deterministic mock and
the app remains fully usable offline.

### Verification

```bash
npm run smoke            # 44 security + behaviour checks against a live API
npx playwright test      # end-to-end suite
```

---

## 8. Gotchas that will cost you an hour

These are real failures encountered while getting the project running.

**`PORT` must be 3002.** The web client reads
`NEXT_PUBLIC_API_URL=http://localhost:3002`. A mismatch produces `Failed to fetch`
on every authenticated call *while both servers appear to be running normally*.

**Declared ≠ installed.** Several dependencies are listed in `package.json` but
were never installed, and the failure surfaces as a TypeScript
module-resolution error rather than a missing-package error. Run `npm install`
from the **repository root** — the workspace hoists.

**Two variables abort startup if absent.** `AppwriteService` reads
`APPWRITE_ENDPOINT` and `VoiceAgentService` reads `ASSEMBLYAI_API_KEY`, both with
`getOrThrow`. Placeholder values are enough for local development.

**Set `NEXT_PUBLIC_SOCKET_URL`.** Without it the realtime client falls back to
port 3000 and retries indefinitely, flooding the console with
`ERR_CONNECTION_REFUSED`.

**Never put the MongoDB data directory inside the repository.** It was previously
committed under `tmp/` (102 MB of WiredTiger files). Once a local `mongod` holds
its lock files, git cannot read them and *every* `git add` fails:

```
error: read error while indexing tmp/mongodb/WiredTiger.lock: Permission denied
```

`.gitignore` does **not** help for files that are already tracked — they must be
untracked with `git rm -r --cached`, and `mongod` must be stopped first so the
locks are released.

**`next dev` compiles routes on first request.** A first visit can outrun the
page's own data fetch and produce a spurious load error. It is a development
artefact, not a product defect.

---

## 9. Performance

Measured on the production build with Playwright (`tests/perf/`).

| Route | First-load JS before | after |
|---|---|---|
| `/dashboard` | 316 kB | **161 kB** (−49%) |
| `/quiz/[moduleId]` | 243 kB | **131 kB** (−46%) |
| `/auth/login` · `/register` | 154 kB | **130 kB** (−16%) |
| `/roadmap` | 175 kB | **151 kB** (−14%) |

**LCP on auth pages: 1,540 ms → 272 ms (−82%).** CLS 0, longest main-thread task
0 ms on the measured routes.

Three causes, all removed:

1. **Recharts in the initial payload** — a 309 kB chunk blocking first paint on
   the two heaviest routes. Moved behind `next/dynamic`.
2. **The quiz drew one countdown ring with an entire charting library** —
   replaced with a `stroke-dashoffset` SVG circle, removing Recharts from that
   route entirely.
3. **Framer Motion shipped whole** (121 kB) on nine routes — switched to
   `LazyMotion` + `domAnimation`, which covers every animation the app uses.

A fourth: the auth pages' LCP element was a decorative card animating in with
`delay: 0.4s` and `opacity: 0` — the page's biggest visual block was deliberately
withheld. That alone was ~1.2 s of LCP.

---

## 10. Repository layout

```
apps/
  api/          NestJS 11 — 40 modules, 118 routes, 49 schemas
  web/          Next.js 14 App Router — 24 page routes
packages/
  shared/       Zod schemas + types shared by both apps
tests/
  e2e/          Playwright — stack boot, registration, community, admin authz
scripts/
  smoke-test.mjs   44-check live security suite
output/
  docs/         ITI documentation, presentation outline, diagrams
```

### Files that carry the ideas

| File | Why it matters |
|---|---|
| `assessment.service.ts` | The adaptive ladder, weighted score, pass/fail branch, remedial trigger |
| `ai-provider.factory.ts` | The fallback chain, and the decision to always end in a mock |
| `llm.service.ts` | How a model reply is shape-checked before it is trusted |
| `jwt-auth.guard.ts` | Deny-by-default authentication applied globally |
| `auth.dto.ts` | Privilege escalation closed at the validation layer |
| `payment.dto.ts` | Server-side price resolution |
| `scripts/smoke-test.mjs` | IDOR, spoofing, rate limits |

---

## 11. Known gaps

- **Assessment sample size.** Five questions is small, so the difficulty ladder
  rarely reaches its top step. The fix is a larger item bank with per-question
  discrimination statistics.
- **Job ingestion.** Adzuna is implemented as a service but is not wired into an
  active pipeline; job records are seeded and company-posted.
- **Retrieval quality.** Fixed-size chunking truncates context in assistant
  answers. Sentence-window and auto-merging retrieval, with the RAG triad as a
  measured metric, are the planned replacement.
- **Redis and Qdrant are optional.** Both have graceful fallbacks (in-memory
  queue, RAG mock mode), so absence is invisible until you look for it.

---

## 12. Deliverables

Generated in `output/docs/`:

| File | Contents |
|---|---|
| `Devotopia-Project-Documentation.docx` / `.pdf` | Full ITI documentation, 8 chapters, 25 tables, 4 diagrams |
| `Devotopia-Presentation-Outline.docx` / `.pdf` | 15 slides with speaker notes, anticipated questions, delivery checklist |
| `diagrams/use-case-diagram.png` | 4 actors, 14 use cases, «include» relationships |
| `diagrams/class-diagram.png` | 11 classes with attributes and multiplicities |
| `diagrams/erd.png` | 10 entities with PK/FK and cardinalities |
| `diagrams/architecture.png` | 6 layers, browser through external services |

### Still required before submission

Both documents mark these in amber callout boxes. They need **real data** —
inventing them is worse than leaving them blank, because assessors ask where the
numbers came from.

1. **Customer analysis (§1.4)** — questionnaire results with charts and a stated
   sample size.
2. **User testing (§6.1)** — 3–5 observed sessions with real participants.
3. **A cited statistic** for the problem slide, with source and year.
4. **A recorded demo** as a fallback if the live system fails during the defence.
