# Real-Time, Messaging & Notifications

## Socket connection ownership

One Socket.IO client, opened once, for the whole app — created inside `socketMiddleware.ts` and attached via `configureStore({ middleware })`.
`socketMiddleware` updates `uiSlice.isConnected` state on `connect`/`disconnect` events.

## Event → cache-patch mapping

| Socket.IO event | Handler action | Why |
|---|---|---|
| `message:new` | `messagesApi.util.updateQueryData('getThreadMessages', ...)` + bump thread `lastMessageAt` | Surgical patch — no refetch, keeps scroll position stable |
| `notification:new` | `notificationsSlice.actions.incrementUnread()` + invalidate `Notification` tag | Feed + badge both update from one event |
| `subscription:updated` | `baseApi.util.invalidateTags(['Subscription', 'Company'])` | Plan/entitlement changes are cheap to refetch |
| `pipeline:stage-changed` | `updateQueryData` on candidate's stage field in pipeline entity adapter | Powers live drag-and-drop sync across recruiters |
| `certificate:awaiting-verification` | Updates unread counter and invalidates `Notification` | Preserves standing single notification collapsing |

## Unified 2-pane inbox (`SharedInbox`)

- Left pane: `threadsAdapter` selectors (`selectAll`, sorted by `lastMessageAt`, pinned support threads first).
- Right pane: `messagesApi.useGetThreadMessagesQuery(threadId)`.
- Idempotency: `clientNonce` (UUID) generated during `onQueryStarted` optimistic updates.

## Notifications & 90-day TTL

- Records: `notificationsApi` + `createEntityAdapter`, tag `Notification`.
- Badge count: `notificationsSlice` ephemeral counter.
- 90-day TTL managed by MongoDB index `{ expiresAt: 1 }`.
