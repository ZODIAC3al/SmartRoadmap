# SmartRoadmap — Feature & Technology Report

A career-preparation and recruitment platform: it diagnoses a learner's skill
level, generates an adaptive learning roadmap, verifies skills through quizzes,
lets users build a CV, and matches candidates to jobs — with a paid subscription
tier and a recruiter-facing side.

This report describes **what the product does** and **which technology powers each
part**. A companion automated test (`npm run smoke`, 44 checks) and a manual QA
sheet (`QA-CHECKLIST.md`) verify every item below on a running instance.

---

## 1. Architecture at a glance

**Monorepo** (Turborepo + npm workspaces)

```
apps/
  api/      NestJS 11 backend (REST)
  web/      Next.js 14 frontend (App Router)
packages/
  shared/   Zod schemas & TypeScript types shared by both apps
```

| Layer | Technology | Why |
|---|---|---|
| Backend framework | **NestJS 11** | Modular DI, guards, pipes, lifecycle hooks |
| Database | **MongoDB + Mongoose** | Flexible document model for CVs, roadmaps, sessions |
| Vector search | **Qdrant** (`@qdrant/js-client-rest`) | Semantic retrieval layer — implemented, index not yet populated |
| AI | **OpenAI** (`gpt-4o`, `gpt-4o-mini`, `text-embedding-3-small`) | Roadmap/quiz generation, CV parsing, embeddings |
| Auth | **@nestjs/jwt + bcrypt + google-auth-library** | Access/refresh JWTs, hashed passwords, verified Google sign-in |
| Validation | **class-validator + Zod** | Per-endpoint DTOs and fail-fast config validation |
| Rate limiting | **@nestjs/throttler** | Brute-force protection |
| Security headers | **helmet** | Standard hardening |
| API docs | **@nestjs/swagger** | Auto-generated `/docs` |
| Frontend | **Next.js 14 (App Router) + React 18** | File-based routing, RSC-ready |
| Styling | **Tailwind CSS + DaisyUI** | Utility-first, theme tokens |
| i18n | Custom `AppContext` | English (LTR) + Arabic (RTL) |
| File storage | **Cloudinary** | Image uploads (avatars) |
| Payments | **PayPal REST + signed webhooks** | Subscriptions |
| Email | **Resend** (console transport in dev) | Password resets, email verification |
| Infra (dev) | **Docker Compose** | MongoDB, Redis, Qdrant |
| Infra (prod) | **Multi-stage Dockerfiles** + `docker-compose.prod.yml` | Non-root images, Next.js standalone output, healthchecks |
| CI | **GitHub Actions** | lint → build → test → audit |

---

## 2. Features and the technology behind each

### 2.1 Authentication & session management
**What it does:** email/password and Google sign-up & login, with persistent
sessions that survive a page reload.

- **Passwords** are hashed with **bcrypt** (12 rounds) and never returned by the API
  (`select: false` on the Mongoose schema).
- **JWTs** via `@nestjs/jwt`: a short-lived **access token** (15 min) and a long-lived
  **refresh token** (30 days).
- **Token storage model:** the refresh token is delivered as an **httpOnly cookie**
  scoped to `/auth` — JavaScript (and therefore XSS) cannot read it, and it isn't sent
  on any other route, so the CSRF surface is nil. The access token stays in memory and
  is silently re-minted on reload. Implemented in `apps/web/src/lib/api.ts` and
  `apps/api/src/common/cookies.ts`.
- **Google sign-in** uses **Google Identity Services** in the browser to obtain a signed
  ID token; the backend verifies its signature and audience with **google-auth-library**.
  A client-supplied email is never trusted.

### 2.1b Password reset, email verification & session revocation
**What it does:** the standard account-recovery flows — which previously existed only as a
simulated UI.

- **Forgot password:** `POST /auth/forgot-password` stores a **hashed**, 1-hour, single-use
  token and emails the raw value. The endpoint always returns the same `200` whether or not
  the address exists, so it can't be used to enumerate users.
- **Reset password:** `POST /auth/reset-password` verifies the hashed token, re-hashes the new
  password with bcrypt, and **revokes every session on every device** (`tokensValidFrom` bump +
  refresh-token list cleared).
- **Email verification:** a 24-hour token is emailed at signup; `POST /auth/verify-email`
  confirms it. `POST /auth/resend-verification` is throttled to 3 per 5 minutes.
