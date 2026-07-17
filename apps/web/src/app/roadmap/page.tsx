"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import { apiFetch, getCachedUser, hasSession, API_BASE } from "@/lib/api";
import VoiceTutorModal from "@/components/VoiceTutorModal";
import {
  Sparkles,
  Compass,
  Shield,
  Award,
  ArrowRight,
  Clock,
  X,
  CheckCircle2,
  HelpCircle,
  Play,
  Pause,
  BookOpen,
  Volume2,
  GitBranch,
  Grid3X3,
  Globe,
  Smartphone,
  Bot,
  Server,
  Cloud,
  Database,
  Mic,
  RotateCw,
  Zap,
  Music,
} from "lucide-react";

// ─── Module and Roadmap Interfaces ───────────────────────────────────────────

type Module = {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  topics: string[];
  prerequisites: string[];
  status: "locked" | "in_progress" | "completed" | "failed";
};

type Roadmap = {
  _id: string;
  title: string;
  targetRole: string;
  totalEstimatedHours: number;
  modules: Module[];
};

// ─── Six Rich Static / Offline Fallback Tracks ───────────────────────────────

const MOCK_WEB_MODULES: Module[] = [
  { id: 'web-1', title: 'TypeScript Strict Mode', estimatedHours: 10, difficulty: 'beginner', status: 'completed', description: 'Write highly maintainable client-side logic using strict type declarations.', topics: ['Types', 'Interfaces', 'Generics', 'Strict Compiler'], prerequisites: [] },
  { id: 'web-2', title: 'Semantic HTML5 & CSS Grid', estimatedHours: 12, difficulty: 'beginner', status: 'completed', description: 'Build accessible structures (WCAG) and layouts with CSS Grid/Flexbox.', topics: ['Semantic HTML', 'Grid Layouts', 'Flex wrap', 'Accessibility'], prerequisites: [] },
  { id: 'web-3', title: 'Next.js App Router Layouts', estimatedHours: 15, difficulty: 'beginner', status: 'in_progress', description: 'Structure applications with nested pages, dynamic layouts, and loading states.', topics: ['RSC', 'Suspense', 'Layout files', 'Server Actions'], prerequisites: [] },
  { id: 'web-4', title: 'REST API Design & Guards', estimatedHours: 18, difficulty: 'intermediate', status: 'locked', description: 'Design endpoints with request validations, error payloads, and route guards.', topics: ['Controllers', 'DTOs', 'Guards', 'ValidationPipe'], prerequisites: [] },
  { id: 'web-5', title: 'Prisma ORM & PostgreSQL', estimatedHours: 20, difficulty: 'intermediate', status: 'locked', description: 'Model database systems and deploy relational schemas with PostgreSQL.', topics: ['Migrations', 'Relations', 'Querying', 'Prisma Schema'], prerequisites: [] },
  { id: 'web-6', title: 'JWT Access/Refresh Tokens', estimatedHours: 14, difficulty: 'intermediate', status: 'locked', description: 'Implement stateless security via access and refresh token rotations.', topics: ['JWT sign', 'Refresh strategy', 'Cookies', 'Auth guards'], prerequisites: [] },
  { id: 'web-7', title: 'Service Worker & Offline Cache', estimatedHours: 22, difficulty: 'advanced', status: 'locked', description: 'Configure client-side service workers to enable full offline workspace operations.', topics: ['Workbox', 'CacheStorage', 'Offline fallback', 'PWA manifest'], prerequisites: [] },
  { id: 'web-8', title: 'Edge Runtime & Server Actions', estimatedHours: 25, difficulty: 'advanced', status: 'locked', description: 'Optimize performance using lightweight Edge compute routes.', topics: ['Vercel Edge', 'Middleware', 'Optimistic updates', 'Form Actions'], prerequisites: [] },
  { id: 'web-9', title: 'GraphQL & Apollo Federation', estimatedHours: 30, difficulty: 'advanced', status: 'locked', description: 'Aggregate multi-service backend schemas into a single gateway.', topics: ['Subgraphs', 'Supergraph', 'Resolvers', 'Queries & Mutations'], prerequisites: [] }
];

const MOCK_MOBILE_MODULES: Module[] = [
  { id: 'mob-1', title: 'React Native & Expo', estimatedHours: 12, difficulty: 'beginner', status: 'completed', description: 'Build cross-platform apps using React Native and the Expo framework.', topics: ['Expo Go', 'StyleSheet', 'Components', 'Platform API'], prerequisites: [] },
  { id: 'mob-2', title: 'Flutter & Dart', estimatedHours: 15, difficulty: 'beginner', status: 'completed', description: 'Utilize Dart and Flutter engine for high fidelity widgets.', topics: ['Dart OOP', 'Widgets', 'Stateful/Stateless', 'Flutter Build'], prerequisites: [] },
  { id: 'mob-3', title: 'SwiftUI & Compose', estimatedHours: 18, difficulty: 'beginner', status: 'in_progress', description: 'Native UI layouts using SwiftUI for iOS and Jetpack Compose for Android.', topics: ['Swift syntax', 'Kotlin syntax', 'Modifiers', 'Previews'], prerequisites: [] },
  { id: 'mob-4', title: 'REST & WebSockets Sync', estimatedHours: 20, difficulty: 'intermediate', status: 'locked', description: 'Synchronize frontends with REST endpoints and live WebSocket events.', topics: ['Axios', 'Socket.io', 'Reconnection', 'Event handlers'], prerequisites: [] },
  { id: 'mob-5', title: 'Zustand State Engine', estimatedHours: 10, difficulty: 'intermediate', status: 'locked', description: 'Optimize client states using Zustand lightweight store.', topics: ['Lightweight store', 'Actions', 'Middlewares', 'Devtools'], prerequisites: [] },
  { id: 'mob-6', title: 'Firebase & Supabase Auth', estimatedHours: 14, difficulty: 'intermediate', status: 'locked', description: 'Integrate cloud authentication and social logins securely.', topics: ['OAuth', 'Auth state change', 'Rules', 'Supabase Client'], prerequisites: [] },
  { id: 'mob-7', title: 'SQLite & Keychain Storage', estimatedHours: 22, difficulty: 'advanced', status: 'locked', description: 'Persist offline data using SQLite and secure iOS/Android Keychains.', topics: ['Encrypted DB', 'Keychain wrappers', 'Secure Store', 'Migrations'], prerequisites: [] },
  { id: 'mob-8', title: 'App Store Submissions', estimatedHours: 15, difficulty: 'advanced', status: 'locked', description: 'Release products to Apple App Store and Google Play Store.', topics: ['App Store Connect', 'Play Console', 'Certificates', 'Metadata'], prerequisites: [] },
  { id: 'mob-9', title: 'CI/CD Pipelines (Fastlane)', estimatedHours: 25, difficulty: 'advanced', status: 'locked', description: 'Build automated compilation and testing triggers using Fastlane pipelines.', topics: ['Fastfile', 'Appfile', 'Match', 'GitHub Actions'], prerequisites: [] }
];

