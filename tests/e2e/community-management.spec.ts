import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Community & Management — API behaviour tests.
 *
 * Covers the five surfaces in that section: Community, Mentor Network,
 * Resource Voting, Admin Dashboard and Reporting & Analytics.
 *
 * These drive the API directly rather than the UI. The rules being checked
 * here — who may read what, whether a vote is idempotent, whether a learner
 * can reach the admin dashboard — are enforced server-side, so asserting them
 * through the browser would test the navigation bar, not the boundary.
 */

const API = process.env.API_URL ?? 'http://localhost:3002';

interface Session {
  token: string;
  userId: string;
  email: string;
}

let learner: Session;
let otherLearner: Session;
let mentor: Session;

/**
 * Register a throwaway account, waiting out the auth rate limiter if we hit it.
 *
 * The API caps auth routes at 15 requests per minute. That is deliberate, so
 * the test honours it rather than working around it: on a 429 we wait for the
 * server's own Retry-After and try again.
 */
async function register(
  request: APIRequestContext,
  role: 'learner' | 'company' | 'mentor',
  tag: string,
): Promise<Session> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const email = `cm.${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@devotopia.dev`;
    const res = await request.post(`${API}/auth/register`, {
      data: { email, name: `CM ${tag}`, password: 'Passw0rd123', role },
    });

    if (res.ok()) {
      const body = await res.json();
      return { token: body.accessToken, userId: body.user._id ?? body.user.id, email };
    }

    if (res.status() === 429 && attempt < 3) {
      const wait = Number(res.headers()['retry-after'] ?? 20);
      await new Promise((r) => setTimeout(r, (wait + 2) * 1000));
      continue;
    }

    expect(res.ok(), `register ${role} failed (${res.status()}): ${await res.text()}`).toBeTruthy();
  }

  throw new Error(`could not register ${role} after retries`);
}

const auth = (s: Session) => ({ Authorization: `Bearer ${s.token}` });

// Registration may have to wait out the 15-per-minute auth limiter, which can
// take longer than the default 30s hook timeout.
test.setTimeout(120_000);

test.beforeAll(async ({ playwright }) => {
  test.setTimeout(180_000);
  const request = await playwright.request.newContext();
  learner = await register(request, 'learner', 'learner');
  otherLearner = await register(request, 'learner', 'other');
  mentor = await register(request, 'mentor', 'mentor');
  await request.dispose();
});

// ───────────────────────────── Community ──────────────────────────────────
test.describe('Community', () => {
  let spaceId: string;
  let postId: string;

  test('creates a discussion space and lists it', async ({ request }) => {
    const create = await request.post(`${API}/community/spaces`, {
      headers: auth(learner),
      data: {
        name: `Frontend Guild ${Date.now()}`,
        description: 'A space for front-end discussion',
        category: 'frontend',
        skills: ['React', 'TypeScript'],
      },
    });
    expect(create.status(), await create.text()).toBeLessThan(400);

    const space = await create.json();
    spaceId = space._id ?? space.id;
    expect(spaceId).toBeTruthy();

    const list = await request.get(`${API}/community/spaces`, { headers: auth(learner) });
    expect(list.ok()).toBeTruthy();
    const spaces = await list.json();
    const items = Array.isArray(spaces) ? spaces : (spaces.items ?? spaces.data ?? []);
    expect(items.some((s: any) => (s._id ?? s.id) === spaceId)).toBe(true);
  });

  test('creates a post inside the space and reads it back', async ({ request }) => {
    const create = await request.post(`${API}/community/spaces/${spaceId}/posts`, {
      headers: auth(learner),
      data: {
        title: 'How does the adaptive quiz pick difficulty?',
        content: 'Two consecutive correct answers move the ladder up one step.',
        tags: ['quiz', 'adaptive'],
      },
    });
    expect(create.status(), await create.text()).toBeLessThan(400);

    const post = await create.json();
    postId = post._id ?? post.id;
    expect(postId).toBeTruthy();

    const read = await request.get(`${API}/community/posts/${postId}`, {
      headers: auth(learner),
    });
    expect(read.ok()).toBeTruthy();
    expect((await read.json()).title).toContain('adaptive quiz');
  });

  test('rejects a post with a missing title at the validation layer', async ({ request }) => {
    const res = await request.post(`${API}/community/spaces/${spaceId}/posts`, {
      headers: auth(learner),
      data: { content: 'body without a title' },
    });
    expect(res.status()).toBe(400);
  });

  test('an upvote registers once, and voting again toggles it off', async ({ request }) => {
    const vote = (direction: 'up' | 'down', voter = otherLearner) =>
      request.patch(`${API}/community/posts/${postId}/vote`, {
        headers: auth(voter),
        data: { direction },
      });

    // A new post starts at 1: the author is seeded as its first upvoter. Assert
    // deltas rather than absolute totals so the test does not encode that.
    const before = await request.get(`${API}/community/posts/${postId}`, {
      headers: auth(learner),
    });
    const baseline = (await before.json()).qualityScore;

    const first = await vote('up');
    expect(first.ok(), await first.text()).toBeTruthy();
    const afterFirst = await first.json();

    expect(afterFirst.upvotes).toContain(otherLearner.userId);
    expect(afterFirst.qualityScore).toBe(baseline + 1);

    // Same direction again is a toggle, not a second vote — this is what stops
    // one account from inflating a post by clicking repeatedly.
    const second = await vote('up');
    expect(second.ok()).toBeTruthy();
    const afterSecond = await second.json();

    expect(afterSecond.upvotes).not.toContain(otherLearner.userId);
    expect(afterSecond.qualityScore).toBe(baseline);
  });

  test('switching direction moves the vote rather than adding one', async ({ request }) => {
    // `otherLearner` is not the author, so it starts with no vote on this post.
    const down = await request.patch(`${API}/community/posts/${postId}/vote`, {
      headers: auth(otherLearner),
      data: { direction: 'down' },
    });
    expect(down.ok(), await down.text()).toBeTruthy();
    let body = await down.json();
    expect(body.downvotes).toContain(otherLearner.userId);

    const up = await request.patch(`${API}/community/posts/${postId}/vote`, {
      headers: auth(otherLearner),
      data: { direction: 'up' },
    });
    expect(up.ok()).toBeTruthy();
    body = await up.json();

    // A user must never appear on both sides of the tally.
    expect(body.upvotes).toContain(otherLearner.userId);
    expect(body.downvotes).not.toContain(otherLearner.userId);
    expect(body.qualityScore).toBe(body.upvotes.length - body.downvotes.length);
  });

  test('adds a comment and lists it under the post', async ({ request }) => {
    const create = await request.post(`${API}/community/posts/${postId}/comments`, {
      headers: auth(otherLearner),
      data: { content: 'Useful — the weighting is the part I missed.' },
    });
    expect(create.status(), await create.text()).toBeLessThan(400);

    const list = await request.get(`${API}/community/posts/${postId}/comments`, {
      headers: auth(learner),
    });
    expect(list.ok()).toBeTruthy();
    const comments = await list.json();
    const items = Array.isArray(comments) ? comments : (comments.items ?? []);
    expect(items.length).toBeGreaterThan(0);
  });

  test('requires authentication to read spaces', async ({ request }) => {
    const res = await request.get(`${API}/community/spaces`);
    expect(res.status(), 'community must not be anonymously readable').toBe(401);
  });
});