- **Email delivery:** `MailService` — logs to the console in development, sends via **Resend**
  in production (`RESEND_API_KEY` is *required* under `NODE_ENV=production` so a reset email
  can never silently disappear).
- **Refresh-token rotation + theft detection:** every refresh burns the old token and issues a
  new one. Refresh tokens are stored **hashed** (SHA-256, one entry per device, capped at 10).
  If a cryptographically valid token that has already been spent is presented, it means it was
  **replayed** — the API revokes every session for that account and logs the event.
  `POST /auth/logout` burns just this device; `POST /auth/logout-all` burns all of them.

### 2.2 Authorization (roles & ownership)
**What it does:** decides who can see and do what.

- A global **`JwtAuthGuard`** makes the API **deny-by-default**: every route needs a
  valid token unless explicitly marked `@Public()` (login, register, refresh, health,
  webhook).
- **`RolesGuard`** + `@Roles('admin' | 'company')` gate role-specific endpoints.
- **`assertSelfOrAdmin()`** protects every `/:userId` / `/:id` route so a user can only
  reach their own CV, roadmap, quiz sessions, and payment orders.
- Identity always comes from the verified JWT (`@CurrentUser()`), never from the request
  body. `admin` cannot be self-assigned at registration, and `role`/`email` are not
  self-editable.

### 2.3 Adaptive learning roadmap  *(core feature)*
**What it does:** generates a personalized, dependency-ordered set of learning modules
for a target role, and **reshapes it based on quiz performance**.

- **Generation:** `LLMService.generateRoadmap()` prompts **OpenAI (gpt-4o)** for a
  structured JSON roadmap (modules, prerequisites, hours, difficulty). Falls back to a
  deterministic mock in offline/dev mode.
- **Persistence:** stored in MongoDB with a status per module
  (`locked → in_progress → completed / failed`).
- **Adaptivity (pass):** passing a module's quiz auto-unlocks modules whose prerequisites
  are now all met (`unlockNextRoadmapModules`).
- **Adaptivity (fail):** failing injects a shorter **remedial module** built from the exact
  questions the learner missed (`addRemedialModule`), so they're never stuck.
- **Rendering:** the frontend draws the roadmap as a dependency tree.

### 2.4 Skill assessment (adaptive quiz)
**What it does:** verifies a skill with a short adaptive quiz.

- **Question generation:** `LLMService.generateQuiz()` via **OpenAI (gpt-4o-mini)**,
  JSON-structured; deterministic mock fallback offline.
- **Adaptive difficulty:** two correct in a row raises difficulty, two wrong lowers it.
- **Weighted scoring:** easy = 1, medium = 1.5, hard = 2; pass threshold 70%.
- **Session security:** a quiz session can only be answered by its owner
  (`assertSelfOrAdmin` inside `AssessmentService`).

### 2.5 CV builder & AI parser
**What it does:** upload a résumé to auto-fill a structured CV, edit it live, get AI-improved
bullet points, and export to PDF.

- **PDF parsing:** `pdf-parse` extracts text; **OpenAI** turns it into structured JSON
  (personal / experience / education / skills / projects). Heuristic regex parser as fallback.
- **Bullet enhancement:** `CvService.enhanceDescription()` via **OpenAI**.
- **Upload safety:** PDF-only, 5 MB max, enforced by a Multer `fileFilter`; an empty upload
  returns `400` (no silent mock).
- **Avatar upload:** **Cloudinary**.
- **Code health:** the 1808-line page was split into a presentational component +
  `useCvEditor` hook + icon/type modules.

### 2.6 Job matching & skill-gap analysis
**What it does:** ranks jobs against a candidate's *verified* skills and turns the gap into
learning modules.

- **Scoring (today):** a deterministic skill-overlap score in `HiringService.matchJobsForLearner()`.
  Verified skills come from completed roadmap modules; `matchScore` is the proportion of the job's
  required skills the candidate has, and `skillsGap` is the remainder. Exact and fully explainable.
- **Gap analysis → roadmap:** `POST /hiring/jobs/:jobId/close-gap` recomputes the gap **server-side**
  and writes the missing skills into the learner's active roadmap as new modules. "You're a 78% match,
  you're missing Docker" becomes an actual next step. (The UI button for this previously ran a
  `setTimeout` and only repainted the screen.)
- **Semantic search (built, not yet wired):** `RAGService` implements the full Qdrant path — collections
  created on boot, documents embedded with `text-embedding-3-small`, cosine-similarity retrieval, and a
  batched `upsert`. It is **not yet called by the matching service**, and the index is empty. The next
  step is a hybrid score (overlap for explainability + cosine for semantic recall) plus a job importer
  to populate the index. See `AI-ARCHITECTURE.md` §4.