const MOCK_AI_MODULES: Module[] = [
  { id: 'ai-1', title: 'Python & NumPy Core', estimatedHours: 10, difficulty: 'beginner', status: 'completed', description: 'Basic programming logic in Python and NumPy array structures.', topics: ['Slicing', 'Vectorization', 'Broadcasting', 'Syntax'], prerequisites: [] },
  { id: 'ai-2', title: 'Linear Algebra & Calculus', estimatedHours: 20, difficulty: 'beginner', status: 'completed', description: 'Mathematical concepts including matrix transforms and derivatives.', topics: ['Eigenvalues', 'Gradients', 'Matrix multiplication', 'Calculus rules'], prerequisites: [] },
  { id: 'ai-3', title: 'Pandas & Visualization', estimatedHours: 12, difficulty: 'beginner', status: 'in_progress', description: 'Dataframe wrangling and plotting diagrams using Seaborn.', topics: ['DataFrames', 'Groupby', 'Matplotlib', 'Seaborn styles'], prerequisites: [] },
  { id: 'ai-4', title: 'Scikit-Learn Workflows', estimatedHours: 18, difficulty: 'intermediate', status: 'locked', description: 'Fit supervised and unsupervised ML models using Scikit-Learn.', topics: ['Regression', 'Random Forests', 'Pipelines', 'GridSearchCV'], prerequisites: [] },
  { id: 'ai-5', title: 'Vector DBs (Pinecone)', estimatedHours: 15, difficulty: 'intermediate', status: 'locked', description: 'Index embeddings in vector spaces using Pinecone or Milvus.', topics: ['Embeddings', 'Cosine similarity', 'Upsert', 'Metadata filtering'], prerequisites: [] },
  { id: 'ai-6', title: 'BigQuery Pipelines (ETL)', estimatedHours: 22, difficulty: 'intermediate', status: 'locked', description: 'Write pipelines to clean big data in Google BigQuery.', topics: ['SQL dialects', 'Dataflow', 'Streaming inputs', 'Query optimization'], prerequisites: [] },
  { id: 'ai-7', title: 'TensorFlow & PyTorch Core', estimatedHours: 30, difficulty: 'advanced', status: 'locked', description: 'Construct neural layer stacks and backpropagation triggers.', topics: ['Tensors', 'Autograd', 'Loss functions', 'Optimizers'], prerequisites: [] },
  { id: 'ai-8', title: 'Transformer Networks', estimatedHours: 25, difficulty: 'advanced', status: 'locked', description: 'Understand attention mechanisms and build sequence-to-sequence models.', topics: ['Self-attention', 'Multi-head', 'BERT', 'GPT pretraining'], prerequisites: [] },
  { id: 'ai-9', title: 'Finetuning LLMs (HuggingFace)', estimatedHours: 35, difficulty: 'advanced', status: 'locked', description: 'Finetune open source LLMs on domain specific datasets.', topics: ['LoRA/PEFT', 'Quantization', 'Trainer API', 'Dataset tokens'], prerequisites: [] }
];

const MOCK_BACKEND_MODULES: Module[] = [
  { id: 'backend-1', title: 'Node.js & NestJS Architecture', estimatedHours: 14, difficulty: 'beginner', status: 'completed', description: 'Master NestJS dependency injection, modules, providers, and controllers.', topics: ['Dependency Injection', 'Providers', 'Controllers', 'Custom decorators'], prerequisites: [] },
  { id: 'backend-2', title: 'System Design Primitives', estimatedHours: 16, difficulty: 'beginner', status: 'completed', description: 'Design solid architectural layouts with horizontal scaling and state caching.', topics: ['Horizontal scaling', 'Stateless app', 'Load balancers', 'Caching strategies'], prerequisites: [] },
  { id: 'backend-3', title: 'Microservices & gRPC', estimatedHours: 20, difficulty: 'beginner', status: 'in_progress', description: 'Implement inter-service remote procedure communication using gRPC protobufs.', topics: ['gRPC client', 'Protobuf definitions', 'TCP transports', 'NestJS microservices'], prerequisites: [] },
  { id: 'backend-4', title: 'Message Queues (RabbitMQ)', estimatedHours: 22, difficulty: 'intermediate', status: 'locked', description: 'Configure event-driven workflows with queues, exchanges, and topic binds.', topics: ['Exchanges', 'Routing keys', 'Dead letter exchange', 'Ack/Nack patterns'], prerequisites: [] },
  { id: 'backend-5', title: 'Redis Cache & Pub/Sub', estimatedHours: 15, difficulty: 'intermediate', status: 'locked', description: 'Optimise read throughput using Redis server caching and message patterns.', topics: ['Redis cluster', 'Key eviction', 'Pub/Sub channels', 'Sorted sets'], prerequisites: [] },
  { id: 'backend-6', title: 'SQL & NoSQL Partitioning', estimatedHours: 24, difficulty: 'intermediate', status: 'locked', description: 'Design high-volume partition architectures and shards in PostgreSQL and MongoDB.', topics: ['Sharding', 'Horizontal partition', 'Replication lag', 'Indexes'], prerequisites: [] },
  { id: 'backend-7', title: 'OAuth2 & OpenID Connect', estimatedHours: 25, difficulty: 'advanced', status: 'locked', description: 'Secure enterprise applications with OAuth2 scopes, consent, and userinfo flow.', topics: ['Authorization code', 'PKCE', 'ID token verification', 'Scopes'], prerequisites: [] },
  { id: 'backend-8', title: 'Distributed Transactions', estimatedHours: 32, difficulty: 'advanced', status: 'locked', description: 'Solve eventual consistency issues using Saga orchestrators and 2-Phase commits.', topics: ['Saga pattern', 'Compensating actions', '2PC protocol', 'Outbox pattern'], prerequisites: [] },
  { id: 'backend-9', title: 'Performance Profiling & APM', estimatedHours: 28, difficulty: 'advanced', status: 'locked', description: 'Profile memory leaks, event loops, and trace requests with OpenTelemetry.', topics: ['Flamegraphs', 'Memory heapdump', 'Tracer provider', 'Span attributes'], prerequisites: [] }
];