// ──────────────────────────── Mentor Network ──────────────────────────────
test.describe('Mentor Network', () => {
  let profileId: string;

  test('a mentor can publish a profile', async ({ request }) => {
    const res = await request.post(`${API}/mentor/profiles`, {
      headers: auth(mentor),
      data: {
        expertise: ['React', 'NestJS', 'MongoDB'],
        experienceYears: 10,
        industry: 'Software Engineering',
        bio: 'Ten years building Node and React systems.',
        certifications: ['AWS Solutions Architect'],
        // Open every weekday, all day, so the booking test does not depend on
        // which day it happens to run.
        availability: Array.from({ length: 7 }, (_, dayOfWeek) => ({
          dayOfWeek,
          startTime: '00:00',
          endTime: '23:59',
        })),
      },
    });
    expect(res.status(), await res.text()).toBeLessThan(400);
    const profile = await res.json();
    profileId = profile._id ?? profile.id;
    expect(profileId).toBeTruthy();
  });

  test('rejects a profile missing its required fields', async ({ request }) => {
    const res = await request.post(`${API}/mentor/profiles`, {
      headers: auth(mentor),
      data: { bio: 'no expertise, no availability' },
    });
    expect(res.status()).toBe(400);
  });

  test('lists mentor profiles', async ({ request }) => {
    const res = await request.get(`${API}/mentor/profiles`, { headers: auth(learner) });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const items = Array.isArray(body) ? body : (body.items ?? body.data ?? []);
    expect(Array.isArray(items)).toBe(true);
  });

  test('recommends mentors to a learner', async ({ request }) => {
    const res = await request.get(`${API}/mentor/profiles/recommend`, {
      headers: auth(learner),
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body) ? body : (body.items ?? [])).toBeDefined();
  });

  test('books a session and lists it for the learner', async ({ request }) => {
    // The server matches the slot against the booking's *local* hour, so build
    // the timestamp from a local Date rather than a fixed UTC string.
    const slot = new Date(Date.now() + 86_400_000);
    slot.setHours(14, 0, 0, 0);

    const booking = await request.post(`${API}/mentor/sessions`, {
      headers: auth(learner),
      data: {
        mentorId: mentor.userId,
        scheduledAt: slot.toISOString(),
        notes: 'Reviewing my roadmap',
      },
    });
    expect(booking.status(), await booking.text()).toBeLessThan(400);

    const mine = await request.get(`${API}/mentor/sessions/me`, { headers: auth(learner) });
    expect(mine.ok()).toBeTruthy();
    const body = await mine.json();
    const items = Array.isArray(body) ? body : (body.items ?? []);
    expect(items.length).toBeGreaterThan(0);
  });

  test('refuses a booking outside the mentor availability window', async ({ request }) => {
    // A mentor with a single narrow slot; anything outside it must be refused
    // rather than silently accepted.
    const narrow = await register(request, 'mentor', 'narrow');
    const create = await request.post(`${API}/mentor/profiles`, {
      headers: auth(narrow),
      data: {
        expertise: ['Go'],
        experienceYears: 4,
        industry: 'Backend',
        bio: 'Available Mondays only.',
        availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }],
      },
    });
    expect(create.status(), await create.text()).toBeLessThan(400);

    // Pick a Wednesday, which the slot above never covers.
    const wednesday = new Date();
    wednesday.setDate(wednesday.getDate() + ((3 - wednesday.getDay() + 7) % 7 || 7));
    wednesday.setHours(15, 0, 0, 0);

    const res = await request.post(`${API}/mentor/sessions`, {
      headers: auth(learner),
      data: { mentorId: narrow.userId, scheduledAt: wednesday.toISOString() },
    });
    expect(res.status()).toBe(400);
    expect(await res.text()).toContain('availability');
  });
});

