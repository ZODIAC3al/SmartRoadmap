#!/usr/bin/env node
/**
 * SmartRoadmap — end-to-end smoke & security test.
 *
 *   npm run dev            # in one terminal (API on :3000)
 *   npm run smoke          # in another
 *
 * Every check below maps to a real feature or to a vulnerability that used to be
 * exploitable. It runs against a LIVE server, so it proves the running system —
 * not a mock — behaves correctly. Exit code 1 if anything fails.
 */

const API = process.env.API_URL ?? 'http://localhost:3000';

let passed = 0;
let failed = 0;
const failures = [];

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function section(title) {
  console.log(`\n${c.bold(title)}`);
}

async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ${c.green('PASS')}  ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, message: err.message });
    console.log(`  ${c.red('FAIL')}  ${name}`);
    console.log(`        ${c.dim(err.message)}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** fetch wrapper that keeps cookies and returns { status, body, cookies } */
async function call(path, { method = 'GET', body, token, cookie, raw } = {}) {
  const headers = {};
  if (body && !raw) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: raw ? body : body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }

  return {
    status: res.status,
    body: json,
    setCookie: res.headers.get('set-cookie') ?? '',
  };
}

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1e4)}`;

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(c.bold(`\nSmartRoadmap smoke test → ${API}\n`));

  // ── 0. Server is up ────────────────────────────────────────────────────────
  section('0 · Health');

  await check('GET /health reports the API and Mongo are up', async () => {
    const { status, body } = await call('/health');
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.status === 'ok', `db not connected (state: ${body.db})`);
  });

  // ── 1. Registration & login ────────────────────────────────────────────────
  section('1 · Auth — registration, login, tokens');

  const learner = { email: `learner${unique()}@test.dev`, name: 'Test Learner', password: 'password123' };
  const other = { email: `other${unique()}@test.dev`, name: 'Other User', password: 'password123' };
  let learnerToken, otherToken, refreshCookie;

  await check('registration rejects a weak password (validation layer)', async () => {
    const { status } = await call('/auth/register', {
      method: 'POST',
      body: { ...learner, email: `weak${unique()}@test.dev`, password: '123' },
    });
    assert(status === 400, `expected 400, got ${status}`);
  });

  await check('registration works and returns an access token', async () => {
    const { status, body, setCookie } = await call('/auth/register', { method: 'POST', body: learner });
    assert(status === 201, `expected 201, got ${status}: ${JSON.stringify(body)}`);
    assert(body.accessToken, 'no accessToken returned');
    learnerToken = body.accessToken;
    refreshCookie = setCookie.split(';')[0];
  });

  await check('the refresh token is an httpOnly cookie, NOT in the JSON body', async () => {
    const { body, setCookie } = await call('/auth/login', {
      method: 'POST',
      body: { email: learner.email, password: learner.password },
    });
    assert(!body.refreshToken, 'refresh token leaked into the response body!');
    assert(/httponly/i.test(setCookie), 'refresh cookie is not HttpOnly');
    assert(/path=\/auth/i.test(setCookie), 'refresh cookie is not scoped to /auth');
    learnerToken = body.accessToken;
    refreshCookie = setCookie.split(';')[0];
  });

  await check('login with a wrong password is rejected', async () => {
    const { status } = await call('/auth/login', {
      method: 'POST',
      body: { email: learner.email, password: 'wrong-password' },
    });
    assert(status === 401, `expected 401, got ${status}`);
  });

  await check('an unknown email returns the SAME generic error (no user enumeration)', async () => {
    const a = await call('/auth/login', { method: 'POST', body: { email: learner.email, password: 'nope12345' } });
    const b = await call('/auth/login', { method: 'POST', body: { email: `ghost${unique()}@x.dev`, password: 'nope12345' } });
    assert(a.status === b.status, 'status codes differ between known and unknown emails');
    assert(a.body.message === b.body.message, 'error messages differ — this leaks which emails exist');
  });

  await check('the refresh cookie mints a new access token', async () => {
    // Re-login to get a guaranteed-fresh cookie (earlier negative-path logins
    // don't set one, so we don't rely on a stale value here).
    const fresh = await call('/auth/login', { method: 'POST', body: { email: learner.email, password: learner.password } });
    refreshCookie = fresh.setCookie.split(';')[0];
    const { status, body } = await call('/auth/refresh', { method: 'POST', cookie: refreshCookie });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.accessToken, 'no new access token');
    learnerToken = body.accessToken;
  });

  await check('refresh without the cookie is rejected', async () => {
    const { status } = await call('/auth/refresh', { method: 'POST' });
    assert(status === 401, `expected 401, got ${status}`);
  });

  await check('a second account can be created (used for the IDOR tests)', async () => {
    const { status, body } = await call('/auth/register', { method: 'POST', body: other });
    assert(status === 201, `expected 201, got ${status}`);
    otherToken = body.accessToken;
  });

  // ── 1b. Refresh rotation & reuse detection ────────────────────────────────
  section('1b · Refresh token rotation + theft detection');

  await check('refreshing ROTATES the token (the old one stops working)', async () => {
    const login = await call('/auth/login', { method: 'POST', body: { email: other.email, password: other.password } });
    assert(login.status === 200, `login failed with ${login.status}`);
    const firstCookie = login.setCookie.split(';')[0];

    const r1 = await call('/auth/refresh', { method: 'POST', cookie: firstCookie });
    assert(r1.status === 200, `first refresh failed with ${r1.status}`);

    const rotated = r1.setCookie.split(';')[0];
    assert(rotated !== firstCookie, 'the refresh token was NOT rotated');
  });

  await check('replaying an already-used refresh token revokes ALL sessions (theft detection)', async () => {
    const login = await call('/auth/login', { method: 'POST', body: { email: other.email, password: other.password } });
    assert(login.status === 200, `login failed with ${login.status}`);
    const stolen = login.setCookie.split(';')[0];

    // legitimate user refreshes → the token above is now spent
    const ok = await call('/auth/refresh', { method: 'POST', cookie: stolen });
    assert(ok.status === 200, 'the legitimate refresh should succeed');
    const legitCookie = ok.setCookie.split(';')[0];

    // attacker replays the stolen (already-used) token
    const replay = await call('/auth/refresh', { method: 'POST', cookie: stolen });
    assert(replay.status === 401, `replay should be rejected, got ${replay.status}`);

    // ...and the legitimate session is nuked too, because we can't tell who is who
    const after = await call('/auth/refresh', { method: 'POST', cookie: legitCookie });
    assert(after.status === 401, 'all sessions should have been revoked after a replay');

    // restore a usable session for the rest of the suite
    const relogin = await call('/auth/login', { method: 'POST', body: { email: other.email, password: other.password } });
    otherToken = relogin.body.accessToken;
  });

  // ── 1c. Password reset & email verification ───────────────────────────────
  section('1c · Password reset & email verification');

  await check('forgot-password returns 200 for a REGISTERED email', async () => {
    const { status, body } = await call('/auth/forgot-password', { method: 'POST', body: { email: learner.email } });
    assert(status === 200 && body.success, `expected 200/success, got ${status}`);
  });

  await check('forgot-password returns the SAME 200 for an unknown email (no enumeration)', async () => {
    const { status, body } = await call('/auth/forgot-password', { method: 'POST', body: { email: `nobody${unique()}@test.dev` } });
    assert(status === 200 && body.success, `expected an identical 200/success, got ${status}`);
  });

  await check('a forged reset token is rejected', async () => {
    const { status } = await call('/auth/reset-password', {
      method: 'POST',
      body: { token: 'a'.repeat(64), password: 'newpassword123' },
    });
    assert(status === 400, `expected 400, got ${status}`);
  });

  await check('a forged verification token is rejected', async () => {
    const { status } = await call('/auth/verify-email', { method: 'POST', body: { token: 'b'.repeat(64) } });
    assert(status === 400, `expected 400, got ${status}`);
  });

  await check('reset-password enforces the password policy', async () => {
    const { status } = await call('/auth/reset-password', { method: 'POST', body: { token: 'c'.repeat(64), password: '123' } });
    assert(status === 400, `expected 400, got ${status}`);
  });

  // ── 2. Authorization: deny by default ──────────────────────────────────────
  section('2 · Authorization — deny by default');

  const protectedRoutes = [
    ['GET', '/auth/me'],
    ['GET', '/auth/users'],
    ['GET', '/hiring/candidates'],
    ['GET', '/notifications'],
    ['GET', '/messages/conversations'],
    ['POST', '/roadmap/generate'],
    ['POST', '/payment/orders'],
  ];

  for (const [method, path] of protectedRoutes) {
    await check(`${method} ${path} requires a token`, async () => {
      const { status } = await call(path, { method, body: method === 'POST' ? {} : undefined });
      assert(status === 401, `expected 401, got ${status} — THIS ROUTE IS PUBLIC`);
    });
  }

  await check('a forged/garbage JWT is rejected', async () => {
    const { status } = await call('/auth/me', { token: 'not.a.real.token' });
    assert(status === 401, `expected 401, got ${status}`);
  });

  await check('GET /auth/me returns the caller identity', async () => {
    const { status, body } = await call('/auth/me', { token: learnerToken });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.email === learner.email, 'wrong user returned');
    assert(body.passwordHash === undefined, 'password hash leaked in the response!');
  });

  // ── 3. Privilege escalation ────────────────────────────────────────────────
  section('3 · Privilege escalation is blocked');

  await check('a learner cannot list all users (admin only)', async () => {
    const { status } = await call('/auth/users', { token: learnerToken });
    assert(status === 403, `expected 403, got ${status}`);
  });

  await check('"admin" cannot be self-assigned at registration', async () => {
    const { status } = await call('/auth/register', {
      method: 'POST',
      body: { email: `admin${unique()}@test.dev`, name: 'Wannabe', password: 'password123', role: 'admin' },
    });
    assert(status === 400, `expected 400 (DTO rejects role=admin), got ${status}`);
  });

  await check('role cannot be escalated through the profile update endpoint', async () => {
    await call('/auth/me', { method: 'PATCH', token: learnerToken, body: { role: 'admin', name: 'Still Learner' } });
    const { body } = await call('/auth/me', { token: learnerToken });
    assert(body.role === 'learner', `role was escalated to "${body.role}"!`);
  });

  await check('a learner cannot post a job (company/admin only)', async () => {
    const { status } = await call('/hiring/jobs', {
      method: 'POST',
      token: learnerToken,
      body: {
        title: 'Fake Job',
        company: 'Evil Corp',
        location: 'Remote',
        requiredSkills: ['React'],
        description: 'This should never be created by a learner account.',
      },
    });
    assert(status === 403, `expected 403, got ${status}`);
  });

  // ── 4. Google sign-in cannot be spoofed ────────────────────────────────────
  section('4 · Google sign-in cannot be spoofed');

  await check('POST /auth/google with a raw email is rejected (old account takeover)', async () => {
    const { status } = await call('/auth/google', {
      method: 'POST',
      body: { email: 'admin@smartroadmap.dev', name: 'Attacker' },
    });
    assert(status === 400, `expected 400 (idToken required), got ${status}`);
  });

  await check('POST /auth/google with a fabricated idToken is rejected', async () => {
    const { status } = await call('/auth/google', {
      method: 'POST',
      body: { idToken: 'eyJhbGciOiJub25lIn0.eyJlbWFpbCI6ImFkbWluQHNtYXJ0cm9hZG1hcC5kZXYifQ.' },
    });
    assert([400, 401].includes(status), `expected 400/401, got ${status} — the token was NOT verified`);
  });

  // ── 5. IDOR — you can only touch your own data ─────────────────────────────
  section('5 · IDOR — cross-user access is blocked');

  let learnerId, otherId;

  await check('setup: read both user ids', async () => {
    learnerId = (await call('/auth/me', { token: learnerToken })).body.id;
    otherId = (await call('/auth/me', { token: otherToken })).body.id;
    assert(learnerId && otherId && learnerId !== otherId, 'could not resolve two distinct users');
  });

  await check('user A cannot read user B\'s CV', async () => {
    const { status } = await call(`/cv/user/${otherId}`, { token: learnerToken });
    assert(status === 403 || status === 404, `expected 403/404, got ${status}`);
  });

  await check('user A cannot read user B\'s job matches', async () => {
    const { status } = await call(`/hiring/jobs/matches/${otherId}`, { token: learnerToken });
    assert(status === 403, `expected 403, got ${status}`);
  });

  await check('user A cannot read user B\'s roadmap', async () => {
    const { status } = await call(`/roadmap/user/${otherId}`, { token: learnerToken });
    assert(status === 403 || status === 404, `expected 403/404, got ${status}`);
  });

  // ── 6. Roadmap + adaptive quiz ─────────────────────────────────────────────
  section('6 · Feature — roadmap generation & adaptive quiz');

  let roadmap, firstModuleId;

  await check('a roadmap is generated for the caller', async () => {
    const { status, body } = await call('/roadmap/generate', {
      method: 'POST',
      token: learnerToken,
      body: { targetRole: 'Frontend Engineer', skills: ['HTML', 'CSS'] },
    });
    assert(status === 201, `expected 201, got ${status}: ${JSON.stringify(body)}`);
    assert(Array.isArray(body.modules) && body.modules.length > 0, 'roadmap has no modules');
    roadmap = body;
    firstModuleId = body.modules[0].id;
  });

  await check('the roadmap belongs to the caller (GET /roadmap/me)', async () => {
    const { status, body } = await call('/roadmap/me', { token: learnerToken });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.title === roadmap.title, 'a different roadmap was returned');
  });

  await check('generate rejects an empty target role (validation)', async () => {
    const { status } = await call('/roadmap/generate', { method: 'POST', token: learnerToken, body: { targetRole: '' } });
    assert(status === 400, `expected 400, got ${status}`);
  });

  let sessionId;

  await check('a quiz session starts and returns the first question', async () => {
    const { status, body } = await call('/assessment/session/start', {
      method: 'POST',
      token: learnerToken,
      body: { moduleId: firstModuleId, topic: 'React Fundamentals' },
    });
    assert(status === 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert(body.sessionId && body.question && Array.isArray(body.options), 'malformed quiz payload');
    sessionId = body.sessionId;
  });

  await check('another user cannot answer this quiz session', async () => {
    const { status } = await call(`/assessment/session/${sessionId}/answer`, {
      method: 'POST',
      token: otherToken,
      body: { answer: 'anything' },
    });
    assert(status === 403, `expected 403, got ${status}`);
  });

  await check('answering all questions completes the session and returns a score', async () => {
    let result;
    for (let i = 0; i < 10; i++) {
      const { body } = await call(`/assessment/session/${sessionId}/answer`, {
        method: 'POST',
        token: learnerToken,
        body: { answer: 'Option A', timeTaken: 5 },
      });
      if (body?.isFinished) {
        result = body.results;
        break;
      }
    }
    assert(result, 'the quiz never finished');
    assert(typeof result.score === 'number', 'no score returned');
    assert(typeof result.passed === 'boolean', 'no pass/fail returned');
  });

  await check('the roadmap adapts to the quiz outcome (unlock or remedial module)', async () => {
    const { body } = await call('/roadmap/me', { token: learnerToken });
    const first = body.modules.find((m) => m.id === firstModuleId);
    const remedial = body.modules.find((m) => m.id === `${firstModuleId}-remedial`);
    const unlocked = body.modules.some((m) => m.prerequisites?.includes(firstModuleId) && m.status !== 'locked');
    assert(
      first.status === 'completed' || first.status === 'failed',
      `the attempted module is still "${first.status}" — the roadmap did not react`,
    );
    assert(unlocked || remedial, 'neither a next module was unlocked nor a remedial module added');
  });

  // ── 6b. Skill gap → roadmap ───────────────────────────────────────────────
  section('6b · Feature — skill gap analysis feeds the roadmap');

  await check('job matches expose a skills gap', async () => {
    const { status, body } = await call('/hiring/jobs/matches', { token: learnerToken });
    assert(status === 200, `expected 200, got ${status}`);
    assert(Array.isArray(body) && body.length > 0, 'no jobs returned');
    assert('matchScore' in body[0] && 'skillsGap' in body[0], 'matches are missing score/gap');
  });

  await check('closing the gap injects the missing skills into the roadmap', async () => {
    const matches = (await call('/hiring/jobs/matches', { token: learnerToken })).body;
    const job = matches.find((j) => j.skillsGap.length > 0) ?? matches[0];

    const { status, body } = await call(`/hiring/jobs/${job._id}/close-gap`, { method: 'POST', token: learnerToken });
    assert(status === 201 || status === 200, `expected 200/201, got ${status}: ${JSON.stringify(body)}`);

    const roadmap = (await call('/roadmap/me', { token: learnerToken })).body;
    if (body.added?.length) {
      const added = body.added[0];
      const present = roadmap.modules.some((m) => m.title.toLowerCase() === String(added).toLowerCase());
      assert(present, `"${added}" was reported as added but is not in the roadmap`);
    }
  });

  // ── 7. Payments ────────────────────────────────────────────────────────────
  section('7 · Payments');

  let orderId;

  await check('an order is created with a SERVER-side price', async () => {
    const { status, body } = await call('/payment/orders', {
      method: 'POST',
      token: learnerToken,
      body: { plan: 'pro_learner', amount: 0.01 }, // the amount must be ignored
    });
    assert(status === 201, `expected 201, got ${status}: ${JSON.stringify(body)}`);
    orderId = body.id;
  });

  await check('an unknown plan is rejected', async () => {
    const { status } = await call('/payment/orders', {
      method: 'POST',
      token: learnerToken,
      body: { plan: 'free_forever_lol' },
    });
    assert(status === 400, `expected 400, got ${status}`);
  });

  await check('another user cannot capture your order', async () => {
    const { status } = await call('/payment/orders/capture', {
      method: 'POST',
      token: otherToken,
      body: { orderId },
    });
    assert(status === 403 || status === 404, `expected 403/404, got ${status}`);
  });

  await check('capturing your own order activates the subscription', async () => {
    const { status } = await call('/payment/orders/capture', {
      method: 'POST',
      token: learnerToken,
      body: { orderId },
    });
    assert(status === 200, `expected 200, got ${status}`);

    const { body: me } = await call('/auth/me', { token: learnerToken });
    assert(me.plan === 'pro_learner', `plan is "${me.plan}"`);
    assert(me.subscriptionStatus === 'active', `subscription is "${me.subscriptionStatus}"`);
  });

  await check('an unsigned webhook is rejected', async () => {
    const { status } = await call('/payment/webhook', {
      method: 'POST',
      body: { event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: orderId } },
    });
    assert(status !== 200, 'an unsigned webhook was accepted!');
  });

  // ── 8. Uploads & misc ──────────────────────────────────────────────────────
  section('8 · Uploads, newsletter, rate limiting');

  await check('CV upload without a file returns 400 (no silent mock)', async () => {
    const { status } = await call('/cv/upload', { method: 'POST', token: learnerToken });
    assert(status === 400, `expected 400, got ${status}`);
  });

  await check('the newsletter endpoint the footer calls actually exists', async () => {
    const { status, body } = await call('/newsletter/subscribe', {
      method: 'POST',
      body: { email: `news${unique()}@test.dev` },
    });
    assert(status === 200 && body.success, `expected 200/success, got ${status}`);
  });

  await check('an invalid newsletter email is rejected', async () => {
    const { status } = await call('/newsletter/subscribe', { method: 'POST', body: { email: 'not-an-email' } });
    assert(status === 400, `expected 400, got ${status}`);
  });

  await check('login is rate limited (brute force protection)', async () => {
    // The limit is configurable (AUTH_THROTTLE_LIMIT, default 5) so CI can raise
    // it for this suite without weakening production.
    const limit = Number(process.env.AUTH_THROTTLE_LIMIT ?? 5);
    let throttled = false;
    for (let i = 0; i < limit + 8; i++) {
      const { status } = await call('/auth/login', {
        method: 'POST',
        body: { email: `bruteforce${unique()}@test.dev`, password: 'wrong-password' },
      });
      if (status === 429) {
        throttled = true;
        break;
      }
    }
    assert(throttled, 'no 429 after exceeding the login limit — throttling is off');
  });

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold('─'.repeat(60))}`);
  console.log(`${c.green(`${passed} passed`)}  ${failed ? c.red(`${failed} failed`) : '0 failed'}`);

  if (failed) {
    console.log(`\n${c.red('Failures:')}`);
    failures.forEach((f) => console.log(`  • ${f.name}\n    ${c.dim(f.message)}`));
    process.exit(1);
  }

  console.log(c.green('\nEverything checks out.\n'));
}

main().catch((err) => {
  console.error(c.red(`\nSmoke test crashed: ${err.message}`));
  console.error(c.dim('Is the API running on ' + API + '? Start it with `npm run dev`.'));
  process.exit(1);
});
