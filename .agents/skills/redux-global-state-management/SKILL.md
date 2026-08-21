---
name: redux-global-state-management
description: Use this skill any time work touches SmartRoadmap's frontend state — adding a new feature, screen, form, dashboard widget, or component in apps/web; wiring up data for Learner, Company, or Admin roles; handling theme, sidebar, modals, auth, notifications, messaging, billing/payment, AI roadmap/quiz/cheatsheet data, or any value that is fetched from MongoDB via the NestJS API or pushed over Socket.IO. Also use it when reviewing a PR for state-management consistency, migrating legacy useState/useEffect data-fetching to RTK Query, debugging stale/duplicated state, or deciding whether something belongs in a slice vs RTK Query vs local component state. Trigger this even if the user just says "add X to the dashboard" or "hook up Y" without mentioning Redux explicitly — in this codebase, any data that touches the network or is shared across components MUST go through the store described here.
---

# SmartRoadmap — Global State Management Skill

This skill is the single source of truth for how **all** frontend state in
`apps/web` (Next.js) must be implemented, for **all three roles** — Learner,
Company, Admin — and for every feature area: theming, auth, roadmaps/AI,
gamification, messaging, notifications, billing/payment, and the B2B
dashboard. It exists so that no feature is ever built with ad-hoc
`useState` + `useEffect` + `fetch` when it should be wired into the shared
Redux Toolkit (RTK) + RTK Query architecture.

The backend is NestJS + MongoDB. Nothing here changes the API contract —
this skill governs only how the **client** stores, fetches, caches,
normalizes, and reacts to that data.

## When to consult this skill

- Adding any new screen, panel, card, or form that reads or writes data.
- Adding a new NestJS endpoint and needing the matching client-side hook.
- Anything involving theme (`smartlight`/`smartdark`), sidebar, modals, or
  other UI-only state.
- Anything involving the logged-in user, active role, or entitlements.
- Notifications, messaging/inbox, or anything real-time over Socket.IO.
- Billing, Stripe checkout, plan gating, premium/entitlement checks.
- Roadmap generation, quizzes, cheatsheets, audio summaries, skill
  passport/certificates — i.e. anything AI-generated and persisted.
- Company dashboard widgets, candidate pipeline, talent search.
- Admin moderation, certificate verification queue, standing notifications.
- Code review: flag any component doing `fetch`/`axios` directly, storing
  server data in `useState`, or duplicating data already in the RTK Query
  cache.

## Golden rules (non-negotiable)

1. **Server state → RTK Query. Client-only state → a slice. Never useState
   for anything that came from the network.** If it was fetched from Mongo
   or pushed by the API, it lives in an `injectEndpoints` block, not in a
   component's `useState`.
2. **One `baseApi`, many injected endpoint files.** Never call
   `createApi` a second time. Every domain (`plansApi`, `billingApi`,
   `messagesApi`, `companyApi`, and every new one) injects into the single
   `baseApi` in `apps/web/src/store/api/baseApi.ts` so caching, tags, and
   auth headers stay unified.
3. **Tag-based invalidation only — never manual refetch.** Mutations
   declare `invalidatesTags`; queries declare `providesTags`. Don't call
   `.refetch()` from a component to work around a missing tag; add the tag.
4. **Lists of things the user scrolls/searches/updates individually →
   `createEntityAdapter`.** Message threads, pipeline candidates, roadmap
   nodes, notification lists — anything with an `_id` and more than a
   handful of items — is normalized, never stored as a raw array in a
   slice.
5. **Never store a derived value.** If a value can be computed from cache
   data (e.g. "is this user premium", "how many unread notifications"),
   it's a memoized selector in `selectors/`, not a value written by a
   reducer or an effect.
6. **Real-time events patch the cache, they don't create parallel state.**
   `socketMiddleware.ts` is the only place that calls `updateQueryData` /
   `invalidateTags` in response to a Socket.IO event. Components never
   open their own socket listeners.
7. **Role-aware, not role-duplicated.** Learner, Company, and Admin share
   the same `baseApi`, the same `authSlice`, the same notification and
   messaging plumbing. Role differences are expressed as query parameters
   (`?audience=learner|company`) or conditional endpoint selection, not as
   three separate stores.
8. **Every store-touching file is a Client Component.** Anything that
   imports `useAppSelector`/`useAppDispatch` or an RTK Query hook needs
   `"use client"` at the top. Server Components fetch initial/SEO data
   directly from NestJS and hand it to a client child as `initialData`.

