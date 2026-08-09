# SmartRoadmap — Master SKILL.md

> AI-Powered Personalized Learning & Hiring Platform  
> Team: Developia · Mohamed Elsaied · Ali Maher · Marina George · Nada Nasr  
> Supervisor: Noha Salah

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Full Tech Stack](#2-full-tech-stack)
3. [Design System](#3-design-system)
4. [Application Architecture](#4-application-architecture)
5. [Frontend — Pages & Features](#5-frontend--pages--features)
6. [Backend — Modules & API](#6-backend--modules--api)
7. [AI Layer — LLM · RAG · Agents](#7-ai-layer--llm--rag--agents)
8. [Database Schema](#8-database-schema)
9. [External Services & API Keys](#9-external-services--api-keys)
10. [Environment Variables](#10-environment-variables)
11. [Project Structure](#11-project-structure)
12. [Development Conventions](#12-development-conventions)

---

## 1. Project Overview

### What It Is

SmartRoadmap is a full-stack EdTech / HR-Tech platform with three core loops:

1. **Learn** — AI generates a personalised, adaptive learning roadmap per user based on their current skill level, background, and target career goal.
2. **Prove** — Learners unlock the next module only by passing adaptive quizzes that verify real mastery (not just completion).
3. **Hire** — Companies see only pre-vetted candidates whose skill profiles are backed by documented test scores and completed projects.

### The Three AI Pillars

| Pillar                 | What It Does                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **LLM (Intelligence)** | Interprets diagnostics, generates roadmaps with dependency graphs, produces adaptive quiz questions per learner level              |
| **RAG (Knowledge)**    | Semantic retrieval over curated learning resources, live job postings, and historical assessment data                              |
| **Agents (Action)**    | Scrapes and re-ranks job-market skill demands, auto-matches CVs to company requirements, triggers reinforcement content on failure |

### Target Users

- **Learners** — university students, fresh graduates, career switchers
- **Companies** — HR teams at tech and non-tech companies seeking verified talent

---

## 2. Full Tech Stack

### Frontend

| Library / Tool   | Version         | Purpose                                                            |
| ---------------- | --------------- | ------------------------------------------------------------------ |
| Next.js          | 14 (App Router) | SSR, SSG, routing, layout system                                   |
| React            | 18              | Component model, hooks, context                                    |
| TypeScript       | 5.x             | Full strict mode across all files                                  |
| Tailwind CSS     | 3.x             | Utility-first styling                                              |
| DaisyUI          | 4.x             | Component library — all colors via semantic tokens only            |
| Framer Motion    | 11.x            | Page transitions, micro-animations, roadmap reveals                |
| React Hook Form  | 7.x             | All form state, validation, multi-step wizard                      |
| Zod              | 3.x             | Schema validation — shared with backend DTOs                       |
| TanStack Query   | 5.x             | Server state, caching, optimistic mutations                        |
| TanStack Table   | 8.x             | Admin/company data tables with sorting/filtering                   |
| Recharts         | 2.x             | Progress charts, skill gap visualisations, score timelines         |
| React Flow       | 11.x            | Interactive roadmap graph (nodes = modules, edges = prerequisites) |
| React PDF        | 3.x             | In-browser CV preview and PDF export                               |
| next-intl        | 3.x             | i18n — Arabic (RTL) + English (LTR)                                |
| Zustand          | 4.x             | Lightweight client state (auth slice, UI state)                    |
| next-themes      | —               | Dark/light theme switcher                                          |
| Lottie React     | —               | Animated illustrations (empty states, success, loading)            |
| Socket.io-client | 4.x             | Real-time notifications, live quiz timer sync                      |
| GSAP             | 3.x             | Hero animations, roadmap entrance sequences                        |

### Backend

| Library / Tool         | Version | Purpose                                                      |
| ---------------------- | ------- | ------------------------------------------------------------ |
| NestJS                 | 10.x    | Modular backend framework                                    |
| Node.js                | 20 LTS  | Runtime                                                      |
| TypeScript             | 5.x     | Strict mode                                                  |
| TypeORM                | 0.3.x   | ORM — entities, migrations, relations                        |
| PostgreSQL             | 15      | Primary relational database                                  |
| pgvector               | 0.7.x   | Vector column on PostgreSQL (fallback if Qdrant unavailable) |
| Qdrant                 | Cloud   | Primary vector database for RAG                              |
| Socket.io              | 4.x     | WebSocket gateway — notifications, quiz sessions             |
| Bull / BullMQ          | 5.x     | Job queues — agent tasks, email, PDF generation              |
| Redis                  | 7       | Bull queue backend + API response cache                      |
| Passport.js            | —       | JWT strategy, local strategy                                 |
| @nestjs/jwt            | —       | JWT signing/verification                                     |
| class-validator        | —       | DTO validation                                               |
| class-transformer      | —       | DTO serialisation                                            |
| Swagger / OpenAPI      | —       | Auto-generated API docs at `/api/docs`                       |
| Multer                 | —       | File upload handling                                         |
| Sharp                  | —       | Image optimisation (profile photos)                          |
| PDFKit                 | —       | Server-side PDF generation (certificates, CV export)         |
| Nodemailer + Resend    | —       | Transactional email                                          |
| LangChain.js           | 0.2.x   | LLM chains, RAG pipeline, agent orchestration                |
| OpenAI Node SDK        | 4.x     | GPT-4o / GPT-4o-mini / text-embedding-3-small                |
| @qdrant/js-client-rest | —       | Qdrant vector DB client                                      |

### Infrastructure & DevOps

| Tool                    | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| Docker + docker-compose | Local dev environment (Postgres, Redis, Qdrant) |
| Cloudflare R2           | Object storage (CVs, generated PDFs, images)    |
| Supabase                | Managed Postgres + Auth (optional Auth layer)   |
| Vercel                  | Next.js hosting (frontend)                      |
| Railway / Render        | NestJS API hosting                              |
| GitHub Actions          | CI — lint, typecheck, test, build               |
| ESLint + Prettier       | Code quality                                    |
| Husky + lint-staged     | Pre-commit hooks                                |

---

## 3. Design System

### Philosophy

- **DaisyUI semantic tokens only** — never hardcode hex values; always use `bg-base-100`, `text-primary`, `border-base-300`, etc.
- **Bilingual by default** — every layout must work in both LTR (English) and RTL (Arabic) via `next-intl` + `dir` attribute on `<html>`
- **Dark / Light** — DaisyUI `data-theme` attribute; default dark for learner dashboards, light optional
- **No mock data anywhere** — every component is wired to real API via TanStack Query

### DaisyUI Theme Configuration (`tailwind.config.ts`)

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        smartdark: {
          primary: "#6366f1", // indigo-500 — roadmap nodes, CTAs
          "primary-content": "#ffffff",
          secondary: "#818cf8", // indigo-400 — secondary actions
          "secondary-content": "#ffffff",
          accent: "#22c55e", // green-500 — success, completed modules
          "accent-content": "#ffffff",
          neutral: "#1e293b", // slate-800 — cards, surfaces
          "neutral-content": "#cbd5e1",
          "base-100": "#0f172a", // slate-900 — page background
          "base-200": "#1e293b", // slate-800 — card background
          "base-300": "#334155", // slate-700 — borders, dividers
          "base-content": "#f1f5f9", // slate-100 — body text
          info: "#38bdf8", // sky-400
          success: "#22c55e", // green-500
          warning: "#eab308", // yellow-500
          error: "#ef4444", // red-500
        },
      },
      {
        smartlight: {
          primary: "#4f46e5", // indigo-600
          "primary-content": "#ffffff",
          secondary: "#7c3aed", // violet-600
          "secondary-content": "#ffffff",
          accent: "#16a34a", // green-600
          "accent-content": "#ffffff",
          neutral: "#f1f5f9", // slate-100
          "neutral-content": "#1e293b",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#e2e8f0",
          "base-content": "#0f172a",
          info: "#0ea5e9",
          success: "#16a34a",
          warning: "#d97706",
          error: "#dc2626",
        },
      },
    ],
    darkTheme: "smartdark",
    base: true,
    styled: true,
    utils: true,
  },
};

export default config;
```

### Typography Scale

```css
/* globals.css — extend DaisyUI base */
:root {
  --font-display: "Cal Sans", "Inter", sans-serif; /* headings */
  --font-body: "Inter", sans-serif; /* body text */
  --font-mono: "JetBrains Mono", monospace; /* code, badges */
}

/* Type scale */
.text-display-xl {
  font-size: 3.5rem;
  line-height: 1.1;
  font-weight: 800;
}
.text-display-lg {
  font-size: 2.5rem;
  line-height: 1.2;
  font-weight: 700;
}
.text-display-md {
  font-size: 1.875rem;
  line-height: 1.3;
  font-weight: 700;
}
.text-body-lg {
  font-size: 1.125rem;
  line-height: 1.75;
}
.text-body-md {
  font-size: 1rem;
  line-height: 1.7;
}
.text-body-sm {
  font-size: 0.875rem;
  line-height: 1.6;
}
.text-caption {
  font-size: 0.75rem;
  line-height: 1.5;
  letter-spacing: 0.05em;
}
```

### Component Patterns

#### Cards

```tsx
// Standard card — always bg-base-200, border border-base-300
<div className="card bg-base-200 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
  <div className="card-body">
    <h2 className="card-title text-base-content">{title}</h2>
    <p className="text-base-content/70">{description}</p>
  </div>
</div>
```

#### Badges / Status Pills

```tsx
// Module status
const statusMap = {
  locked:     'badge badge-ghost',
  in_progress:'badge badge-warning',
  completed:  'badge badge-success',
  failed:     'badge badge-error',
}
<span className={statusMap[module.status]}>{module.status}</span>
```

#### Buttons

```tsx
// Primary CTA
<button className="btn btn-primary">Start Learning</button>

// Secondary
<button className="btn btn-secondary btn-outline">View Jobs</button>

// Loading state
<button className="btn btn-primary" disabled={isPending}>
  {isPending && <span className="loading loading-spinner loading-sm" />}
  Generate Roadmap
</button>
```

#### RTL Support

```tsx
// layout.tsx
import { getLocale } from "next-intl/server";

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-theme="smartdark"
    >
      <body>{children}</body>
    </html>
  );
}
```

### Animation Patterns (Framer Motion)

```tsx
// Page entrance — every route uses this
export const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// Stagger children (module cards, quiz options)
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

// Roadmap node reveal (React Flow + Framer)
export const nodeEntrance = {
  initial: { scale: 0.7, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};
```

---

## 4. Application Architecture

```
┌─────────────────────────────────────────────────┐
│                   Next.js 14                    │
│  App Router · SSR · SSG · next-intl · Zustand   │
└──────────────────────┬──────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼──────────────────────────┐
│                   NestJS API                    │
│  Auth · Roadmap · Assessment · Hiring · AI      │
│  Bull Queues · Socket.io Gateway                │
└────────┬──────────────┬────────────────┬────────┘
         │              │                │
   ┌─────▼────┐  ┌──────▼──────┐  ┌────▼──────┐
   │PostgreSQL│  │   Qdrant    │  │  Redis    │
   │ TypeORM  │  │  Vectors    │  │  Queues   │
   └──────────┘  └─────────────┘  └───────────┘
         │
   ┌─────▼──────────────────────────────────────┐
   │           External Services                │
   │  OpenAI · Adzuna · Affinda · R2 · Resend   │
   └────────────────────────────────────────────┘
```

### Data Flow — Roadmap Generation

```
User submits diagnostic → NestJS /roadmap/generate
  → LangChain chain: diagnostic prompt → GPT-4o
  → Parse JSON roadmap (modules + dependencies)
  → Store in PostgreSQL (roadmaps + modules tables)
  → Embed module descriptions → Qdrant
  → Return roadmap to client
  → React Flow renders interactive graph
```

### Data Flow — RAG Resource Retrieval

```
User opens module → NestJS /resources?moduleId=X
  → Embed module topic → OpenAI text-embedding-3-small
  → Qdrant similarity search (top 5 resources)
  → Return ranked resources to client
```

### Data Flow — Job Matching

```
Agent (Bull queue, daily) → fetch Adzuna jobs by country/specialisation
  → Embed each job description → Qdrant (jobs collection)
  → On match request: embed learner skill profile
  → Qdrant ANN search → ranked job matches
  → Return to company portal / learner hiring tab
```

---

## 5. Frontend — Pages & Features

### Route Map (`/src/app/[locale]/`)

```
/                           Landing page
/auth/login                 Login
/auth/register              Register (multi-step wizard)
/auth/forgot-password       Password reset
/onboarding                 Diagnostic quiz → roadmap generation
/dashboard                  Learner home — progress overview
/roadmap                    Interactive roadmap graph (React Flow)
/roadmap/[moduleId]         Module detail — resources + quiz CTA
/quiz/[moduleId]            Adaptive quiz session
/quiz/[moduleId]/results    Score breakdown + recommendations
/cv                         CV builder + PDF export
/hiring                     Job matches for learner
/profile                    Account settings, language, theme
/company                    Company portal (separate auth role)
/company/candidates         Browse pre-vetted candidates
/company/[candidateId]      Candidate profile + skill scores
/admin                      Admin dashboard
/admin/users                User management (TanStack Table)
/admin/content              Learning resource management
```

### Page-by-Page Feature Spec

---

#### `/` — Landing Page

**Purpose:** Convert visitors to registered users. SSG for performance.

**Sections:**

1. **Hero** — Headline + animated roadmap preview (GSAP path draw), CTA: "Start for free"
2. **Problem Statement** — Split card: "For Learners" / "For Companies"
3. **How It Works** — 3-step visual: Diagnose → Learn → Get Hired
4. **AI Trinity** — Three cards: LLM / RAG / Agents with Lottie animations
5. **Social Proof** — Testimonials carousel (Framer Motion)
6. **Pricing** — Free / Pro / Company tiers
7. **Footer** — Links, language toggle, theme switcher

**Key components:**

```tsx
<HeroSection />          // GSAP animated roadmap line drawing
<ProblemCards />         // motion.div stagger entrance
<HowItWorksSteps />      // scroll-triggered reveal
<AITrinityCards />       // Lottie animations per pillar
<TestimonialsCarousel /> // Framer Motion drag-to-scroll
<PricingTable />         // DaisyUI card grid
```

---

#### `/auth/register` — Multi-Step Registration Wizard

**Steps:**

1. Basic info (name, email, password)
2. Role selection (Learner / Company)
3. Background (education, current role, years experience)
4. Target goal (career goal selector — seeded list + freeform)
5. Email verification

**Libraries:** React Hook Form + Zod per step, TanStack Query mutation, `useMultiStepForm` custom hook

**Validation schema (example — step 1):**

```ts
const step1Schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});
```

---

#### `/onboarding` — Diagnostic Quiz → Roadmap Generation

**Flow:**

1. Dynamic diagnostic questions (5–10 questions, GPT-4o generated per target goal)
2. Real-time progress bar
3. Submit → loading state with animated roadmap being "built" (Lottie)
4. Redirect to `/roadmap` on completion

**State:** Zustand `diagnosticSlice` — persists answers across steps  
**API:** `POST /roadmap/generate` with diagnostic payload  
**Streaming:** SSE (Server-Sent Events) for live generation feedback

---

#### `/roadmap` — Interactive Roadmap Graph

**Core library:** React Flow 11

**Node types:**

```ts
type ModuleNode = {
  id: string;
  type: "module";
  data: {
    title: string;
    status: "locked" | "in_progress" | "completed" | "failed";
    estimatedHours: number;
    prerequisites: string[];
  };
};
```

**Visual encoding:**

- `completed` → `bg-success` node, solid border
- `in_progress` → `bg-warning` node, pulsing ring (Framer Motion)
- `locked` → `bg-base-300` node, lock icon overlay
- `failed` → `bg-error` node, retry badge

**Interactions:**

- Click node → slide-over panel with module detail
- Hover node → tooltip with estimated time + prerequisite list
- Mini-map in bottom-right corner
- "Expand subtopics" button on each node (fetches sub-nodes via API)

**Data:** TanStack Query `useRoadmap(userId)` → cached, refetch on focus

---

#### `/quiz/[moduleId]` — Adaptive Quiz Session

**Features:**

- Question count: 5–15 (dynamic based on module complexity)
- Question types: MCQ, True/False, Code snippet (syntax highlighted), Short answer
- Adaptive difficulty: if 2 consecutive correct → harder; 2 consecutive wrong → easier (tracked in local state + sent to API)
- Timer: per-question timer (Socket.io sync for potential multiplayer future)
- Immediate feedback after each answer (correct/incorrect + explanation from GPT-4o)
- Progress indicator (question X of Y)
- Anti-cheat: tab-switch detection, time-per-question logged

**State machine (Zustand):**

```ts
type QuizState = {
  status: "idle" | "in_progress" | "reviewing" | "completed";
  currentQuestionIndex: number;
  answers: Record<number, string>;
  difficulty: "easy" | "medium" | "hard";
  timePerQuestion: number[];
  score: number | null;
};
```

---

#### `/cv` — CV Builder + PDF Export

**Sections:** Personal info, Summary, Experience, Education, Skills, Projects, Certifications

**Features:**

- Upload existing CV → Affinda parse → auto-fill form fields
- AI enhancement: per-section "Improve with AI" button → GPT-4o-mini rewrites the bullet
- Skill tagging: autocomplete from platform's verified skills taxonomy
- SmartRoadmap badge: auto-injected section showing completed modules + scores
- Live PDF preview (React PDF, updates on every keystroke — debounced 500ms)
- Export: PDF download (React PDF) + shareable link

---

#### `/hiring` — Job Matches (Learner View)

**Features:**

- Ranked job list from Adzuna — sorted by semantic similarity to learner profile
- Match percentage badge per job (Qdrant cosine similarity score → normalised)
- Skill gap per job: "You're missing: Docker, Kubernetes — add these to your roadmap"
- One-click "Add gap skills to roadmap" → calls `/roadmap/extend`
- Filter: country, remote, salary range, tech stack
- Apply tracker (status: saved / applied / interviewing / offer)

---

#### `/company` — Company Portal

**Features:**

- Dashboard: total candidates in pipeline, average match score, active job postings
- Candidate search: filter by skill, min score, available for hire, location
- Candidate card: profile photo, target role, top 5 skills with scores, completed modules, download CV
- Create job posting: form → embedded into Qdrant for candidate matching
- Match refresh: "Re-run matching" button → triggers Bull queue job

---

#### `/admin` — Admin Dashboard

**Features:**

- User management: TanStack Table — search, sort, role change, ban, delete
- Content management: CRUD for learning resources (video, article, project links)
- Analytics: Recharts — daily signups, module completion rates, quiz pass rates, job match conversions
- AI cost tracker: OpenAI token usage by day/module (from logged metadata)

---

### Shared Components Library (`/src/components/`)

```
ui/
  Button.tsx            // extends DaisyUI btn, adds loading + icon slots
  Card.tsx              // DaisyUI card + motion.div wrapper
  Badge.tsx             // DaisyUI badge + status colour mapping
  Modal.tsx             // DaisyUI modal + Framer Motion entrance
  Drawer.tsx            // DaisyUI drawer — slide-over panels
  Toast.tsx             // DaisyUI toast — wraps react-hot-toast
  Skeleton.tsx          // DaisyUI skeleton — loading states
  EmptyState.tsx        // Lottie animation + message + CTA
  Avatar.tsx            // DaisyUI avatar + online indicator

forms/
  Input.tsx             // RHF Controller + DaisyUI input + error
  Select.tsx            // RHF Controller + DaisyUI select
  Textarea.tsx          // RHF Controller + DaisyUI textarea
  FileUpload.tsx        // Drag & drop + multer-ready FormData
  MultiStepForm.tsx     // Step wrapper with progress indicator

layout/
  Navbar.tsx            // Auth-aware, bilingual, theme switcher
  Sidebar.tsx           // Learner / Company / Admin variants
  Footer.tsx            // DaisyUI footer
  PageWrapper.tsx       // Framer Motion page transitions
  LanguageSwitcher.tsx  // next-intl locale toggle
  ThemeSwitcher.tsx     // DaisyUI theme toggle (smartdark / smartlight)

roadmap/
  RoadmapGraph.tsx      // React Flow wrapper
  ModuleNode.tsx        // Custom React Flow node
  ModulePanel.tsx       // Slide-over detail panel
  ProgressRing.tsx      // SVG progress circle per module

quiz/
  QuizQuestion.tsx      // Question renderer (MCQ / TF / code)
  QuizTimer.tsx         // Countdown with Socket.io sync
  QuizProgress.tsx      // Step indicator
  QuizResult.tsx        // Score + breakdown + next steps

charts/
  ProgressChart.tsx     // Recharts area chart — score over time
  SkillRadar.tsx        // Recharts radar — skill coverage
  CompletionBar.tsx     // Recharts bar — module completion rates
```

---

### TanStack Query Key Convention

```ts
// queryKeys.ts
export const keys = {
  roadmap: (userId: string) => ["roadmap", userId],
  module: (moduleId: string) => ["module", moduleId],
  quiz: (moduleId: string) => ["quiz", moduleId],
  resources: (moduleId: string) => ["resources", moduleId],
  jobs: (filters: JobFilters) => ["jobs", filters],
  candidates: (filters: CandidateFilters) => ["candidates", filters],
  cv: (userId: string) => ["cv", userId],
  profile: (userId: string) => ["profile", userId],
};
```

---

## 6. Backend — Modules & API

### Module Map (`/src/`)

```
modules/
  auth/           JWT auth, refresh, email verify, password reset
  users/          Profile CRUD, role management
  roadmap/        Roadmap generation, module CRUD, progress tracking
  assessment/     Quiz generation, session management, scoring
  resources/      Learning resource CRUD, RAG indexing
  hiring/         Job postings, candidate matching, applications
  cv/             CV parse (Affinda), build, export
  ai/             LLM service, embedding service, agent runners
  notifications/  Socket.io gateway, notification CRUD
  files/          Multer upload, R2 storage
  email/          Resend transactional email
  queue/          BullMQ job definitions and processors
  admin/          Admin-only endpoints, analytics aggregation
```

### Auth Module

**Endpoints:**

```
POST /auth/register        Create account, send verification email
POST /auth/login           Returns { accessToken, refreshToken }
POST /auth/refresh         Rotate refresh token
POST /auth/logout          Blacklist refresh token (Redis)
POST /auth/verify-email    Verify email via token
POST /auth/forgot-password Send reset link
POST /auth/reset-password  Consume reset token, update password
GET  /auth/me              Current user profile
```

**JWT Strategy:**

```ts
// Access token: 15 minutes
// Refresh token: 30 days, stored in Redis with userId mapping
// Blacklist: Redis SET of invalidated refresh tokens
```

**Guards:**

```ts
@UseGuards(JwtAuthGuard)              // any authenticated user
@UseGuards(JwtAuthGuard, RolesGuard)  // role-restricted
@Roles('company')                     // company-only
@Roles('admin')                       // admin-only
```

---

### Roadmap Module

**Endpoints:**

```
POST   /roadmap/generate           Generate personalised roadmap (AI)
GET    /roadmap/:id                Get full roadmap with modules
GET    /roadmap/:id/progress       Progress summary (% complete, scores)
PATCH  /roadmap/:id/modules/:mid   Update module status
POST   /roadmap/:id/extend         Add skill gap modules to roadmap
DELETE /roadmap/:id                Delete roadmap
```

**Generation flow:**

```ts
async generateRoadmap(dto: GenerateRoadmapDto): Promise<Roadmap> {
  // 1. Build system prompt from user background + target goal
  // 2. Call GPT-4o with structured output (JSON schema)
  // 3. Parse into modules[] with prerequisite graph
  // 4. Persist to PostgreSQL
  // 5. Embed each module title+description → Qdrant
  // 6. Return roadmap entity
}
```

**GPT-4o Structured Output Schema:**

```ts
const roadmapSchema = z.object({
  title: z.string(),
  totalEstimatedHours: z.number(),
  modules: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      prerequisites: z.array(z.string()), // IDs of prerequisite modules
      estimatedHours: z.number(),
      topics: z.array(z.string()),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    }),
  ),
});
```

---

### Assessment Module

**Endpoints:**

```
POST   /assessment/quiz/generate    Generate quiz for a module (AI)
POST   /assessment/session/start    Start a quiz session
POST   /assessment/session/:id/answer  Submit an answer
GET    /assessment/session/:id/results  Get session results
GET    /assessment/history/:userId  All past quiz sessions
```

**Adaptive difficulty logic:**

```ts
// In session processor
function adjustDifficulty(history: Answer[]): Difficulty {
  const last2 = history.slice(-2);
  if (last2.every((a) => a.correct)) return "hard";
  if (last2.every((a) => !a.correct)) return "easy";
  return "medium";
}
```

**Scoring:**

- Pass threshold: 70%
- Score stored per question (difficulty weight: easy=1, medium=1.5, hard=2)
- Weighted score determines module unlock

---

### AI Module

**Services:**

```ts
// LLMService — wraps OpenAI SDK
class LLMService {
  async complete(prompt: string, schema?: ZodSchema): Promise<any>;
  async stream(prompt: string): Promise<AsyncIterable<string>>;
}

// EmbeddingService — text → vector
class EmbeddingService {
  async embed(text: string): Promise<number[]>;
  async embedBatch(texts: string[]): Promise<number[][]>;
}

// RAGService — retrieve relevant context
class RAGService {
  async retrieveResources(topic: string, topK = 5): Promise<Resource[]>;
  async retrieveJobs(skillProfile: string[], topK = 10): Promise<Job[]>;
  async indexResource(resource: Resource): Promise<void>;
  async indexJob(job: Job): Promise<void>;
}

// AgentService — autonomous task runners
class AgentService {
  async runJobScraperAgent(): Promise<void>; // Bull queue, daily cron
  async runCVMatcherAgent(userId: string): Promise<JobMatch[]>;
  async runGapDetectorAgent(sessionId: string): Promise<string[]>;
}
```

---

### Hiring Module

**Endpoints:**

```
GET    /hiring/jobs                 All jobs (paginated, filtered)
GET    /hiring/jobs/matches/:userId Ranked job matches for learner
POST   /hiring/jobs                 Create job posting (company)
PATCH  /hiring/jobs/:id             Update job posting
DELETE /hiring/jobs/:id             Remove job posting
GET    /hiring/candidates           Browse candidates (company)
GET    /hiring/candidates/:userId   Candidate profile
POST   /hiring/applications         Apply to a job
PATCH  /hiring/applications/:id     Update application status
```

**Match algorithm:**

```
1. Embed learner skill profile (skills[] + scores[])
2. Qdrant ANN search in jobs collection
3. Return top-N with cosine similarity score
4. Enrich with missing skills gap list
5. Cache result in Redis (TTL: 1 hour)
```

---

### WebSocket Gateway (Socket.io)

**Namespace:** `/notifications`

**Events emitted to client:**

```ts
"notification:new"; // { id, type, message, timestamp }
"quiz:timer:tick"; // { secondsRemaining }
"roadmap:updated"; // { moduleId, newStatus }
"match:found"; // { jobId, score }
```

**Events received from client:**

```ts
"quiz:answer:submit"; // { sessionId, questionId, answer }
"notification:read"; // { notificationId }
```

---

### Queue Jobs (BullMQ)

```ts
// Queue definitions
const QUEUES = {
  EMAIL:          'email',
  PDF_GENERATION: 'pdf-generation',
  JOB_SCRAPE:     'job-scrape',         // runs daily via cron
  CV_PROCESS:     'cv-process',          // after CV upload
  EMBEDDING:      'embedding',           // after resource added
}

// Job processors
EmailProcessor         → Resend API
PdfProcessor           → PDFKit → R2 upload
JobScrapeProcessor     → Adzuna API → embed → Qdrant
CvProcessProcessor     → Affinda API → parse → update user profile
EmbeddingProcessor     → OpenAI embed → Qdrant upsert
```

---

## 7. AI Layer — LLM · RAG · Agents

### LangChain.js Pipeline

```
LLM Chains (LangChain.js)
├── RoadmapChain        → diagnostic → structured roadmap JSON
├── QuizChain           → module topic + difficulty → quiz JSON
├── CVEnhanceChain      → raw bullet → improved bullet
└── JobMatchChain       → skill profile → job fit score + gap list

RAG Pipeline
├── Indexing            → chunk → embed → upsert Qdrant
│   ├── Resources       → title + description + URL
│   ├── Jobs            → title + description + required_skills
│   └── Assessments     → question + correct_answer (for memory)
└── Retrieval           → query embed → Qdrant ANN → ranked results

Agents (LangChain AgentExecutor)
├── JobScraperAgent     → Adzuna API tool → embed → Qdrant upsert
├── CVMatcherAgent      → skill profile tool + Qdrant search tool
└── GapDetectorAgent    → quiz result tool + roadmap tool → extend plan
```

### Prompt Templates

```ts
// Roadmap generation — system prompt
export const ROADMAP_SYSTEM = `
You are a senior curriculum designer. Given a learner's background and target career goal,
generate a comprehensive, structured learning roadmap in JSON format.

Rules:
- Modules must have clear prerequisite dependencies (form a DAG, never circular)
- Each module should take 4–20 hours
- Total roadmap: 100–400 hours depending on complexity
- Difficulty should progress: beginner → intermediate → advanced
- Include practical projects at the end of each major section
- Output ONLY valid JSON matching the provided schema
`;

// Quiz generation — user prompt template
export const QUIZ_PROMPT = (
  topic: string,
  difficulty: string,
  count: number,
) => `
Generate ${count} quiz questions about "${topic}" at ${difficulty} level.
Mix question types: MCQ (70%), True/False (20%), Code snippet (10%).
Each question must include: question, options (for MCQ), correct_answer, explanation.
Output ONLY valid JSON.
`;
```

### Qdrant Collections

```ts
// Collection: learning_resources
{
  collection_name: 'learning_resources',
  vectors: { size: 1536, distance: 'Cosine' },  // text-embedding-3-small
  payload_schema: {
    title: 'keyword',
    url: 'keyword',
    type: 'keyword',       // 'video' | 'article' | 'project'
    module_topic: 'text',
    difficulty: 'keyword',
    language: 'keyword',   // 'en' | 'ar'
  }
}

// Collection: job_postings
{
  collection_name: 'job_postings',
  vectors: { size: 1536, distance: 'Cosine' },
  payload_schema: {
    adzuna_id: 'keyword',
    title: 'keyword',
    company: 'keyword',
    location: 'keyword',
    country: 'keyword',
    required_skills: 'keyword[]',
    salary_min: 'integer',
    salary_max: 'integer',
    posted_at: 'datetime',
  }
}

// Collection: candidate_profiles
{
  collection_name: 'candidate_profiles',
  vectors: { size: 1536, distance: 'Cosine' },
  payload_schema: {
    user_id: 'keyword',
    skills: 'keyword[]',
    target_role: 'keyword',
    experience_years: 'integer',
    available: 'bool',
  }
}
```

---

## 8. Database Schema

### Core Tables (PostgreSQL + TypeORM)

```sql
-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20) DEFAULT 'learner',   -- learner | company | admin
  avatar_url    TEXT,
  is_verified   BOOLEAN DEFAULT FALSE,
  locale        VARCHAR(10) DEFAULT 'en',
  theme         VARCHAR(20) DEFAULT 'smartdark',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Learner profiles
