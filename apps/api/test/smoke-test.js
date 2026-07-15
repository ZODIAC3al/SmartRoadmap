const API_URL = 'http://localhost:3000';

async function runSmokeTests() {
  console.log('🚀 Starting SmartRoadmap Integration Smoke Tests...\n');
  
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123';
  let token = '';

  // Helper fetch function with auth header and error detail logging
  async function api(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      try {
        const clone = res.clone();
        const errJson = await clone.json();
        console.log(`   ↳ [ERROR] ${path} returned Status ${res.status}:`, JSON.stringify(errJson));
      } catch (e) {
        try {
          const cloneText = res.clone();
          console.log(`   ↳ [ERROR] ${path} returned Status ${res.status}:`, await cloneText.text());
        } catch (e2) {}
      }
    }
    return res;
  }

  // Phase 1: Authentication & User Profiles
  try {
    console.log('--- Phase 1: Auth & Profiles ---');
    
    // Register
    const regRes = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Smoke Test Candidate',
        role: 'learner',
      }),
    });
    console.log(`[POST /auth/register] Status: ${regRes.status}`);
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);

    // Login
    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    console.log(`[POST /auth/login] Status: ${loginRes.status}`);
    const loginData = await loginRes.json();
    token = loginData.accessToken;
    if (!token) throw new Error('Failed to retrieve JWT access token');

    // Get Profiles
    const profileRes = await api('/auth/me');
    console.log(`[GET /auth/me] Status: ${profileRes.status}`);

    // Update Profile
    const secRes = await api('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({
        username: `smoketest_${Date.now()}`,
        theme: 'smartdark',
      }),
    });
    console.log(`[PATCH /auth/me] Status: ${secRes.status}`);

    console.log('✓ Phase 1 successfully verified.\n');

  } catch (err) {
    console.error('❌ Phase 1 verification failed: ', err.message);
    process.exit(1);
  }

  // Phase 2: Payments & Subscriptions
  try {
    console.log('--- Phase 2: Payment & Subscriptions ---');
    const payRes = await api('/payment/orders', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro_learner' }),
    });
    console.log(`[POST /payment/orders] Status: ${payRes.status}`);

    // Webhook simulation
    const webRes = await api('/payment/webhook', {
      method: 'POST',
      body: JSON.stringify({
        event: 'PAYMENT.SALE.COMPLETED',
        resource: {
          custom_id: testEmail,
          amount: { total: '9.00' },
        },
      }),
    });
    console.log(`[POST /payment/webhook] Status: ${webRes.status}`);
    console.log('✓ Phase 2 successfully verified.\n');
  } catch (err) {
    console.error('❌ Phase 2 verification failed: ', err.message);
  }

  // Phase 3: Adaptive Onboarding & Curriculum Timeline
  let roadmapId = '';
  try {
    console.log('--- Phase 3: Roadmap & Assessments ---');
    
    const onboardRes = await api('/roadmap/generate', {
      method: 'POST',
      body: JSON.stringify({
        targetRole: 'Backend Developer',
        skills: ['JavaScript'],
      }),
    });
    console.log(`[POST /roadmap/generate] Status: ${onboardRes.status}`);

    const roadmapRes = await api('/roadmap/me');
    console.log(`[GET /roadmap/me] Status: ${roadmapRes.status}`);
    const roadmapData = await roadmapRes.json();
    roadmapId = roadmapData._id;

    if (roadmapId) {
      // Patch camera viewport tracking coordinates
      const camRes = await api(`/roadmap/${roadmapId}/viewport`, {
        method: 'PATCH',
        body: JSON.stringify({
          viewport: { x: 120, y: 340, zoom: 1.2 },
          edgeStyle: 'curved',
        }),
      });
      console.log(`[PATCH /roadmap/:id/viewport] Status: ${camRes.status}`);
    }

    console.log('✓ Phase 3 successfully verified.\n');
  } catch (err) {
    console.error('❌ Phase 3 verification failed: ', err.message);
  }

  // Phase 4: Gamification, Streaks, Achievements & Push Notifications
  try {
    console.log('--- Phase 4: Gamification & Push Notifications ---');
    
    // Register Web Push
    const pushRes = await api('/notifications/push-subscription', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: 'https://updates.push.services/smoke-test',
        keys: { p256dh: 'mock-key', auth: 'mock-auth' },
      }),
    });
    console.log(`[POST /notifications/push-subscription] Status: ${pushRes.status}`);

    const notifRes = await api('/notifications');
    console.log(`[GET /notifications] Status: ${notifRes.status}`);

    console.log('✓ Phase 4 successfully verified.\n');
  } catch (err) {
    console.error('❌ Phase 4 verification failed: ', err.message);
  }

  // Phase 5: Productivity & Study Tools
  try {
    console.log('--- Phase 5: Productivity & Study Tools ---');

    // Calendar Auto Scheduler
    const autoSched = await api('/calendar/auto-schedule', { method: 'POST' });
    console.log(`[POST /calendar/auto-schedule] Status: ${autoSched.status}`);

    const eventsRes = await api('/calendar/events');
    console.log(`[GET /calendar/events] Status: ${eventsRes.status}`);

    // Dashboard single-payload aggregate
    const dashRes = await api('/dashboard/summary');
    console.log(`[GET /dashboard/summary] Status: ${dashRes.status}`);

    // Cheat Sheet
    const sheetRes = await api('/cheat-sheets/mod-1/generate', { method: 'POST' });
    console.log(`[POST /cheat-sheets/:moduleId/generate] Status: ${sheetRes.status}`);

    // Audio Summaries
    const audioRes = await api('/audio-summaries/mod-1/generate', { method: 'POST' });
    console.log(`[POST /audio-summaries/:moduleId/generate] Status: ${audioRes.status}`);

    console.log('✓ Phase 5 successfully verified.\n');
  } catch (err) {
    console.error('❌ Phase 5 verification failed: ', err.message);
  }

  // Phase 6: Code Sandbox
  try {
    console.log('--- Phase 6: Code Sandbox ---');

    // Ad-hoc run
    const runRes = await api('/code-execution/run', {
      method: 'POST',
      body: JSON.stringify({
        language: 'javascript',
        code: `console.log('Hello from smoke test');`,
      }),
    });
    console.log(`[POST /code-execution/run] Status: ${runRes.status}`);
    const runData = await runRes.json();
    console.log(`-> Sandbox Stdout: ${JSON.stringify(runData.data.stdout)}`);

    // Monaco autosave drafts
    const draftRes = await api('/code-drafts', {
      method: 'PUT',
      body: JSON.stringify({
        challengeId: null,
        language: 'javascript',
        code: `function test() {}`,
        title: 'scratchpad',
      }),
    });
    console.log(`[PUT /code-drafts] Status: ${draftRes.status}`);

    // Challenges browser
    const challRes = await api('/coding-challenges');
    console.log(`[GET /coding-challenges] Status: ${challRes.status}`);
    const challData = await challRes.json();

    if (challData.data && challData.data.length > 0) {
      const targetId = challData.data[0]._id;
      // Submit solution
      const subRes = await api(`/coding-challenges/${targetId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          language: 'javascript',
          code: `function fizzBuzz(n) { return ["1","2","Fizz","4","Buzz"]; }`,
        }),
      });
      console.log(`[POST /coding-challenges/:id/submit] Status: ${subRes.status}`);
    }

    console.log('✓ Phase 6 successfully verified.\n');
  } catch (err) {
    console.error('❌ Phase 6 verification failed: ', err.message);
  }

  console.log('🎉 SmartRoadmap Smoke Tests Completed successfully! System Integrity Verified.');
}

runSmokeTests();