## Store layout (already established — extend, don't restructure)

```
apps/web/src/store/
├── index.ts                  # configureStore, RootState, AppDispatch
├── hooks.ts                  # useAppDispatch / useAppSelector
├── provider.tsx              # SSR-safe StoreProvider, per-request store
├── api/
│   ├── baseApi.ts            # createApi + fetchBaseQuery + JWT + tag list
│   ├── plansApi.ts
│   ├── billingApi.ts
│   ├── messagesApi.ts
│   ├── companyApi.ts
│   └── <newDomain>Api.ts     # ← new endpoint files go here, injected
├── slices/
│   ├── authSlice.ts          # user identity, active role
│   ├── uiSlice.ts            # theme, sidebar, active modal
│   ├── notificationsSlice.ts # ephemeral unread badge count
│   └── <newLocalUi>Slice.ts  # ← only for state with NO server source
├── selectors/
│   └── planSelectors.ts      # selectIsPremium, selectEntitlements, ...
└── socket/
    └── socketMiddleware.ts   # Socket.IO → cache patches
```

## Generic recipe for adding any new feature

1. **Classify the data.** Ask: does this come from Mongo/NestJS (→ RTK
   Query), is it purely local UI state with no server counterpart (→
   slice), or is it derived from other state already in the store (→
   selector)? See `references/api-and-slices.md` for the decision tree and
   file templates.
2. **Add or extend an endpoint file** under `store/api/`, injected into
   `baseApi`. Declare `providesTags`/`invalidatesTags` up front — do this
   before writing any UI.
3. **If the data is list-shaped and > a handful of editable items**, back
   it with `createEntityAdapter` (see `references/api-and-slices.md`).
4. **If a value is computed from cache data**, add a memoized selector,
   don't compute it inline in the component.
5. **If the data changes in real time**, add a case to
   `socketMiddleware.ts` mapping the Socket.IO event to a cache patch. See
   `references/realtime-and-messaging.md`.
6. **Wire the component** with the generated hook
   (`useGetXQuery` / `useCreateXMutation`), a loading/error UI, and
   nothing else — no local copies of the fetched data.
7. **Check role-awareness.** Does this feature exist for one role or all
   three? See `references/role-features.md` for how each role's screens
   map onto endpoints and where role gating belongs (query param vs.
   `PlanGuard`-mirroring selector).
8. **Run the verification checklist** at the bottom of this file before
   calling the feature done.

## Reference map

Read the reference file(s) relevant to the task — don't load all of them
for a small change.

| File | Read this when... |
|---|---|
| `references/api-and-slices.md` | Deciding RTK Query vs slice vs selector; writing a new endpoint file; entity adapter patterns; JWT/tag conventions. |
| `references/realtime-and-messaging.md` | Anything Socket.IO; the unified 2-pane inbox; notifications; admin "Contact Admin" thread; TTL/batching behavior. |
| `references/role-features.md` | Building or reviewing a Learner, Company, or Admin screen; mapping a feature-spec item to concrete store files. |
| `references/billing-and-ai.md` | Stripe checkout/plan gating; roadmap/quiz/cheatsheet/audio-summary caching; skill passport & certificates. |
| `references/nextjs-integration.md` | SSR store provider; Server vs Client Component boundaries; theme persistence; hydration pitfalls. |

## Verification checklist (run before merging any feature)

- [ ] No component contains a raw `fetch`/`axios` call for app data.
- [ ] No `useState` holds data that also exists in an RTK Query cache.
- [ ] Every mutation declares `invalidatesTags`; every affected query
      declares matching `providesTags`.
- [ ] Lists with individually-addressable items use `createEntityAdapter`,
      not `array.map` over raw response data.
- [ ] Any value derivable from existing cache/state is a selector in
      `selectors/`, not duplicated state.
- [ ] Real-time updates for this feature (if any) are handled in
      `socketMiddleware.ts`, not a component-level socket listener.
- [ ] The feature works identically whether the user is Learner, Company,
      or Admin except where the feature spec explicitly says otherwise —
      role differences are query params or selector logic, not forked
      code paths.
- [ ] File imports `"use client"` if it touches the store.
- [ ] `npm run typecheck --workspace=@smartroadmap/web` passes with 0
      errors.
