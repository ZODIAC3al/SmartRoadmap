# Test scripts

## `smoke-test.mjs` — automated end-to-end + security test

Runs 44 checks against a **live** API: auth, cookies, deny-by-default authorization,
privilege escalation, Google spoofing, IDOR, adaptive quiz, payments, uploads, rate limiting.

```bash
# 1. start the stack (Mongo + API)
docker compose up -d
npm run dev            # or: cd apps/api && npm run start:prod

# 2. in another terminal
npm run smoke          # -> "44 passed  0 failed"
```

Exit code is non-zero if any check fails, so it drops straight into CI.
Point it elsewhere with `API_URL=https://staging.smartroadmap.io npm run smoke`.

### No local Mongo? Run it fully in-memory:

```bash
cd apps/api
npm i -D mongodb-memory-server
node -e "require('mongodb-memory-server').MongoMemoryServer.create().then(async m=>{process.env.MONGODB_URI=m.getUri('smartroadmap');process.env.MOCK_MODE='true';process.env.JWT_SECRET='x'.repeat(40);process.env.JWT_REFRESH_SECRET='y'.repeat(40);require('./dist/main.js')})"
# then: npm run smoke
```
