# SmartRoadmap 🚀

> **AI-Powered Personalized Learning Path & Talent Matchmaking System**

SmartRoadmap is a state-of-the-art career preparation and recruitment platform. It leverages Large Language Models (LLMs) and Vector Databases to diagnose skill levels, generate dynamic adaptive syllabus roadmaps, suggest learning resources via Retrieval-Augmented Generation (RAG), and semantically match candidates directly to open jobs based on verified test results.

---

## 🏗 System Architecture & Data Flows

### 1. Dynamic Roadmap Generation
```
  User Diagnostic Form
           │
           ▼
┌──────────────────────┐
│ NestJS (/roadmap)    │
└──────────┬───────────┘
           │
           ▼ (LangChain Chain + GPT-4o)
┌──────────────────────┐
│ Create Syllabus JSON │
└──────────┬───────────┘
           ├──────────────────────────┐
           ▼ (Persist metadata)       ▼ (Embed descriptions)
┌──────────────────────┐   ┌──────────────────────┐
│ MongoDB (Syllabus)   │   │ Qdrant Vector DB     │
└──────────────────────┘   └──────────────────────┘
           │
           ▼ (Render dependency tree)
┌──────────────────────┐
│ React Flow Frontend  │
└──────────────────────┘
```

### 2. RAG-Based Resource Retrieval
```
  User opens Module Node
           │
           ▼
┌──────────────────────┐
│ NestJS (/resources)  │
└──────────┬───────────┘
           │ (text-embedding-3-small)
           ▼
┌──────────────────────┐
│ Query Qdrant         │
└──────────┬───────────┘
           │ (Top 5 similar resources)
           ▼
┌──────────────────────┐
│ Ranked Study Guides  │
└──────────────────────┘
```

### 3. Job Match Engine
```
┌──────────────────────┐
│ Daily Scraper Agent  │ (Scrapes jobs via Adzuna API)
└──────────┬───────────┘
           │
           ▼ (Embeds job descriptions)
┌──────────────────────┐
│ Qdrant (Jobs Coll)   │
└──────────────────────┘
           ▲
           │ (Vector search candidate profile score)
┌──────────────────────┐
│ User Score Card      │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│ Ranked Upwork Feed   │ (Split layout matching mockup)
└──────────────────────┘
```

---

## 📁 Repository Directory Layout

The project is structured as a **Turborepo** monorepo using npm workspaces:

```
SmartRoadmap/
├── apps/
│   ├── api/                   # NestJS Backend Application
│   │   ├── src/
│   │   │   ├── ai/            # LLM & Embedding services (OpenAI + LangChain)
│   │   │   ├── modules/       # Feature modules (Auth, Hiring, Roadmap, CV)
│   │   │   └── schemas/       # Mongoose Database Models
│   │   └── .env               # Backend environment variables
│   │
│   └── web/                   # Next.js Frontend Web Application (App Router)
│       ├── src/
│       │   ├── app/           # View routes (Home, Onboarding, Dashboard, CV, Hiring)
│       │   └── components/    # Reusable UI widgets (Navbar, Footer, AppContext)
│       └── tailwind.config.ts # Responsive light/dark color tokens (DaisyUI)
│
├── packages/
│   └── shared/                # Core Types & Schemas shared across apps
│
├── package.json               # Root monorepo configuration
├── turbo.json                 # Monorepo build and development cache tasks
└── README.md                  # This file
```

---

## 🛠 Technology Stack & Libraries

### Frontend (`apps/web`)
- **Core Framework**: Next.js 14 (App Router) & React 18
- **Styling**: Tailwind CSS & DaisyUI
- **Theme & State Management**: Custom Context-based provider (`AppContext.tsx`) with persistence in `localStorage` supporting `smartlight` (cream-backdropped sand theme) and `smartdark` (emerald forest theme).
- **Localization**: Full English (LTR) and Arabic (RTL) localization support with logical margins (`ms-*`, `pe-*`) and direction toggling.

### Backend (`apps/api`)
- **Core Framework**: NestJS 11
- **Database (NoSQL)**: MongoDB with Mongoose
- **Vector DB / RAG**: Qdrant Vector Database
- **Task Queues**: Redis & BullMQ (for daily job scraping cron schedules)
- **AI Chain Integration**: LangChain & OpenAI API (`gpt-4o` / `text-embedding-3-small`)

---

## ⚙️ Environment Configuration

Create a `.env` file at the root or inside `apps/api` with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://[username]:[password]@[host]:27017/smartroadmap?ssl=true&replicaSet=[rs]&authSource=admin

# Vector DB
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_key

# OpenAI (AI / Embeddings)
OPENAI_API_KEY=your_openai_api_key

# Auth
JWT_SECRET=your_jwt_signature_secret_key
JWT_EXPIRY=15m
```

---

## 🚀 Getting Started

### 1. Installation
Install all workspaces dependencies from the root directory:
```bash
npm install
```

### 2. Run Development Servers
Start both the backend application and Next.js frontend concurrently using Turborepo:
```bash
npm run dev
```
- **Backend API**: Running on [http://localhost:3000](http://localhost:3000)
- **Frontend App**: Running on [http://localhost:3001](http://localhost:3001)

### 3. Production Compilation Build
Verify all typescript definitions and bundles compile successfully:
```bash
npm run build
```