CREATE TABLE learner_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  target_role       VARCHAR(100),
  current_role      VARCHAR(100),
  education_level   VARCHAR(50),
  experience_years  INTEGER DEFAULT 0,
  skills            TEXT[],                 -- self-reported initial skills
  available_for_hire BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id)
);

-- Company profiles
CREATE TABLE company_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  industry     VARCHAR(100),
  size         VARCHAR(50),
  website      TEXT,
  logo_url     TEXT,
  UNIQUE(user_id)
);

-- Roadmaps
CREATE TABLE roadmaps (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID REFERENCES users(id) ON DELETE CASCADE,
  title                  VARCHAR(255) NOT NULL,
  target_role            VARCHAR(100),
  total_estimated_hours  INTEGER,
  status                 VARCHAR(20) DEFAULT 'active',
  created_at             TIMESTAMP DEFAULT NOW()
);

-- Modules
CREATE TABLE modules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id       UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  difficulty       VARCHAR(20),
  estimated_hours  INTEGER,
  topics           TEXT[],
  prerequisites    UUID[],                  -- array of module IDs
  status           VARCHAR(20) DEFAULT 'locked',
  position_x       FLOAT,                  -- React Flow node position
  position_y       FLOAT,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- Learning resources
CREATE TABLE resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id   UUID REFERENCES modules(id) ON DELETE SET NULL,
  title       VARCHAR(255) NOT NULL,
  url         TEXT NOT NULL,
  type        VARCHAR(20),               -- video | article | project
  language    VARCHAR(10) DEFAULT 'en',
  qdrant_id   UUID                       -- corresponding Qdrant point ID
);

