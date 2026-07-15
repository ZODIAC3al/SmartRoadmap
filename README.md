# SmartRoadmap 🚀

> AI-assisted learning paths & talent matching — NestJS + Next.js monorepo.

---

## What this actually is (honest status)

| Area | Status |
|---|---|
| Auth (JWT access + refresh, bcrypt, Google ID-token verification) | ✅ implemented |
| Deny-by-default authorization (global guard + roles + ownership checks) | ✅ implemented |
| Request validation (class-validator DTOs, whitelisted bodies) | ✅ implemented |
| Roadmaps / quizzes / CV parsing via OpenAI | ✅ implemented, with a **mock fallback** for offline dev |
| Vector search (Qdrant) | ✅ client wired (`RAGService`), falls back to curated mocks when unset |
| Payments (PayPal orders + capture + **signed webhook**) | ✅ implemented; mock payments are **blocked in production** |
| Job scraping (Adzuna), BullMQ/Redis queues, React Flow UI | ❌ **not implemented** (the old README claimed these — it was wrong) |

Anything marked ❌ is not in the dependency tree. This README no longer promises features the code doesn't have.

---

## Stack

**Backend** (`apps/api`) — NestJS 11 · MongoDB/Mongoose · OpenAI · Qdrant · JWT · Swagger
**Frontend** (`apps/web`) — Next.js 14 (App Router) · Tailwind + DaisyUI · EN/AR (LTR/RTL)
**Shared** (`packages/shared`) — Zod schemas & types

---

## Quick start

```bash
cp .env.example apps/api/.env          # fill in the secrets (see below)
cp apps/web/.env.local.example apps/web/.env.local
docker compose up -d                   # mongo + redis + qdrant
npm install
npm run dev                            # API :3000 · Web :3001 · Swagger :3000/docs
```

### Required env

The API **refuses to boot** with an invalid config (`src/config/env.validation.ts`), instead of silently
falling back to mock mode or a local database:

```bash
# generate strong secrets
openssl rand -base64 48   # -> JWT_SECRET
openssl rand -base64 48   # -> JWT_REFRESH_SECRET
```

In `NODE_ENV=production` the following are **mandatory** and `MOCK_MODE=true` is rejected:
`MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `OPENAI_API_KEY`,
`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `GOOGLE_CLIENT_ID`.

---

## Security model

- **Deny by default.** `JwtAuthGuard` is registered globally (`APP_GUARD`); a route is only reachable
  without a token if it is explicitly marked `@Public()`. Forgetting a guard can no longer leak data.
- **Identity comes from the JWT only.** `@CurrentUser()` reads the verified token. No endpoint accepts
  a `userId` in the request body anymore.
- **Ownership checks.** `assertSelfOrAdmin()` protects every `/:userId` and `/:id` resource route.
- **Roles.** `@Roles('admin')` / `@Roles('company')` + `RolesGuard`. `admin` cannot be self-assigned at
  registration, and `role` is not an editable profile field.
- **Token storage.** The refresh token is an **httpOnly cookie** scoped to `/auth` (unreadable by JS,
  so XSS can't steal the session; and since it isn't sent on other routes, CSRF surface is nil).
  The 15-minute access token lives in memory only and is silently re-minted on reload.
  `POST /auth/logout` clears the cookie.
- **Passwords.** bcrypt (12 rounds), constant-time compare, dummy-compare on unknown emails.
- **Google sign-in.** The browser sends a Google-signed ID token; the server verifies signature +
  audience with `google-auth-library`. A client-supplied email is never trusted.
- **Payments.** Prices are resolved server-side from the plan; captured amounts are verified; the
  PayPal webhook signature is verified before any entitlement is granted.
- **Transport/infra.** Helmet, CORS allow-list (no `*`), rate limiting (`@nestjs/throttler`,
  5 req/min on auth), 5 MB PDF-only CV uploads, global exception filter with request ids.

## Scripts

```bash
npm run dev         # both apps
npm run build       # typecheck + build both
npm run lint
npm test            # API unit tests
```

## Testing

```bash
npm test --workspace @smartroadmap/api   # 15 unit tests
npm run dev                              # start the stack
npm run smoke                            # 53 live end-to-end + security checks
```

- `AI-ARCHITECTURE.md` — where the AI lives in the code, the five touchpoints, model choices
- `FEATURES-REPORT.md` — every feature and the tech behind it
- `QA-CHECKLIST.md` — manual click-through checklist for the UI
- `scripts/README.md` — how to run the smoke test (incl. in-memory Mongo)

## Deployment

```bash
cp .env.example .env      # fill in production secrets
docker compose -f docker-compose.prod.yml up --build
```
Multi-stage builds, non-root users, Next.js standalone output, and a healthcheck on the API.

## API docs

Swagger UI on `http://localhost:3000/docs` (non-production only). Health probe: `GET /health`.
