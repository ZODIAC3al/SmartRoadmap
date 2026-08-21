# Role-by-Role Feature → Store Mapping

## 🎓 Learner

| Feature | Endpoint(s) | Cache shape | Notes |
|---|---|---|---|
| 1.1 AI Dependency Graph / roadmap DAG | `roadmapApi.getRoadmap` | `createEntityAdapter` over roadmap nodes | React Flow reads `selectAll` + `selectById` |
| 1.2 Adaptive remedial node insertion | same roadmap cache | `upsertOne` | Remedial nodes inserted server-side and reflected via cache invalidation |
| 1.3 Skill assessment quizzes | `quizApi.getQuizSession`, `submitAttempt` | session query; mutation invalidates `RoadmapTrack` | Timer state is local `useState` |
| 1.4 Verified Skill Passport | `certificatesApi.getMyCertificates` | `createEntityAdapter` (`Certificate`) | PDF URL returned from response |
| 1.5 RAG study guides / cheatsheets | `cheatsheetsApi.getCheatsheet` | plain query, `keepUnusedDataFor: 600` | Aggressive 10-minute cache |
| 1.6 Offline audio summaries | `audioApi.getAudioSummary` | plain query | Stores audio metadata & signed URL |
| 2.1 Streaks & activity tracker | `gamificationApi.getStreaks` | plain query | Server-computed |
| 2.2 Achievement badges | `gamificationApi.getAchievements` | plain array / entity adapter | Invalidated by mastery tags |

## 🏢 Company

| Feature | Endpoint(s) | Cache shape | Notes |
|---|---|---|---|
| 3.1 B2B overview dashboard | `companyApi.getOverview` | plain query | All 6 widgets read from single query |
| 3.2 5-stage Kanban pipeline | `pipelineApi.getCandidates`, `updateStage` | `createEntityAdapter` (`CandidatePipeline`) | Stage change = optimistic `updateQueryData` |
| 3.3 AI talent pool / vector search | `companyApi` / talent query | plain query keyed by params | AI Match Score % & evidence filters |
| 3.4 Company profile / partner badge | `companyApi.getCompanyOverview`, `updateCompanyProfile` | plain query, tag `Company` | Logo & cover uploads invalidate `Company` tag |
| 3.5 Job postings manager | `jobsApi.getJobs`, `createJob`, `updateJobStatus` | `createEntityAdapter` (`Job`) | Status filter is selector over `selectAll` |

## 🛠️ Admin

| Feature | Endpoint(s) | Cache shape | Notes |
|---|---|---|---|
| Certificate verification queue | `certificatesApi.getPendingCertificates`, `verifyCertificate` | `createEntityAdapter` (`Certificate`) | Verifying invalidates specific item |
| Contact Admin support inbox | shares `messagesApi`/`SharedInbox` | `createEntityAdapter` | Pinned support threads first |