const MOCK_DEVOPS_MODULES: Module[] = [
  { id: 'devops-1', title: 'Docker Containers', estimatedHours: 10, difficulty: 'beginner', status: 'completed', description: 'Learn to build efficient, multi-stage Dockerfiles and compose networks.', topics: ['Multi-stage build', 'Docker Compose', 'Volumes', 'Port mapping'], prerequisites: [] },
  { id: 'devops-2', title: 'Linux System Admin', estimatedHours: 15, difficulty: 'beginner', status: 'completed', description: 'Configure package management, services, logs, and processes.', topics: ['systemd', 'journalctl', 'Cron jobs', 'Permissions'], prerequisites: [] },
  { id: 'devops-3', title: 'CI/CD with GitHub Actions', estimatedHours: 18, difficulty: 'beginner', status: 'in_progress', description: 'Automate linting, testing, compilation, and registry pushes.', topics: ['Workflows', 'Secrets', 'Cache action', 'Self-hosted runners'], prerequisites: [] },
  { id: 'devops-4', title: 'Terraform IaC (AWS/GCP)', estimatedHours: 22, difficulty: 'intermediate', status: 'locked', description: 'Provision reproducible cloud infrastructure via Terraform declarations.', topics: ['State locking', 'Modules', 'Variables & Outputs', 'Providers'], prerequisites: [] },
  { id: 'devops-5', title: 'Kubernetes Orchestration', estimatedHours: 30, difficulty: 'intermediate', status: 'locked', description: 'Deploy pods, services, ingress, and configmaps in clusters.', topics: ['ReplicaSet', 'Ingress Controller', 'Volume mounts', 'Deployments'], prerequisites: [] },
  { id: 'devops-6', title: 'Prometheus & Grafana APM', estimatedHours: 16, difficulty: 'intermediate', status: 'locked', description: 'Scrape targets, design custom dashboards, and write PromQL alerts.', topics: ['PromQL', 'Scrape config', 'Alertmanager', 'Graph panels'], prerequisites: [] },
  { id: 'devops-7', title: 'Helm Charts Packaging', estimatedHours: 20, difficulty: 'advanced', status: 'locked', description: 'Parameterise and distribute complex Kubernetes configurations.', topics: ['Value overrides', 'Templates', 'Dependency charts', 'Releases'], prerequisites: [] },
  { id: 'devops-8', title: 'Service Mesh (Istio)', estimatedHours: 25, difficulty: 'advanced', status: 'locked', description: 'Implement sidecar injection, traffic splits, and mTLS security.', topics: ['VirtualService', 'Gateway resource', 'Mutual TLS', 'Telemetry'], prerequisites: [] },
  { id: 'devops-9', title: 'GitOps with ArgoCD', estimatedHours: 28, difficulty: 'advanced', status: 'locked', description: 'Synchronize cluster state with declarative Git source of truth.', topics: ['Application controller', 'Sync policies', 'Pruning', 'Self-healing'], prerequisites: [] }
];

const MOCK_DATABASE_MODULES: Module[] = [
  { id: 'db-1', title: 'SQL Essentials', estimatedHours: 12, difficulty: 'beginner', status: 'completed', description: 'Write optimized joins, subqueries, and manage schemas.', topics: ['Joins', 'Indexes', 'Subqueries', 'Constraints'], prerequisites: [] },
  { id: 'db-2', title: 'NoSQL Data Modeling', estimatedHours: 14, difficulty: 'beginner', status: 'completed', description: 'Learn document model design and denormalization in MongoDB.', topics: ['Embedding vs Referencing', 'Aggregation framework', 'Indexes', 'BSON'], prerequisites: [] },
  { id: 'db-3', title: 'Database Migrations', estimatedHours: 15, difficulty: 'beginner', status: 'in_progress', description: 'Manage database schema evolutions safely in production.', topics: ['Backward compatibility', 'Rollbacks', 'Blue-Green migrations', 'Seed data'], prerequisites: [] },
  { id: 'db-4', title: 'Replication & Failover', estimatedHours: 20, difficulty: 'intermediate', status: 'locked', description: 'Configure active-passive clusters, replication streams, and auto failover.', topics: ['Write-Ahead Log', 'Logical replication', 'Read replicas', 'Quorum'], prerequisites: [] },
  { id: 'db-5', title: 'Qdrant & Vector Search', estimatedHours: 18, difficulty: 'intermediate', status: 'locked', description: 'Store and perform semantic search on high-dimensional vectors.', topics: ['Cosine distance', 'Payload filtering', 'HNSW index', 'Collections'], prerequisites: [] },
  { id: 'db-6', title: 'Query Performance Tuning', estimatedHours: 24, difficulty: 'intermediate', status: 'locked', description: 'Profile queries, analyze explain plans, and optimize locks.', topics: ['Explain analyze', 'Index scan vs Seq scan', 'Deadlocks', 'Connection pools'], prerequisites: [] },
  { id: 'db-7', title: 'Distributed SQL (CockroachDB)', estimatedHours: 26, difficulty: 'advanced', status: 'locked', description: 'Scale SQL databases globally with serializable ACID transactions.', topics: ['Raft consensus', 'Range splits', 'Global transactions', 'Locality configuration'], prerequisites: [] },
  { id: 'db-8', title: 'Graph Databases (Neo4j)', estimatedHours: 22, difficulty: 'advanced', status: 'locked', description: 'Query highly interconnected network relationships via Cypher.', topics: ['Cypher syntax', 'Nodes & Relationships', 'Shortest path', 'Indexes'], prerequisites: [] },
  { id: 'db-9', title: 'Data Lakehouses (Delta Lake)', estimatedHours: 30, difficulty: 'advanced', status: 'locked', description: 'Implement ACID transactions and time travel on object storage.', topics: ['Parquet files', 'Schema enforcement', 'Time travel queries', 'Z-Ordering'], prerequisites: [] }
];

// ─── Local Translations ──────────────────────────────────────────────────────

const dict = {
  interactiveMindmap: { en: "Interactive Learning Mindmap", ar: "خريطة التعلم التفاعلية" },
  subtitle: { 
    en: "Select a track and toggle views to explore your custom learning modules, AI speech notes, assessments, and voice-narrated audio summaries.", 
    ar: "اختر مساراً وبدل طرق العرض لاستكشاف وحدات التعلم المخصصة وملاحظات الكلام والتقييمات والملخصات الصوتية بصوت المعلم." 
  },
  trackWeb: { en: "Web Development", ar: "تطوير الويب" },
  trackMobile: { en: "Mobile App Development", ar: "تطوير تطبيقات الهواتف" },
  trackAI: { en: "AI & Data Science", ar: "الذكاء الاصطناعي وعلوم البيانات" },
  trackBackend: { en: "Backend & Systems", ar: "هندسة الأنظمة والواجهات الخلفية" },
  trackDevOps: { en: "DevOps & Cloud", ar: "الحوسبة السحابية والعمليات (DevOps)" },
  trackDatabase: { en: "Database & RAG Systems", ar: "قواعد البيانات ونظم الـ RAG" },
  startChallenge: { en: "Start Assessment", ar: "ابدأ التقييم" },
  treeView: { en: "Tree View", ar: "عرض الشجرة" },
  timelineView: { en: "Timeline View", ar: "عرض الجدول الزمني" },
  beginnerLbl: { en: "Beginner", ar: "مبتدئ" },
  intermediateLbl: { en: "Intermediate", ar: "متوسط" },
  advancedLbl: { en: "Advanced", ar: "متقدّم" },
  done: { en: "done", ar: "مكتمل" },
  loadingRoadmap: { en: "Loading your roadmap…", ar: "جاري تحميل خارطة طريقك…" },
  keyTopics: { en: "Key Topics", ar: "المواضيع الرئيسية" },
  audioNarration: { en: "Audio Narration", ar: "السرد الصوتي" },
  synthesising: { en: "Synthesising audio…", ar: "جاري توليد الصوت…" },
  audioFailed: { en: "Audio synthesis failed — API key required.", ar: "فشل توليد الصوت — مطلوب مفتاح API." },
  generateAudio: { en: "Generate Audio Summary", ar: "توليد ملخص صوتي" },
  generating: { en: "Generating…", ar: "جاري التوليد…" },
  referenceCheatsheet: { en: "AI Speech Notes", ar: "ملاحظات الكلام" },
  generateGuide: { en: "Generate Speech Notes", ar: "توليد ملاحظات الكلام" },
  estimatedDuration: { en: "Estimated Duration:", ar: "الوقت المقدر:" },
  difficultyLevel: { en: "Difficulty Level:", ar: "مستوى الصعوبة:" },
  track: { en: "Track:", ar: "المسار:" },
  tapAnyNode: { en: "Tap any node or timeline bar to view details and start learning.", ar: "اضغط على أي عقدة أو شريط مخطط زمني لعرض التفاصيل وبدء التعلم." }
};

