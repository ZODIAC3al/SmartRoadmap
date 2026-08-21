# API Layer, Slices & Selectors — Conventions

## Decision tree: where does a piece of state live?

```
Does it come from MongoDB / a NestJS endpoint (now or eventually)?
├─ YES → RTK Query endpoint (injected into baseApi)
│         └─ Is it a list of records the user scrolls/edits individually
│            (threads, candidates, roadmap nodes, notifications)?
│            ├─ YES → back the query with createEntityAdapter
│            └─ NO  → plain query, cache shape = API response shape
└─ NO  → Is it computed from other state already in the store?
          ├─ YES → memoized selector in store/selectors/
          └─ NO  → genuinely local-only UI state → a slice
                    (theme, sidebar open/closed, active modal, form
                     draft before submit, wizard step index)
```

Rule of thumb: if you could answer "what is the current value of X?" by asking the NestJS API, X does **not** belong in a slice.

## `baseApi.ts` conventions

- Single `createApi` call. `fetchBaseQuery` reads the JWT from `authSlice`/localStorage and injects `Authorization: Bearer <token>` on every request via `prepareHeaders`.
- `tagTypes` is the master list — currently: `Plan`, `Subscription`, `MessageThread`, `Message`, `Company`, `RoadmapTrack`, `Notification`, `Certificate`, `Job`, `CandidatePipeline`, `QuizSession`, `Gamification`. Any new domain adds its tag(s) here first in `baseApi.ts`.
- 401 responses trigger `baseQueryWithReauth` which dispatches `authSlice`'s `logout()` action.

## Entity normalization pattern (`createEntityAdapter`)

Used for message threads, candidate pipelines, jobs, roadmap nodes, notifications, and certificate verification queues:

```ts
const threadsAdapter = createEntityAdapter<MessageThreadItem>({
  selectId: (t) => t.id,
  sortComparer: (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
});
```

Provides `selectById`, `selectAll`, `selectEntities`, `selectIds` for free via `threadsAdapter.getSelectors()`.
