# Billing/Plan Gating & AI Feature Data

## Pricing page & role-aware plans

- `plansApi.getPlans({ audience: 'learner' | 'company' })` — single endpoint with audience param.
- Role-switcher pill for guests uses `uiSlice.selectedRoleTab`.

## Stripe checkout & entitlement propagation

- `billingApi.createCheckoutSession` mutation redirects to Stripe.
- Backend webhook updates Mongo and emits `subscription:updated` over Socket.IO.
- `socketMiddleware.ts` handles `subscription:updated` by dispatching `invalidateTags(['Subscription', 'Company'])`.
- Components using `selectIsPremium`/`selectEntitlements` re-render automatically with zero page reloads.

## Mirroring `@RequirePlan` on the client

`planSelectors.ts` derived selectors:
```ts
export const selectIsPremium = createSelector(...)
export const selectEntitlements = createSelector(...)
export const selectCanSendMessage = createSelector(...)
export const selectCanAccessAiMatchScores = createSelector(...)
```

## AI-generated content caching

| Feature | `keepUnusedDataFor` | Refetch policy |
|---|---|---|
| Roadmap DAG | 300s | `refetchOnMountOrArgChange` off |
| Remedial node insertion | n/a | invalidates `RoadmapTrack` tag |
| Quiz sessions | 30s | new topic = new query args |
| Cheatsheets | 600s | 10-minute cache |
| Audio summaries | 600s | 10-minute cache |