### 2.7 Payments & subscriptions
**What it does:** paid Pro (learner) and Company tiers.

- **PayPal REST**: `createOrder` (price resolved **server-side** from the plan — the client
  can't send an amount), `capturePayment` (verifies the captured amount matches, and that
  the order belongs to the caller).
- **Signed webhook** (`POST /payment/webhook`) verified against PayPal via
  `verify-webhook-signature` — this is the source of truth for entitlements, and it handles
  refunds/reversals by downgrading the user.
- Subscription state (`plan`, `subscriptionStatus`, `subscriptionExpiresAt`) lives on the user.
- **Mock payments are hard-blocked in production** (the service throws on boot if PayPal
  creds are missing under `NODE_ENV=production`).

### 2.8 Recruiter side
**What it does:** companies browse candidates and (future) manage a hiring pipeline.

- `/company` dashboard + `/hiring/candidates` (company/admin only).
- Candidate data is protected personal data, gated by `RolesGuard`.

### 2.9 Messaging & notifications
- In-app **notifications** (`NotificationService`) with unread counts and mark-all-read.
- Direct **messages** between users (`MessageService`), all owner-scoped from the JWT.
- **Newsletter** subscription endpoint (upserts into MongoDB) — the footer used to call a
  route that didn't exist; it now does.

### 2.10 Onboarding content
- New users get a welcome notification + support chat, seeded **once at signup** (moved off
  the login hot path) and **disabled in production** unless `SEED_DEMO_CONTENT=true`, so demo
  data never reaches real users.

### 2.11 Internationalization & theming
- Full **English (LTR)** and **Arabic (RTL)** support via a custom `AppContext`, with logical
  margin/padding utilities and direction toggling.
- Two themes (`smartlight`, `smartdark`) via **DaisyUI**, persisted in `localStorage`.

### 2.12 Platform & operations
- **Config validation** with **Zod** (`env.validation.ts`): the API refuses to boot with an
  invalid/missing config instead of silently degrading. `MOCK_MODE` is an explicit opt-in and
  is rejected in production.
- **Health check** at `GET /health` (checks the Mongo connection).
- **Global exception filter** with a per-request `requestId` and structured logging.
- **Swagger** at `/docs` (non-production).
- **CORS allow-list** (no `*`), **helmet**, and **rate limiting** (100/min globally, 5/min on
  auth endpoints).

---

## 3. How each feature is verified

| Feature area | Automated (`npm run smoke`) | Manual (`QA-CHECKLIST.md`) |
|---|---|---|
| Health | §0 | — |
| Auth + cookies + tokens | §1 (7 checks) | A1–A9 |
| Refresh rotation + theft detection | §1b (2 checks) | I2, I3 |
| Password reset + email verification | §1c (5 checks) | A10–A13 |
| Deny-by-default authz | §2 (8 checks) | B3 |
| Privilege escalation | §3 (4 checks) | B1, B2, B5 |
| Google anti-spoofing | §4 (2 checks) | A7, A8 |
| IDOR / ownership | §5 (4 checks) | B4 |
| Roadmap + adaptive quiz | §6 (7 checks) | C1–C7 |
| Skill gap → roadmap | §6b (2 checks) | E4 |
| Payments | §7 (5 checks) | F1–F3 |
| Uploads, newsletter, throttling | §8 (4 checks) | D4–D6, G3 |
| CV builder UI | — | D1–D7 |
| Matching / recruiter | partial (§5) | E1–E3 |
| Messaging / notifications | — | G1–G2 |
| i18n / theming | — | H1–H2 |
| Resilience | — | I1–I3 |

Unit tests (`npm test`, 15 tests) cover the auth service (bcrypt, no admin self-assign,
Google-on-local-account rejection, refresh-vs-access separation), the ownership utility,
the health/newsletter controller, and the refresh-cookie flags.

**Latest run:** `53 passed · 0 failed` against a live server (MongoDB in-memory, mock mode).

---

## 4. Running the tests

```bash
# unit tests (no external services needed)
npm test --workspace @smartroadmap/api      # 15 passing

# full end-to-end + security suite (needs a running API)
docker compose up -d
npm run dev
npm run smoke                                # 53 passing

# point the suite at any environment
API_URL=https://staging.smartroadmap.io npm run smoke
```
