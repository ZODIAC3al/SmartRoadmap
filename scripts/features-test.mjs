#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../apps/api/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (process.env[key] === undefined) {
        process.env[key] = value.trim();
      }
    }
  }
}

const API = process.env.API_URL ?? 'http://127.0.0.1:3000';
const MONGO_URI = process.env.MONGODB_URI;

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
    console.log(`        ${c.dim(err.stack || err.message)}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const unique = () => Date.now() + Math.floor(Math.random() * 1e4);

async function call(path, { method = 'GET', body, token, cookie } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {}

  return {
    status: res.status,
    body: json,
  };
}

async function run() {
  console.log(`SmartRoadmap Feature & Management test → ${API}`);
  
  // Connect to DB directly for role upgrades and cleanups
  assert(MONGO_URI, 'MONGODB_URI must be set in env');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const testUserAEmail = `test.admin.${unique()}@test.dev`;
  const testUserBEmail = `test.learner.${unique()}@test.dev`;
  const testUserCEmail = `test.mentor.${unique()}@test.dev`;
  const password = 'Password123!';

  let tokenA, tokenB, tokenC;
  let userAId, userBId, userCId;

  // ── 0. Registration & Login ───────────────────────────────────────────
  section('0 · Setup Test Users');

  await check('register Admin User A', async () => {
    const { status, body } = await call('/auth/register', {
      method: 'POST',
      body: { email: testUserAEmail, name: 'Test Admin', password },
    });
    assert(status === 201, `failed register User A: ${status}`);
    tokenA = body.accessToken;
    userAId = body.user.id;
  });

  await check('register Learner User B', async () => {
    const { status, body } = await call('/auth/register', {
      method: 'POST',
      body: { email: testUserBEmail, name: 'Test Learner', password },
    });
    assert(status === 201, `failed register User B: ${status}`);
    tokenB = body.accessToken;
    userBId = body.user.id;
  });

  await check('register Mentor User C', async () => {
    const { status, body } = await call('/auth/register', {
      method: 'POST',
      body: { email: testUserCEmail, name: 'Test Mentor', password },
    });
    assert(status === 201, `failed register User C: ${status}`);
    tokenC = body.accessToken;
    userCId = body.user.id;
  });

  await check('elevate User A to admin in DB', async () => {
    const usersCollection = db.collection('users');
    const res = await usersCollection.updateOne(
      { email: testUserAEmail },
      { $set: { role: 'admin', isVerified: true } }
    );
    assert(res.modifiedCount === 1, 'could not update user A role to admin');
    
    // Login again to mint a new JWT token reflecting the admin role!
    const loginRes = await call('/auth/login', {
      method: 'POST',
      body: { email: testUserAEmail, password },
    });
    assert(loginRes.status === 200, `failed to login Admin A: ${loginRes.status}`);
    tokenA = loginRes.body.accessToken;
    
    // verify role on auth/me
    const { body } = await call('/auth/me', { token: tokenA });
    assert(body.role === 'admin', `expected role admin, got ${body.role}`);
  });

  // ── 1. Community & Management ──────────────────────────────────────────
  section('1 · Community & Management');

  let spaceId, postId, commentId, reportId;

  await check('Admin A creates a discussion space', async () => {
    const { status, body } = await call('/community/spaces', {
      method: 'POST',
      token: tokenA,
      body: {
        name: `TypeScript Deep Dive ${unique()}`,
        description: 'Advanced types, modules, compilation',
        category: 'Programming',
        skills: ['typescript', 'javascript'],
      },
    });
    assert(status === 201, `expected 201, got ${status}`);
    spaceId = body._id;
    assert(spaceId, 'missing space _id');
  });

  await check('Learner B lists recommended spaces and matches typescript', async () => {
    // We will inject a skill into Learner B's CV model first
    const cvCollection = db.collection('cvs');
    await cvCollection.insertOne({
      userId: new mongoose.Types.ObjectId(userBId),
      skills: ['TypeScript', 'NodeJS'],
      createdAt: new Date(),
    });

    const { status, body } = await call('/community/spaces', { token: tokenB });
    assert(status === 200, `expected 200, got ${status}`);
    
    const space = body.find((s) => s._id === spaceId);
    assert(space, 'created space not in list');
    assert(space.recommended === true, 'space should be recommended due to skill match');
    assert(space.matchScore >= 3, `match score should be >= 3, got ${space.matchScore}`);
  });

  await check('Learner B creates a post in the space', async () => {
    const { status, body } = await call(`/community/spaces/${spaceId}/posts`, {
      method: 'POST',
      token: tokenB,
      body: {
        title: 'How to map type properties dynamically?',
        content: 'I want to build a dynamic mapping type using keyof and in operators...',
      },
    });
    assert(status === 201, `expected 201, got ${status}`);
    postId = body._id;
    assert(postId, 'missing post _id');
    assert(body.qualityScore === 1, 'post should start with qualityScore 1');
  });

  await check('Admin A upvotes Learner B\'s post', async () => {
    const { status, body } = await call(`/community/posts/${postId}/vote`, {
      method: 'PATCH',
      token: tokenA,
      body: { direction: 'up' },
    });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.qualityScore === 2, `expected qualityScore 2, got ${body.qualityScore}`);
  });

  await check('Learner B comments on their own post', async () => {
    const { status, body } = await call(`/community/posts/${postId}/comments`, {
      method: 'POST',
      token: tokenB,
      body: { content: 'Self-comment content for test' },
    });
    assert(status === 201, `expected 201, got ${status}`);
    commentId = body._id;
    assert(commentId, 'missing comment _id');
  });

  await check('Learner B reports Admin A\'s (mocked) post content', async () => {
    const { status, body } = await call('/community/report', {
      method: 'POST',
      token: tokenB,
      body: {
        contentType: 'comment',
        contentId: commentId,
        reason: 'Inappropriate language in test comment',
      },
    });
    assert(status === 201, `expected 201, got ${status}`);
    reportId = body._id;
    assert(reportId, 'missing report _id');
    assert(body.status === 'pending', 'report should start in pending status');
  });

  // ── 2. Resource Voting ────────────────────────────────────────────────
  section('2 · Resource Voting');

  let resourceId;

  await check('Learner B submits a learning resource', async () => {
    const { status, body } = await call('/resources', {
      method: 'POST',
      token: tokenB,
      body: {
        title: 'Effective TypeScript',
        description: '62 Specific Ways to Improve Your TypeScript',
        url: 'https://typescript-book.com',
        difficulty: 'intermediate',
        category: 'Programming',
        type: 'book',
        tags: ['typescript', 'programming'],
      },
    });
    assert(status === 201, `expected 201, got ${status}`);
    resourceId = body._id;
    assert(resourceId, 'missing resource _id');
    assert(body.score === 1, 'resource should start with score 1 (author upvote)');
  });

  await check('Admin A downvotes Learner B\'s resource', async () => {
    const { status, body } = await call(`/resources/${resourceId}/vote`, {
      method: 'PATCH',
      token: tokenA,
      body: { direction: 'down' },
    });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.score === 0, `expected score 0, got ${body.score}`);
  });

  await check('Learner B gets recommended resources matching their skills', async () => {
    const { status, body } = await call('/resources/recommend', { token: tokenB });
    assert(status === 200, `expected 200, got ${status}`);
    const found = body.find((r) => r._id === resourceId);
    assert(found, 'recommended resources should contain the TypeScript resource we submitted');
  });

  // ── 3. Mentor Network ──────────────────────────────────────────────────
  section('3 · Mentor Network');

  let sessionId;

  await check('Mentor C registers their profile details', async () => {
    const { status } = await call('/mentor/profiles', {
      method: 'POST',
      token: tokenC,
      body: {
        bio: 'Senior TypeScript Architect at TechCorp.',
        expertise: ['TypeScript', 'Node.js', 'Software Architecture'],
        industry: 'Software Engineering',
        experienceYears: 10,
        availability: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '12:00' }, // Monday
          { dayOfWeek: 3, startTime: '14:00', endTime: '16:00' }, // Wednesday
        ],
      },
    });
    assert(status === 201, `expected 201, got ${status}`);
  });

  await check('Learner B gets recommended mentors', async () => {
    const { status, body } = await call('/mentor/profiles/recommend', { token: tokenB });
    assert(status === 200, `expected 200, got ${status}`);
    const mentor = body.find((m) => m.userId._id === userCId);
    assert(mentor, 'recommended mentors should include Mentor C');
    assert(mentor.matchScore >= 40, `matchScore should be >= 40, got ${mentor.matchScore}`);
  });

  await check('Learner B books session with Mentor C inside availability slot', async () => {
    // Next Monday at 10:30 AM
    const scheduled = new Date();
    scheduled.setDate(scheduled.getDate() + ((1 + 7 - scheduled.getDay()) % 7 || 7)); // Next Monday
    scheduled.setHours(10, 30, 0, 0);

    const { status, body } = await call('/mentor/sessions', {
      method: 'POST',
      token: tokenB,
      body: {
        mentorId: userCId,
        scheduledAt: scheduled.toISOString(),
        notes: 'Help me master dynamic types',
      },
    });
    assert(status === 201, `expected 201, got ${status}`);
    sessionId = body._id;
    assert(sessionId, 'missing session _id');
    assert(body.status === 'pending', 'session should start as pending');
  });

  await check('Learner B fails to book session outside availability slot', async () => {
    // Next Monday at 1:00 PM
    const scheduled = new Date();
    scheduled.setDate(scheduled.getDate() + ((1 + 7 - scheduled.getDay()) % 7 || 7)); // Next Monday
    scheduled.setHours(13, 0, 0, 0);

    const { status } = await call('/mentor/sessions', {
      method: 'POST',
      token: tokenB,
      body: {
        mentorId: userCId,
        scheduledAt: scheduled.toISOString(),
        notes: 'Help me master dynamic types',
      },
    });
    assert(status === 400, `expected 400, got ${status}`);
  });

  await check('Learner B fails to book session due to double booking conflict', async () => {
    // Next Monday at 10:30 AM (same as booked session)
    const scheduled = new Date();
    scheduled.setDate(scheduled.getDate() + ((1 + 7 - scheduled.getDay()) % 7 || 7));
    scheduled.setHours(10, 30, 0, 0);

    const { status } = await call('/mentor/sessions', {
      method: 'POST',
      token: tokenB,
      body: {
        mentorId: userCId,
        scheduledAt: scheduled.toISOString(),
        notes: 'Second booking attempt',
      },
    });
    assert(status === 409, `expected 409 (conflict), got ${status}`);
  });

  await check('Mentor C accepts the pending booking', async () => {
    const { status, body } = await call(`/mentor/sessions/${sessionId}`, {
      method: 'PATCH',
      token: tokenC,
      body: { status: 'accepted' },
    });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.status === 'accepted', `status should be accepted, got ${body.status}`);
  });

  await check('Mentor C marks the session as completed', async () => {
    const { status, body } = await call(`/mentor/sessions/${sessionId}`, {
      method: 'PATCH',
      token: tokenC,
      body: { status: 'completed', feedback: 'Great session, focused on mapped types!' },
    });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.status === 'completed', `status should be completed, got ${body.status}`);
  });

  await check('Learner B rates Mentor C for completed session', async () => {
    const { status, body } = await call(`/mentor/sessions/${sessionId}/rate`, {
      method: 'POST',
      token: tokenB,
      body: {
        quality: 5,
        helpfulness: 5,
        expertise: 5,
        communication: 5,
        review: 'Absolutely amazing TypeScript expert!',
      },
    });
    assert(status === 201, `expected 201, got ${status}`);
    assert(body.rating === 5, `expected rating 5, got ${body.rating}`);

    // Verify mentor profile rating updated
    const profile = (await call(`/mentor/profiles/${userCId}`, { token: tokenB })).body;
    assert(profile.rating === 5, `expected mentor profile rating 5, got ${profile.rating}`);
    assert(profile.ratingCount === 1, `expected rating count 1, got ${profile.ratingCount}`);
  });

  // ── 4. Admin Dashboard & Analytics ──────────────────────────────────────
  section('4 · Admin Dashboard & Analytics');

  await check('Admin A lists users search filter', async () => {
    const { status, body } = await call('/admin/users?search=Learner', { token: tokenA });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.some((u) => u.email === testUserBEmail), 'learner user B should be in search results');
  });

  await check('Admin A views pending moderation reports', async () => {
    const { status, body } = await call('/admin/reports?status=pending', { token: tokenA });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.some((r) => r._id === reportId), 'pending report should be listed');
  });

  await check('Admin A resolves report (moderate content -> deletes comment)', async () => {
    const { status, body } = await call(`/admin/reports/${reportId}/resolve`, {
      method: 'PATCH',
      token: tokenA,
      body: { status: 'resolved', resolution: 'Inappropriate content removed.' },
    });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.status === 'resolved', `expected resolved, got ${body.status}`);

    // verify comment deleted
    const commentsCollection = db.collection('comments');
    const comment = await commentsCollection.findOne({ _id: new mongoose.Types.ObjectId(commentId) });
    assert(comment === null, 'comment was not deleted by resolving report');
  });

  await check('Admin A fetches business intelligence dashboard metrics', async () => {
    const { status, body } = await call('/admin/analytics', { token: tokenA });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.stats.totalUsers > 0, 'stats should contain totalUsers count');
    assert(Array.isArray(body.signupData), 'signupData should be an array');
    assert(Array.isArray(body.quizPassRates), 'quizPassRates should be an array');
  });

  await check('Admin A requests AI operational insights diagnostic report', async () => {
    const { status, body } = await call('/admin/analytics/insights', { token: tokenA });
    assert(status === 200, `expected 200, got ${status}`);
    assert(body.bottlenecks, 'insights should contain bottlenecks paragraph');
    assert(body.mentorshipStatus, 'insights should contain mentorshipStatus paragraph');
    assert(body.recommendations, 'insights should contain recommendations paragraph');
  });

  // ── Cleanup ──────────────────────────────────────────────────────────
  section('Cleanup test data');
  
  await check('delete created test records from DB', async () => {
    const idList = [userAId, userBId, userCId].map((id) => new mongoose.Types.ObjectId(id));
    await db.collection('users').deleteMany({ _id: { $in: idList } });
    await db.collection('cvs').deleteMany({ userId: { $in: idList } });
    await db.collection('discussion_spaces').deleteMany({ _id: new mongoose.Types.ObjectId(spaceId) });
    await db.collection('posts').deleteMany({ spaceId: new mongoose.Types.ObjectId(spaceId) });
    await db.collection('comments').deleteMany({ postId: new mongoose.Types.ObjectId(postId) });
    await db.collection('reports').deleteMany({ _id: new mongoose.Types.ObjectId(reportId) });
    await db.collection('learning_resources').deleteMany({ _id: new mongoose.Types.ObjectId(resourceId) });
    await db.collection('mentor_profiles').deleteMany({ userId: new mongoose.Types.ObjectId(userCId) });
    await db.collection('mentorship_sessions').deleteMany({ _id: new mongoose.Types.ObjectId(sessionId) });
    await db.collection('mentor_ratings').deleteMany({ sessionId: new mongoose.Types.ObjectId(sessionId) });
    await db.collection('audit_logs').deleteMany({ userId: { $in: idList } });
  });

  await mongoose.disconnect();

  console.log('\n────────────────────────────────────────────────────────────');
  console.log(`${passed} passed  ${failed} failed`);
  if (failed > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  • ${f.name}\n    ${f.message}`);
    }
    process.exit(1);
  } else {
    console.log('\nEverything checks out.');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal testing error:', err);
  process.exit(1);
});