type DictKey = keyof typeof dict;

// ─── Folder Illustration Component ──────────────────────────────────────────

const FolderSearchIllustration = ({ title }: { title: string }) => (
  <div className="relative w-48 h-32 mx-auto flex items-center justify-center mb-4 select-none">
    {/* Blue folder background */}
    <div className="absolute w-40 h-26 bg-indigo-100 rounded-[2rem] shadow-md border border-indigo-200">
      {/* Folder tab */}
      <div className="absolute -top-3 left-6 w-14 h-6 bg-indigo-100 rounded-t-xl" />
      {/* Folder front tab white insert */}
      <div className="absolute inset-2 bg-white/70 rounded-[1.5rem] flex flex-col justify-center px-4 space-y-1">
        {/* Mock browser address line */}
        <div className="h-5 bg-slate-50 rounded-lg flex items-center px-1.5 gap-1 border border-slate-200">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <div className="h-1 bg-slate-200 rounded-full flex-grow" />
        </div>
      </div>
    </div>
    {/* Magnifying Glass floating in front */}
    <div className="absolute -top-2 z-10 w-16 h-16 text-indigo-600 flex items-center justify-center animate-bounce">
      <svg className="w-12 h-12 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  </div>
);

// ─── MAIN ROADMAP PAGE COMPONENT ────────────────────────────────────────────