-- Quiz sessions
CREATE TABLE quiz_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  module_id    UUID REFERENCES modules(id),
  status       VARCHAR(20) DEFAULT 'in_progress',
  score        FLOAT,
  passed       BOOLEAN,
  started_at   TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Quiz answers
CREATE TABLE quiz_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  user_answer TEXT,
  correct     BOOLEAN,
  difficulty  VARCHAR(20),
  time_taken  INTEGER                    -- seconds
);

-- CVs
CREATE TABLE cvs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  data        JSONB NOT NULL,            -- structured CV JSON
  file_url    TEXT,                      -- R2 URL
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Job postings
CREATE TABLE job_postings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adzuna_id       VARCHAR(100) UNIQUE,   -- null for company-created
  company_id      UUID REFERENCES company_profiles(id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  location        VARCHAR(100),
  country         VARCHAR(50),
  required_skills TEXT[],
  salary_min      INTEGER,
  salary_max      INTEGER,
  remote          BOOLEAN DEFAULT FALSE,
  qdrant_id       UUID,
  posted_at       TIMESTAMP DEFAULT NOW()
);

-- Applications
CREATE TABLE applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  job_id      UUID REFERENCES job_postings(id),
  status      VARCHAR(30) DEFAULT 'saved',
  applied_at  TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50),
  message    TEXT,
  data       JSONB,
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_modules_roadmap_id ON modules(roadmap_id);
CREATE INDEX idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX idx_applications_user  ON applications(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_job_postings_country ON job_postings(country);
```

---

## 9. External Services & API Keys

| Service         | Purpose             | Free Tier      | API Key Env Var                              |
| --------------- | ------------------- | -------------- | -------------------------------------------- |
| OpenAI          | LLM + embeddings    | $5 credit      | `OPENAI_API_KEY`                             |
| Qdrant Cloud    | Vector database     | 1 GB free      | `QDRANT_URL`, `QDRANT_API_KEY`               |
| Adzuna          | Live job postings   | 250 req/mo     | `ADZUNA_APP_ID`, `ADZUNA_API_KEY`            |
| Affinda         | CV parsing          | 50 docs/mo     | `AFFINDA_API_KEY`, `AFFINDA_WORKSPACE_ID`    |
| Supabase        | Postgres + auth     | 500 MB free    | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`  |
| Cloudflare R2   | File storage        | 10 GB free     | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| Resend          | Transactional email | 3,000/mo free  | `RESEND_API_KEY`                             |
| Redis (Upstash) | Queues + cache      | 10,000 req/day | `REDIS_URL`                                  |

**Estimated MVP monthly cost: $17–$93** (dominant variable: Adzuna at scale — cache job results with 24h TTL)

---

## 10. Environment Variables

```bash
# ── App ──────────────────────────────────────────
NODE_ENV=production
PORT=3000
APP_URL=https://smartroadmap.io
FRONTEND_URL=https://smartroadmap.io

# ── Database ─────────────────────────────────────
DATABASE_URL=postgresql://user:pass@host:5432/smartroadmap
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ── Auth ─────────────────────────────────────────
JWT_SECRET=your_256bit_secret_min_32_chars
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRY=30d

# ── OpenAI ───────────────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...
OPENAI_MODEL_SMART=gpt-4o
OPENAI_MODEL_FAST=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# ── Qdrant ───────────────────────────────────────
QDRANT_URL=https://xyz.europe-west3-0.gcp.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_key

# ── Job Data ─────────────────────────────────────
ADZUNA_APP_ID=your_app_id
ADZUNA_API_KEY=your_api_key
ADZUNA_COUNTRY=eg                    # egypt default, supports: gb, us, au

# ── CV Parsing ───────────────────────────────────
AFFINDA_API_KEY=your_affinda_key
AFFINDA_WORKSPACE_ID=your_workspace_id

# ── File Storage (Cloudflare R2 / AWS S3) ────────
S3_BUCKET=smartroadmap-uploads
S3_REGION=auto
AWS_ACCESS_KEY_ID=your_r2_access_key
AWS_SECRET_ACCESS_KEY=your_r2_secret
S3_ENDPOINT=https://accountid.r2.cloudflarestorage.com

# ── Email ────────────────────────────────────────
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@smartroadmap.io
EMAIL_FROM_NAME=SmartRoadmap

# ── Redis ────────────────────────────────────────
REDIS_URL=redis://localhost:6379
# or Upstash: rediss://default:token@host.upstash.io:6379

# ── Misc ─────────────────────────────────────────
BCRYPT_ROUNDS=12
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

---

## 11. Project Structure

```
smartroadmap/
├── apps/
│   ├── web/                        # Next.js 14 frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   └── [locale]/       # next-intl routing
│   │   │   │       ├── (auth)/     # login, register, forgot
│   │   │   │       ├── (learner)/  # dashboard, roadmap, quiz, cv, hiring
│   │   │   │       ├── (company)/  # company portal
│   │   │   │       └── (admin)/    # admin panel
│   │   │   ├── components/         # ui/, forms/, layout/, roadmap/, quiz/, charts/
│   │   │   ├── hooks/              # useRoadmap, useQuiz, useAuth, useCV
│   │   │   ├── lib/                # api client, queryClient, socket
│   │   │   ├── store/              # Zustand slices
│   │   │   ├── types/              # shared TypeScript types
│   │   │   └── i18n/               # en.json, ar.json
│   │   ├── public/
│   │   │   └── lottie/             # .json animation files
│   │   ├── tailwind.config.ts
│   │   └── next.config.ts
│   │
│   └── api/                        # NestJS backend
│       └── src/
│           ├── modules/
│           │   ├── auth/
│           │   ├── users/
│           │   ├── roadmap/
│           │   ├── assessment/
│           │   ├── resources/
│           │   ├── hiring/
│           │   ├── cv/
│           │   ├── ai/
│           │   ├── notifications/
│           │   ├── files/
│           │   ├── email/
│           │   ├── queue/
│           │   └── admin/
│           ├── common/
│           │   ├── guards/         # JwtAuthGuard, RolesGuard
│           │   ├── decorators/     # @Roles(), @CurrentUser()
│           │   ├── filters/        # GlobalExceptionFilter
│           │   ├── interceptors/   # TransformInterceptor, LoggingInterceptor
│           │   └── pipes/          # ZodValidationPipe
│           ├── database/
│           │   ├── entities/       # TypeORM entity classes
│           │   └── migrations/
│           └── config/             # configuration modules per service
│
├── packages/
│   └── shared/                     # shared Zod schemas, types, constants
│       ├── schemas/
│       └── types/
│
├── docker-compose.yml              # postgres, redis, qdrant
├── .env.example
└── turbo.json                      # Turborepo build pipeline
```

---

## 12. Development Conventions

### API Response Envelope

```ts
// All endpoints return this shape
type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};
```

### Error Codes

```ts
// Global exception filter maps to these
export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AI_GENERATION_FAILED = "AI_GENERATION_FAILED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
}
```

### Branch Naming

```
feat/roadmap-generation
fix/quiz-timer-sync
chore/update-qdrant-client
```

### Commit Convention (Conventional Commits)

```
feat(roadmap): add module prerequisite validation
fix(quiz): resolve timer desync on tab switch
chore(deps): bump openai sdk to 4.28
docs(api): add swagger annotations to hiring module
```

### DaisyUI Rules (enforced in code review)

- ❌ Never: `className="bg-[#6366f1]"` or `style={{ color: '#6366f1' }}`
- ✅ Always: `className="bg-primary"` or `className="text-base-content"`
- ❌ Never: hardcode dark/light variants manually
- ✅ Always: use `data-theme` attribute on root, let DaisyUI handle theming

### TypeScript Strictness

```json
// tsconfig.json (both apps)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### TanStack Query Patterns

```ts
// Always define query/mutation in /hooks — never inline in components
export function useRoadmap(userId: string) {
  return useQuery({
    queryKey: keys.roadmap(userId),
    queryFn: () => api.get(`/roadmap?userId=${userId}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGenerateRoadmap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: GenerateRoadmapDto) => api.post("/roadmap/generate", dto),
    onSuccess: (data) => {
      qc.setQueryData(keys.roadmap(data.userId), data);
    },
  });
}
```

### Bilingual (RTL/LTR) Rules

- All user-facing strings go in `/i18n/en.json` and `/i18n/ar.json` — no hardcoded strings in components
- Directional spacing: use `ms-` (margin-start) and `me-` (margin-end) instead of `ml-` / `mr-`
- Icon flip: icons that indicate direction (arrows, chevrons) must use `rtl:rotate-180` where applicable
- Text alignment: use `text-start` not `text-left` unless intentionally directional-agnostic

---

_SmartRoadmap · Developia · June 2026 · Supervised by Noha Salah_