// ─────────────────────────── Resource Voting ──────────────────────────────
test.describe('Resource Voting', () => {
  test('returns personalised resource recommendations', async ({ request }) => {
    const res = await request.get(`${API}/resources/recommend`, { headers: auth(learner) });
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body) ? body : (body.items ?? [])).toBeDefined();
  });

  test('a vote on a non-existent resource is rejected, not silently accepted', async ({
    request,
  }) => {
    const res = await request.patch(`${API}/resources/507f1f77bcf86cd799439011/vote`, {
      headers: auth(learner),
      data: { direction: 'up' },
    });
    // 404 (no such resource) or 400 (bad id) are both correct. A 2xx would mean
    // votes are being recorded against nothing.
    expect([400, 404]).toContain(res.status());
  });

  test('voting requires authentication', async ({ request }) => {
    const res = await request.patch(`${API}/resources/507f1f77bcf86cd799439011/vote`, {
      data: { direction: 'up' },
    });
    expect(res.status()).toBe(401);
  });
});

// ─────────────────────── Admin Dashboard & Analytics ──────────────────────
test.describe('Admin Dashboard & Reporting', () => {
  // The public registration DTO refuses `admin`, so no test can mint one. That
  // is the security property working, and it means these tests assert the
  // boundary holds rather than exercising the admin happy path.

  const ADMIN_ROUTES = [
    '/admin/users',
    '/admin/reports',
    '/admin/audit-logs',
    '/admin/analytics',
    '/admin/analytics/insights',
    '/admin/certificates',
  ];

  for (const route of ADMIN_ROUTES) {
    test(`a learner is refused ${route}`, async ({ request }) => {
      const res = await request.get(`${API}${route}`, { headers: auth(learner) });
      expect(res.status(), `${route} must be admin-only`).toBe(403);
    });
  }

  for (const route of ADMIN_ROUTES) {
    test(`an anonymous caller is refused ${route}`, async ({ request }) => {
      const res = await request.get(`${API}${route}`);
      expect(res.status(), `${route} must require a session`).toBe(401);
    });
  }

  test('a learner cannot promote themselves to admin', async ({ request }) => {
    const res = await request.patch(`${API}/admin/users/${learner.userId}/role`, {
      headers: auth(learner),
      data: { userId: learner.userId, role: 'admin' },
    });
    expect(res.status(), 'privilege escalation must be refused').toBe(403);
  });

  test('registration refuses the admin role outright', async ({ request }) => {
    const res = await request.post(`${API}/auth/register`, {
      data: {
        email: `escalate.${Date.now()}@devotopia.dev`,
        name: 'Escalation Attempt',
        password: 'Passw0rd123',
        role: 'admin',
      },
    });
    expect(res.status(), 'admin must not be self-assignable').toBe(400);
  });
});

// ────────────────────────────── Reporting ─────────────────────────────────
test.describe('Reporting', () => {
  test('a learner can report content', async ({ request }) => {
    const res = await request.post(`${API}/community/report`, {
      headers: auth(otherLearner),
      data: {
        targetType: 'post',
        targetId: '507f1f77bcf86cd799439011',
        reason: 'spam',
        details: 'Automated test report.',
      },
    });
    // Accepted, or refused because the target does not exist — both are sane.
    // A 500 would mean the endpoint cannot handle a missing target.
    expect(res.status(), await res.text()).toBeLessThan(500);
  });

  test('reporting requires authentication', async ({ request }) => {
    const res = await request.post(`${API}/community/report`, {
      data: { targetType: 'post', targetId: 'x', reason: 'spam' },
    });
    expect(res.status()).toBe(401);
  });
});