export default function RoadmapPage() {
  const router = useRouter();
  const { locale } = useApp();
  const isAr = locale === "ar";
  const tr = (key: DictKey) => dict[key][isAr ? "ar" : "en"];

  const [user, setUser] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTrack, setActiveTrack] = useState<'web' | 'mobile' | 'ai' | 'backend' | 'devops' | 'database'>('web');
  const [activeCategory, setActiveCategory] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [viewMode, setViewMode] = useState<'tree' | 'timeline'>('tree');

  // Slide-over Details states
  const [cheatSheet, setCheatSheet] = useState<any>(null);
  const [generatingSheet, setGeneratingSheet] = useState(false);
  const [cheatSheetHistory, setCheatSheetHistory] = useState<any[]>([]);
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState<any | null>(null);
  const [showVoiceTutor, setShowVoiceTutor] = useState(false);
  const [audioSummary, setAudioSummary] = useState<any>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioRate, setAudioRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Tracks the in-flight play() promise so we can safely pause after it resolves
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Initialize and load active database roadmap
  useEffect(() => {
    const storedUser = getCachedUser();
    const token = hasSession();

    if (!storedUser || !token) {
      // Offline / Guest fallback
      setUser(null);
      setRoadmap({
        _id: "mock-web-id",
        title: tr("trackWeb"),
        targetRole: "Fullstack Web Developer",
        totalEstimatedHours: 175,
        modules: MOCK_WEB_MODULES
      });
      setLoading(false);
      return;
    }

    setUser(storedUser);
    loadActiveRoadmap();
  }, []);

  const loadActiveRoadmap = async () => {
    try {
      const res = await apiFetch("/roadmap/me");
      if (res.ok) {
        const data: Roadmap = await res.json();
        setRoadmap(data);
        
        // Auto-detect track from targetRole description
        const role = data.targetRole.toLowerCase();
        if (role.includes("mobile") || role.includes("ios") || role.includes("flutter") || role.includes("android")) {
          setActiveTrack("mobile");
        } else if (role.includes("ai") || role.includes("data") || role.includes("intelligence") || role.includes("science")) {
          setActiveTrack("ai");
        } else if (role.includes("devops") || role.includes("cloud") || role.includes("infrastructure")) {
          setActiveTrack("devops");
        } else if (role.includes("database") || role.includes("rag") || role.includes("query")) {
          setActiveTrack("database");
        } else if (role.includes("backend") || role.includes("system") || role.includes("nest")) {
          setActiveTrack("backend");
        } else {
          setActiveTrack("web");
        }
      } else {
        // Fallback to mock web if no active roadmap exists in database
        setRoadmap({
          _id: "mock-web-id",
          title: tr("trackWeb"),
          targetRole: "Fullstack Web Developer",
          totalEstimatedHours: 175,
          modules: MOCK_WEB_MODULES
        });
      }
    } catch {
      // Fallback on failure
      setRoadmap({
        _id: "mock-web-id",
        title: tr("trackWeb"),
        targetRole: "Fullstack Web Developer",
        totalEstimatedHours: 175,
        modules: MOCK_WEB_MODULES
      });
    } finally {
      setLoading(false);
    }
  };

  // Triggers backend AI roadmap generation on track tab switch (if logged in)
  const handleTrackChange = async (track: 'web' | 'mobile' | 'ai' | 'backend' | 'devops' | 'database') => {
    setActiveTrack(track);
    setSelectedModule(null);
    setIsPlaying(false);
    
    // Map track keys to backend generator role requests
    const roleMap = {
      web: "Fullstack Web Developer",
      mobile: "Mobile Application Developer",
      ai: "AI & Data Science Engineer",
      backend: "Backend & Systems Engineer",
      devops: "DevOps & Cloud Engineer",
      database: "Database & RAG Architect"
    };
    const targetRole = roleMap[track];

    const getMockModules = (t: string) => {
      switch (t) {
        case 'mobile': return MOCK_MOBILE_MODULES;
        case 'ai': return MOCK_AI_MODULES;
        case 'backend': return MOCK_BACKEND_MODULES;
        case 'devops': return MOCK_DEVOPS_MODULES;
        case 'database': return MOCK_DATABASE_MODULES;
        case 'web':
        default:
          return MOCK_WEB_MODULES;
      }
    };

    if (!user) {
      // Guest Track Switch - load static mock packages
      setRoadmap({
        _id: `mock-${track}-id`,
        title: roleMap[track],
        targetRole: targetRole,
        totalEstimatedHours: track === 'web' ? 175 : 180,
        modules: getMockModules(track)
      });
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole, skills: [] }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data);
        toast.success(`Generated dynamic AI learning path for: ${targetRole}`);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to generate dynamic path. Falling back to preview.");
      setRoadmap({
        _id: `mock-${track}-id`,
        title: roleMap[track],
        targetRole: targetRole,
        totalEstimatedHours: 180,
        modules: getMockModules(track)
      });
    } finally {
      setLoading(false);
    }
  };

  // Stop audio cleanly whenever the selected module changes
  const stopAudio = () => {
    if (!audioRef.current) return;
    const el = audioRef.current;
    if (playPromiseRef.current) {
      // Wait for in-flight play() to settle before pausing — avoids AbortError
      playPromiseRef.current.then(() => {
        el.pause();
        el.currentTime = 0;
      }).catch(() => {});
      playPromiseRef.current = null;
    } else {
      el.pause();
      el.currentTime = 0;
    }
    setIsPlaying(false);
  };

  // Sync audio element src whenever audioSummary changes
  useEffect(() => {
    if (!audioRef.current) return;
    if (audioSummary?.audioUrl) {
      audioRef.current.src = `${API_BASE}${audioSummary.audioUrl}`;
      audioRef.current.load();
    } else {
      audioRef.current.src = '';
    }
  }, [audioSummary]);

  // Fetch cheat sheet and audio summaries when selected module changes
  useEffect(() => {
    if (!selectedModule) return;
    stopAudio();
    setCheatSheet(null);
    setCheatSheetHistory([]);
    setSelectedHistoryVersion(null);
    setAudioSummary(null);
    
    // Skip db queries if we are playing mock items
    if (!user || selectedModule.id.startsWith("web-") || selectedModule.id.startsWith("mob-") || selectedModule.id.startsWith("ai-") || selectedModule.id.startsWith("backend-") || selectedModule.id.startsWith("devops-") || selectedModule.id.startsWith("db-")) {
      return;
    }

    (async () => {
      try {
        const [sr, hr, ar] = await Promise.all([
          apiFetch(`/cheat-sheets/${selectedModule.id}`),
          apiFetch(`/cheat-sheets/${selectedModule.id}/history`),
          apiFetch(`/audio-summaries/${selectedModule.id}`),
        ]);
        if (sr.ok) { const d = await sr.json(); setCheatSheet(d.data); }
        if (hr.ok) { const d = await hr.json(); setCheatSheetHistory(d.data || []); }
        if (ar.ok) { const d = await ar.json(); setAudioSummary(d.data); }
      } catch {}
    })();
  }, [selectedModule]);

  // Audio summary synthesis trigger
  const generateAudioSummary = async () => {
    if (!selectedModule) return;
    if (!user) {
      toast.warn("Please log in to generate dynamic AI audio narrations.");
      return;
    }
    setGeneratingAudio(true);
    try {
      const res = await apiFetch(`/audio-summaries/${selectedModule.id}/generate`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setAudioSummary(d.data);
        toast.info("Synthesising audio summary...");
        pollAudio(selectedModule.id);
      }
    } catch {
      toast.error("Audio synthesis generation failed.");
      setGeneratingAudio(false);
    }
  };

  const pollAudio = (mid: string) => {
    const timer = setInterval(async () => {
      try {
        const res = await apiFetch(`/audio-summaries/${mid}`);
        if (res.ok) {
          const d = await res.json();
          if (d.data?.status === "ready") {
            setAudioSummary(d.data);
            setGeneratingAudio(false);
            clearInterval(timer);
            toast.success("AI voice summary ready!");
          }
          if (d.data?.status === "failed") {
            setGeneratingAudio(false);
            clearInterval(timer);
            toast.error("AI audio generation failed.");
          }
        }
      } catch {
        clearInterval(timer);
        setGeneratingAudio(false);
      }
    }, 2500);
  };

  // Cheat sheet dynamic generation trigger
  const generateReferenceGuide = async () => {
    if (!selectedModule) return;
    if (!user) {
      toast.warn("Please log in to generate AI speech notes.");
      return;
    }
    setGeneratingSheet(true);
    try {
      const res = await apiFetch(`/cheat-sheets/${selectedModule.id}/generate`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setCheatSheet(d.data);
        toast.success("Reference guide completed!");
        // Fetch history immediately
        const hr = await apiFetch(`/cheat-sheets/${selectedModule.id}/history`);
        if (hr.ok) {
          const hd = await hr.json();
          setCheatSheetHistory(hd.data || []);
        }
      }
    } catch {
      toast.error("Failed to generate AI speech notes.");
    } finally {
      setGeneratingSheet(false);
    }
  };

  const regenerateReferenceGuide = async () => {
    if (!selectedModule) return;
    if (!user) {
      toast.warn("Please log in to regenerate AI speech notes.");
      return;
    }
    setGeneratingSheet(true);
    try {
      const res = await apiFetch(`/cheat-sheets/${selectedModule.id}/regenerate`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setCheatSheet(d.data);
        setSelectedHistoryVersion(null);
        toast.success("Speech notes regenerated!");
        // Refresh history
        const hr = await apiFetch(`/cheat-sheets/${selectedModule.id}/history`);
        if (hr.ok) {
          const hd = await hr.json();
          setCheatSheetHistory(hd.data || []);
        }
      }
    } catch {
      toast.error("Failed to regenerate AI speech notes.");
    } finally {
      setGeneratingSheet(false);
    }
  };

  // Handles robust play/pause — uses playPromiseRef to avoid AbortError
  const togglePlayback = () => {
    const el = audioRef.current;
    if (!el) return;
    // Guard: refuse to play if there is no valid source loaded
    if (!el.src || el.src === window.location.href) {
      toast.warn("Audio is still being prepared. Please wait.");
      return;
    }

    if (isPlaying) {
      // If a play() is in-flight, wait for it to settle before pausing
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => {
          if (!isMountedRef.current) return;
          el.pause();
          setIsPlaying(false);
        }).catch(() => {});
        playPromiseRef.current = null;
      } else {
        el.pause();
        setIsPlaying(false);
      }
    } else {
      el.playbackRate = audioRate;
      const p = el.play();
      if (p !== undefined) {
        playPromiseRef.current = p;
        p.then(() => {
          playPromiseRef.current = null;
          if (isMountedRef.current) setIsPlaying(true);
        }).catch((err: Error) => {
          playPromiseRef.current = null;
          // Ignore AbortError — happens when play is cancelled by a legitimate action
          if (err.name !== 'AbortError') {
            toast.error(`Audio error: ${err.message}`);
          }
          if (isMountedRef.current) setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    }
  };

  const handleNodeClick = (node: Module, cat: 'beginner' | 'intermediate' | 'advanced') => {
    setActiveCategory(cat);
    setSelectedModule(node);
  };

  // Divide roadmap modules into Beginner, Intermediate, and Advanced categories
  const partitionModules = (mods: Module[]) => {
    const beginner: Module[] = [];
    const intermediate: Module[] = [];
    const advanced: Module[] = [];

    mods.forEach((m, idx) => {
      const d = m.difficulty?.toLowerCase();
      if (d === 'beginner') {
        beginner.push(m);
      } else if (d === 'intermediate') {
        intermediate.push(m);
      } else if (d === 'advanced') {
        advanced.push(m);
      } else {
        // Fallback: partition evenly based on list order
        if (idx < mods.length / 3) beginner.push(m);
        else if (idx < (2 * mods.length) / 3) intermediate.push(m);
        else advanced.push(m);
      }
    });

    // Make sure we don't end up with completely empty lists in case difficulty isn't mapped
    if (beginner.length === 0 && intermediate.length === 0 && advanced.length === 0) {
      mods.forEach((m, idx) => {
        if (idx < mods.length / 3) beginner.push(m);
        else if (idx < (2 * mods.length) / 3) intermediate.push(m);
        else advanced.push(m);
      });
    }

    return { beginner, intermediate, advanced };
  };

  const partition = partitionModules(roadmap?.modules || []);
  const categories: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];

  const catMeta = {
    beginner: { icon: Compass, color: 'primary', ring: 'ring-primary', dot: 'bg-primary' },
    intermediate: { icon: Shield, color: 'secondary', ring: 'ring-secondary', dot: 'bg-secondary' },
    advanced: { icon: Award, color: 'accent', ring: 'ring-accent', dot: 'bg-accent' },
  };

  const catLabels = {
    beginner: tr("beginnerLbl"),
    intermediate: tr("intermediateLbl"),
    advanced: tr("advancedLbl"),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative">
      {/* Glow ambient background assets */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl -z-10" />

      {/* Page Title Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-3 select-none">
        <div className="badge bg-indigo-600 text-white gap-2 p-3.5 font-bold uppercase tracking-wider text-xs shadow-md border-none select-none">
          <Sparkles className="w-3.5 h-3.5 fill-white text-white" /> {tr("interactiveMindmap")}
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-base-content leading-tight">
          {roadmap?.title || tr("trackWeb")}
        </h1>
        <p className="text-xs md:text-sm text-base-content/60 font-semibold max-w-lg mx-auto leading-relaxed">
          {tr("subtitle")}
        </p>
      </div>

      {/* Action Selectors Row: Tracks + Layout Switcher */}
      <div className="flex flex-col gap-4 items-center justify-center mb-10">

        {/* ── Track Selection Tabs ─────────────────────────────── */}
        {(() => {
          const TRACKS: {
            key: 'web' | 'mobile' | 'ai' | 'backend' | 'devops' | 'database';
            label: string;
            Icon: React.FC<{ className?: string }>;
            gradient: string;
            glow: string;
            hoverBg: string;
          }[] = [
            { key: 'web',      label: tr("trackWeb"),      Icon: Globe,       gradient: 'from-indigo-500 to-violet-500',  glow: '80, 70, 229',   hoverBg: 'hover:bg-indigo-500/10' },
            { key: 'mobile',   label: tr("trackMobile"),   Icon: Smartphone,  gradient: 'from-emerald-500 to-teal-500',   glow: '16, 185, 129',  hoverBg: 'hover:bg-emerald-500/10' },
            { key: 'ai',       label: tr("trackAI"),       Icon: Bot,         gradient: 'from-fuchsia-500 to-pink-500',   glow: '217, 70, 239',  hoverBg: 'hover:bg-fuchsia-500/10' },
            { key: 'backend',  label: tr("trackBackend"),  Icon: Server,      gradient: 'from-orange-500 to-amber-500',   glow: '249, 115, 22',  hoverBg: 'hover:bg-orange-500/10' },
            { key: 'devops',   label: tr("trackDevOps"),   Icon: Cloud,       gradient: 'from-sky-500 to-cyan-400',       glow: '14, 165, 233',  hoverBg: 'hover:bg-sky-500/10' },
            { key: 'database', label: tr("trackDatabase"), Icon: Database,    gradient: 'from-rose-500 to-red-400',       glow: '244, 63, 94',   hoverBg: 'hover:bg-rose-500/10' },
          ];
          return (
            <div className="relative w-full max-w-3xl select-none">
              {/* Container card */}
              <div className="bg-base-200/80 backdrop-blur-sm border border-base-300 rounded-[1.75rem] p-2 shadow-md">
                {/* Scrollable row — no visible scrollbar, touch/wheel still works */}
                <div
                  className="no-scrollbar flex items-center gap-1.5 overflow-x-auto flex-wrap justify-center sm:flex-nowrap"
                >
                  {TRACKS.map((track) => {
                    const active = activeTrack === track.key;
                    return (
                      <button
                        key={track.key}
                        onClick={() => handleTrackChange(track.key)}
                        style={active ? {
                          boxShadow: `0 4px 18px rgba(${track.glow}, 0.45)`,
                        } : undefined}
                        className={[
                          'group relative flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl',
                          'text-[11px] font-extrabold tracking-wide transition-all duration-200 cursor-pointer',
                          active
                            ? `bg-gradient-to-r ${track.gradient} text-white`
                            : `text-base-content/55 ${track.hoverBg} hover:text-base-content`,
                        ].join(' ')}
                      >
                        {/* Lucide icon */}
                        <track.Icon className={[
                          'w-3.5 h-3.5 transition-transform duration-200',
                          active ? 'scale-110' : 'group-hover:scale-105',
                        ].join(' ')} />
                        <span className="whitespace-nowrap">{track.label}</span>
                        {/* Active dot */}
                        {active && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white/70 shadow-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Layout Mode Selector (Tree View vs Timeline View) */}
        <div className="bg-base-200 p-1 rounded-full border border-base-300 shadow-sm flex gap-1 select-none">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'tree'
                ? 'bg-base-100 text-base-content shadow-sm'
                : 'text-base-content/50 hover:text-base-content'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>{tr("treeView")}</span>
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'timeline'
                ? 'bg-base-100 text-base-content shadow-sm'
                : 'text-base-content/50 hover:text-base-content'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>{tr("timelineView")}</span>
          </button>
        </div>
      </div>

      {/* ── VIEW MODE 1: BRANCH TREE LAYOUT ───────── */}
      {viewMode === 'tree' && (
        <div className="relative max-w-5xl mx-auto pb-10">
          {/* Root node */}
          <div className="flex flex-col items-center mb-2 relative z-10 select-none">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/20 border-4 border-base-100">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white" />
            </div>
            <span className="mt-3 text-xs sm:text-sm font-black uppercase tracking-wider text-base-content/70 text-center px-4">
              {roadmap?.title || "Syllabus Track"}
            </span>
          </div>

          {/* Trunk line */}
          <div className="flex justify-center select-none">
            <div className="w-0.5 h-8 sm:h-10 bg-gradient-to-b from-indigo-500/60 to-base-300" />
          </div>

          {/* Branch connector row (desktop horizontal trunk spread) */}
          <div className="hidden md:block relative h-10 select-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-base-300" />
            <div className="absolute top-1/2 left-[16.66%] right-[16.66%] h-[2px] bg-base-300" />
            {categories.map((cat, idx) => (
              <div
                key={cat}
                className="absolute top-1/2 w-[2px] h-1/2 bg-base-300"
                style={{ left: `${16.66 + idx * 33.33}%` }}
              />
            ))}
          </div>
          <div className="md:hidden flex justify-center select-none">
            <div className="w-px h-6 bg-base-300" />
          </div>

          {/* Category trunk columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {categories.map((cat) => {
              const meta = catMeta[cat];
              const Icon = meta.icon;
              const data = partition[cat] || [];
              const isActiveCat = activeCategory === cat;

              return (
                <div key={cat} className="flex flex-col items-center">
                  {/* Category branch node button */}
                  <button
                    onClick={() => {
                      setActiveCategory(cat);
                      setSelectedModule(null);
                    }}
                    className={`group flex flex-col items-center gap-2 cursor-pointer transition-transform duration-200 ${
                      isActiveCat ? 'scale-105 animate-none' : 'hover:scale-105 hover:animate-none'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] flex items-center justify-center shadow-md border-2 transition-all duration-200 ${
                        isActiveCat
                          ? `bg-${meta.color} text-${meta.color}-content border-${meta.color} shadow-lg`
                          : 'bg-base-200 text-base-content/50 border-base-300 group-hover:border-base-content/30'
                      }`}
                    >
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div className="text-center select-none">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-base-content/40">
                        {catLabels[cat]}
                      </h4>
                      <p className="text-xs sm:text-sm font-extrabold text-base-content mt-0.5 max-w-[160px] leading-snug">
                        {catLabels[cat]} Modules
                      </p>
                    </div>
                  </button>

                  {/* Connector line down to leaf modules */}
                  <div className="w-px h-6 sm:h-8 bg-base-300 my-1 select-none" />

                  {/* Leaf nodes container */}
                  <div className="w-full flex flex-col gap-3 relative">
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-6 w-px bg-base-300 -z-10 hidden sm:block" />

                    {data.map((node: Module, idx: number) => {
                      const isSelected = selectedModule?.id === node.id;
                      return (
                        <div key={node.id} className="relative flex items-center">
                          <div className="hidden sm:block absolute left-1/2 -translate-x-full w-3 h-px bg-base-300" />
                          <button
                            onClick={() => handleNodeClick(node, cat)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group select-none ${
                              isSelected
                                ? `bg-${meta.color}/10 border-${meta.color} shadow-sm`
                                : 'bg-base-100 border-base-300 hover:bg-base-200/60 hover:border-base-content/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  isSelected
                                    ? `bg-${meta.color} text-${meta.color}-content`
                                    : 'bg-base-200 text-base-content/60 border border-base-300'
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <h5
                                  className={`text-xs font-extrabold truncate transition-colors ${
                                    isSelected ? `text-${meta.color}` : 'text-base-content group-hover:text-indigo-600'
                                  }`}
                                >
                                  {node.title}
                                </h5>
                                <span className="text-[9px] text-base-content/45 font-bold flex items-center gap-1 mt-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {node.estimatedHours} hrs
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-base-content/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VIEW MODE 2: TIMELINE PIPELINE GANTT LAYOUT ─ */}
      {viewMode === 'timeline' && (
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Mockup Folder Search Graphic */}
          <div className="text-center space-y-2 mb-6 select-none">
            <FolderSearchIllustration title={roadmap?.title || "Design Upgrade Roadmap"} />
            <h2 className="text-2xl font-black text-slate-800 tracking-tight dark:text-white uppercase">
              Design Upgrade Roadmap
            </h2>
            <p className="text-[11px] font-extrabold text-indigo-600 tracking-widest uppercase">
              FOR {roadmap?.targetRole.toUpperCase() || "SNAPBUY"}
            </p>
          </div>

          <div className="relative">
            {/* UI SUCCESS Badge */}
            <div className="absolute -top-3 left-4 z-20 bg-base-300 text-base-content text-[10px] font-extrabold uppercase px-4 py-1.5 rounded-xl border border-base-350 shadow-sm select-none">
              UI Success
            </div>

            {/* Timeline Gantt Grid Container */}
            <div className="bg-base-100 border border-base-300 rounded-[2rem] p-6 shadow-sm overflow-x-auto select-none">
              <div className="min-w-[800px] relative">
                
                {/* Blue Header: Quarters (Q1 - Q4) */}
                <div className="grid grid-cols-12 bg-indigo-600 text-white font-extrabold text-center rounded-t-2xl py-3.5 border-b border-indigo-700/20 shadow-sm text-sm">
                  <div className="col-span-3 border-r border-white/10">Q1</div>
                  <div className="col-span-3 border-r border-white/10">Q2</div>
                  <div className="col-span-3 border-r border-white/10">Q3</div>
                  <div className="col-span-3">Q4</div>
                </div>
                
                {/* Grey Subheader: Months (Jan - Dec) */}
                <div className="grid grid-cols-12 bg-base-350 text-base-content/60 font-bold text-[10px] uppercase text-center py-2 border-b border-base-300">
                  <div className="border-r border-base-300/40">Jan</div>
                  <div className="border-r border-base-300/40">Feb</div>
                  <div className="border-r border-base-300/40">Mar</div>
                  <div className="border-r border-base-300/40">Apr</div>
                  <div className="border-r border-base-300/40">May</div>
                  <div className="border-r border-base-300/40">Jun</div>
                  <div className="border-r border-base-300/40">Jul</div>
                  <div className="border-r border-base-300/40">Aug</div>
                  <div className="border-r border-base-300/40">Sep</div>
                  <div className="border-r border-base-300/40">Oct</div>
                  <div className="border-r border-base-300/40">Nov</div>
                  <div>Dec</div>
                </div>

                {/* Grid Body */}
                <div className="relative pt-6 pb-8 min-h-[380px] bg-base-100">
                  {/* Vertical dividers representing monthly columns */}
                  <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div key={i} className="border-r border-base-300/35 h-full col-span-1" />
                    ))}
                  </div>

                  {/* Horizontal Task Bars Cascading Diagonally (matches image layout) */}
                  <div className="space-y-4 relative z-10 px-2">
                    {roadmap?.modules.map((m, idx) => {
                      const totalCols = 12;
                      const barWidth = 2; // Each task spans 2 months
                      
                      // Calculate diagonal start column
                      const startCol = Math.min(
                        totalCols - barWidth + 1,
                        Math.round((idx * (totalCols - barWidth)) / (roadmap.modules.length - 1 || 1)) + 1
                      );

                      // Colors from image mockup: Blue, Orange, Dark Grey/Black
                      const colors = [
                        "bg-[#2563eb] text-white hover:bg-[#1d4ed8] border-blue-700/20",
                        "bg-[#f97316] text-white hover:bg-[#ea580c] border-orange-600/20",
                        "bg-[#1e293b] text-white hover:bg-[#0f172a] border-slate-700/20"
                      ];
                      const colorClass = colors[idx % 3];

                      return (
                        <div key={m.id} className="grid grid-cols-12 items-center h-10">
                          <button
                            onClick={() => { setSelectedModule(m); }}
                            className={`col-span-${barWidth} rounded-xl py-2.5 px-4 text-left font-black text-xs shadow-md border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.03] select-none truncate ${colorClass}`}
                            style={{
                              gridColumnStart: startCol,
                              gridColumnEnd: startCol + barWidth,
                            }}
                          >
                            <span className="truncate">{m.title}</span>
                            <span className="text-[9px] opacity-75 font-mono ml-1 shrink-0">{m.estimatedHours}h</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helper message when no module is active */}
      {!selectedModule && (
        <div className="text-center max-w-md mx-auto mt-10 space-y-2 text-base-content/40 select-none">
          <HelpCircle className="w-6 h-6 mx-auto animate-pulse text-indigo-500" />
          <p className="text-xs font-extrabold leading-relaxed">
            {tr("tapAnyNode")}
          </p>
        </div>
      )}

      {/* ── MODULE DETAILS DRAWER (Slide-over panel) ─────────────────────────── */}
      <AnimatePresence>
        {selectedModule && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setSelectedModule(null)}
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: isAr ? "-100%" : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? "-100%" : "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className={`fixed top-0 ${
                isAr ? 'left-0' : 'right-0'
              } h-full w-full sm:w-[420px] bg-base-100 z-50 shadow-2xl p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto`}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between">
                <span className="badge badge-primary badge-outline text-[9px] font-black uppercase tracking-wider py-2.5">
                  {selectedModule.difficulty || "core"} module
                </span>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="btn btn-sm btn-ghost btn-circle text-base-content/40 hover:text-base-content hover:bg-base-200"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-base-content leading-tight">
                  {selectedModule.title}
                </h3>
                <p className="text-xs text-base-content/60 leading-relaxed font-semibold">
                  {selectedModule.description}
                </p>
              </div>

              {/* Syllabus / Module Details Grid */}
              <div className="py-4 border-t border-b border-base-300 space-y-3 font-medium">
                <div className="flex items-center justify-between text-xs font-bold text-base-content/60">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {tr("estimatedDuration")}
                  </span>
                  <span className="text-indigo-600 font-black">{selectedModule.estimatedHours} hrs</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-base-content/60">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    {tr("difficultyLevel")}
                  </span>
                  <span className="badge badge-sm badge-neutral text-[9px] font-black uppercase py-2">
                    {selectedModule.difficulty || "Intermediate"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-base-content/60">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {tr("track")}
                  </span>
                  <span className="capitalize text-xs font-extrabold">{activeTrack} Path</span>
                </div>
              </div>

              {/* Key Topics List */}
              {selectedModule.topics && selectedModule.topics.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-base-content/40">
                    {tr("keyTopics")}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedModule.topics.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 text-[10px] font-bold bg-base-200 border border-base-300 rounded-lg">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Speech Notes section */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-base-content/40 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{tr("referenceCheatsheet")}</span>
                </h4>
                
                {cheatSheet ? (
                  <div className="space-y-2">
                    {/* Version history picker */}
                    {cheatSheetHistory.length > 0 && (
                      <div className="flex items-center gap-2 justify-between">
                        <span className="text-[10px] text-base-content/40 font-bold uppercase">{isAr ? "النسخة:" : "Version:"}</span>
                        <select
                          value={selectedHistoryVersion ? selectedHistoryVersion._id || selectedHistoryVersion.generatedAt : "current"}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "current") {
                              setSelectedHistoryVersion(null);
                            } else {
                              const found = cheatSheetHistory.find((h) => h._id === val || h.generatedAt === val);
                              setSelectedHistoryVersion(found || null);
                            }
                          }}
                          className="select select-bordered select-xs bg-base-200 text-[10px] rounded-lg border-base-300"
                        >
                          <option value="current">{isAr ? "النسخة الحالية" : "Current Version"}</option>
                          {cheatSheetHistory.map((h, i) => (
                            <option key={h._id || i} value={h._id || h.generatedAt}>
                              {isAr ? `نسخة مؤرشفة ${i + 1}` : `Archived Version ${i + 1}`} ({new Date(h.generatedAt).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="bg-base-200 border border-base-300 rounded-2xl p-4 text-xs font-semibold leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-text">
                      {selectedHistoryVersion ? selectedHistoryVersion.content : (cheatSheet.content || cheatSheet)}
                    </div>

                    <button
                      onClick={regenerateReferenceGuide}
                      disabled={generatingSheet}
                      className="btn btn-outline border-indigo-650 text-indigo-600 hover:bg-indigo-600 hover:text-white btn-block rounded-xl text-[10px] font-extrabold h-9"
                    >
                      {generatingSheet ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <>
                          <RotateCw className="w-3.5 h-3.5 mr-1 animate-spin-slow" />
                          {isAr ? "تجديد الملاحظات 🔄" : "Regenerate Speech Notes 🔄"}
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={generateReferenceGuide}
                    disabled={generatingSheet}
                    className="btn btn-outline border-base-300 text-base-content hover:bg-base-200 btn-block rounded-xl text-xs font-extrabold h-11"
                  >
                    {generatingSheet ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-500" />
                        {tr("generateGuide")}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Audio summary voice narration player */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-base-content/40 flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{tr("audioNarration")}</span>
                </h4>

                {/* Three-way state: ready → player, pending → spinner, none → generate button */}
                {audioSummary?.status === 'ready' && audioSummary?.audioUrl ? (
                  <div className="bg-base-200 border border-base-300 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      {/* Robust Play / Pause — audio element lives outside drawer */}
                      <button
                        onClick={togglePlayback}
                        className="btn btn-circle btn-primary btn-sm text-white flex items-center justify-center"
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-white fill-white" />
                        )}
                      </button>

                      {/* Status indicator */}
                      <span className="text-[10px] font-bold text-base-content/50">
                        {isPlaying ? "Playing summary..." : "Audio ready — press play"}
                      </span>

                      {/* Playback speed selector */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[10px] font-black uppercase text-base-content/40">Speed:</span>
                        <select
                          value={audioRate}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setAudioRate(val);
                            if (audioRef.current) audioRef.current.playbackRate = val;
                          }}
                          className="select select-bordered select-xs bg-base-100 text-[10px]"
                        >
                          <option value="1">1.0x</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                          <option value="2">2.0x</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : audioSummary?.status === 'pending' || generatingAudio ? (
                  /* Pending — still synthesising */
                  <div className="bg-base-200 border border-base-300 p-4 rounded-2xl flex items-center gap-3">
                    <span className="loading loading-spinner loading-sm text-primary" />
                    <div>
                      <p className="text-xs font-extrabold text-base-content">{tr("synthesising")}</p>
                      <p className="text-[10px] text-base-content/50">This takes 15–30 seconds. Hang tight.</p>
                    </div>
                  </div>
                ) : (
                  /* Not generated yet */
                  <button
                    onClick={generateAudioSummary}
                    className="btn btn-outline border-base-300 text-base-content hover:bg-base-200 btn-block rounded-xl text-xs font-extrabold h-11"
                  >
                    <Music className="w-4 h-4 mr-1" />
                    {tr("generateAudio")}
                  </button>
                )}
              </div>

              {/* Talk to Voice Tutor Trigger */}
              <div className="pt-2">
                <button
                  onClick={() => setShowVoiceTutor(true)}
                  className="btn btn-outline border-indigo-650 text-indigo-600 hover:bg-indigo-600 hover:text-white btn-block rounded-xl text-xs font-extrabold h-11 flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4 text-indigo-600 group-hover:text-white" />
                  {isAr ? "التحدث مع المعلم الصوتي 🎙️" : "Talk to Voice Tutor 🎙️"}
                </button>
              </div>

              {/* Start Assessment Quiz Trigger */}
              <button
                onClick={() => {
                  setSelectedModule(null);
                  router.push(`/quiz/${selectedModule.id}`);
                }}
                className="btn bg-indigo-600 hover:bg-indigo-700 border-none btn-block rounded-xl text-white font-extrabold text-xs shadow-lg shadow-indigo-500/10 mt-auto h-12 flex items-center justify-center gap-1.5"
              >
                <span>{tr("startChallenge")}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Persistent audio element */}
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />

      {/* AssemblyAI Voice Agent Modal overlay */}
      {selectedModule && (
        <VoiceTutorModal
          isOpen={showVoiceTutor}
          onClose={() => setShowVoiceTutor(false)}
          moduleTitle={selectedModule.title}
          moduleTopics={selectedModule.topics || []}
          trackTitle={activeTrack}
          cheatSheetContent={selectedHistoryVersion ? selectedHistoryVersion.content : (cheatSheet?.content || (typeof cheatSheet === 'string' ? cheatSheet : ''))}
        />
      )}
    </div>
  );
}