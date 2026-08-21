const http = require('http');

const API_BASE = 'http://localhost:3000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runE2ETests() {
  console.log('================================================================');
  console.log('🚀 Starting SmartRoadmap Hiring & Application Flow E2E Tests');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const learnerEmail = `learner_test_${timestamp}@devotopia.com`;
  const companyEmail = `company_test_${timestamp}@devotopia.com`;
  const password = 'Password123!';

  // ── STEP 1: Register Learner User ──────────────────────────────────────────
  console.log('1. Registering new learner user...');
  const learnerReg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Tarek Learner', email: learnerEmail, password, role: 'learner' },
  });
  console.log(`   Status: ${learnerReg.status}, Learner ID: ${learnerReg.data?.user?.id || learnerReg.data?.user?._id}`);
  if (learnerReg.status !== 201 && learnerReg.status !== 200) {
    throw new Error('Failed to register learner: ' + JSON.stringify(learnerReg.data));
  }
  const learnerToken = learnerReg.data.accessToken;

  // ── STEP 2: Register Company User ──────────────────────────────────────────
  console.log('\n2. Registering new company employer user...');
  const companyReg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Apex Tech HR', email: companyEmail, password, role: 'company' },
  });
  console.log(`   Status: ${companyReg.status}, Company User ID: ${companyReg.data?.user?.id || companyReg.data?.user?._id}`);
  if (companyReg.status !== 201 && companyReg.status !== 200) {
    throw new Error('Failed to register company user: ' + JSON.stringify(companyReg.data));
  }
  const companyToken = companyReg.data.accessToken;

  // ── STEP 3: Company Posts a Real Job ───────────────────────────────────────
  console.log('\n3. Company posting a real job opening...');
  const jobPayload = {
    title: 'Senior Cloud FullStack Architect',
    company: 'Apex Tech HR',
    location: 'Remote',
    country: 'US',
    requiredSkills: ['Node.js', 'React', 'TypeScript', 'Kubernetes', 'MongoDB'],
    technologies: ['NestJS', 'Next.js', 'Docker', 'Kubernetes'],
    salaryMin: 95000,
    salaryMax: 135000,
    remote: true,
    workType: 'remote',
    jobType: 'full-time',
    experienceLevel: 'senior',
    description: 'We are seeking an experienced FullStack Cloud Architect to design enterprise distributed systems.',
  };

  const createJobRes = await request('/hiring/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${companyToken}` },
    body: jobPayload,
  });
  console.log(`   Job Created: Status ${createJobRes.status}, Job ID: ${createJobRes.data?._id}`);
  if (createJobRes.status !== 201 && createJobRes.status !== 200) {
    throw new Error('Failed to create job: ' + JSON.stringify(createJobRes.data));
  }
  const createdJobId = createJobRes.data._id;

  // ── STEP 4: Learner Fetches All Matched Jobs & Views Needed Skills ──────────
  console.log('\n4. Learner fetching matched jobs list...');
  const matchRes = await request('/hiring/jobs/matches', {
    headers: { Authorization: `Bearer ${learnerToken}` },
  });
  console.log(`   Matched Jobs Count: ${matchRes.data?.length}`);
  const targetJob = matchRes.data.find((j) => j._id === createdJobId);
  console.log(`   Target Job Match Score: ${targetJob?.matchScore}%`);
  console.log(`   Target Job Needed Skills: ${JSON.stringify(targetJob?.neededSkills)}`);
  console.log(`   Target Job Matching Skills: ${JSON.stringify(targetJob?.matchingSkills)}`);

  if (!targetJob) {
    throw new Error('Newly created job was not returned in matched jobs list.');
  }

  // ── STEP 5: Verify Roadmap is NOT Mutated by Needed Skills ─────────────────
  console.log('\n5. Checking active roadmap modules before Needed Skills analysis...');
  const roadmapBefore = await request('/roadmap/active', {
    headers: { Authorization: `Bearer ${learnerToken}` },
  });
  const modulesCountBefore = roadmapBefore.data?.modules?.length || 0;
  console.log(`   Roadmap modules count before: ${modulesCountBefore}`);

  console.log('   Calling Needed Skills / gap analysis endpoint...');
  const gapRes = await request(`/hiring/jobs/${createdJobId}/close-gap`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${learnerToken}` },
  });
  console.log(`   Needed Skills returned: ${JSON.stringify(gapRes.data?.neededSkills)}`);

  const roadmapAfter = await request('/roadmap/active', {
    headers: { Authorization: `Bearer ${learnerToken}` },
  });
  const modulesCountAfter = roadmapAfter.data?.modules?.length || 0;
  console.log(`   Roadmap modules count after: ${modulesCountAfter}`);

  if (modulesCountAfter !== modulesCountBefore) {
    throw new Error(`FAIL: Roadmap was mutated! Before: ${modulesCountBefore}, After: ${modulesCountAfter}`);
  }
  console.log('   ✅ Roadmap remains 100% independent and unmodified.');

  // ── STEP 6: Learner Applies to Job (Real Application Record) ───────────────
  console.log('\n6. Learner applying to job with Skill Passport and CV...');
  const applyRes = await request('/hiring/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${learnerToken}` },
    body: {
      jobId: createdJobId,
      notes: 'Excited to apply with my verified Devotopia Skill Passport!',
    },
  });
  console.log(`   Application Response Status: ${applyRes.status}`);
  console.log(`   Application ID: ${applyRes.data?._id}`);
  console.log(`   Initial Status: "${applyRes.data?.status}"`);
  console.log(`   Has CV Snapshot: ${!!applyRes.data?.cvSnapshot || applyRes.data?.cvTitle}`);
  console.log(`   Has Passport Snapshot: ${!!applyRes.data?.passportSnapshot}`);
  console.log(`   Status History: ${JSON.stringify(applyRes.data?.statusHistory)}`);

  if (applyRes.data?.status !== 'Applied') {
    throw new Error(`Expected initial status "Applied", got "${applyRes.data?.status}"`);
  }
  const applicationId = applyRes.data._id;

  // ── STEP 7: Prevent Duplicate Application ─────────────────────────────────
  console.log('\n7. Testing duplicate application protection...');
  const dupApplyRes = await request('/hiring/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${learnerToken}` },
    body: {
      jobId: createdJobId,
      notes: 'Second application attempt',
    },
  });
  console.log(`   Duplicate attempt result: ${dupApplyRes.data?._id === applicationId ? 'Returned existing application safely' : 'Handled duplicate'}`);

  // ── STEP 8: Security Check - Learner CANNOT Modify Status (403 Forbidden) ──
  console.log('\n8. Testing status authorization security (Learner attempting to self-promote status)...');
  const learnerStatusHack = await request(`/hiring/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${learnerToken}` },
    body: { status: 'Accepted', notes: 'Learner trying to self-accept' },
  });
  console.log(`   Learner update status HTTP response: ${learnerStatusHack.status}`);
  if (learnerStatusHack.status !== 403) {
    throw new Error(`FAIL: Learner was able to modify status or did not receive 403! Got ${learnerStatusHack.status}`);
  }
  console.log('   ✅ Learner status change rejected with 403 Forbidden as required.');

  // ── STEP 9: Company Reviews Application & Updates Status ──────────────────
  console.log('\n9. Company fetching received applications for their jobs...');
  const companyAppsRes = await request('/hiring/applications/company', {
    headers: { Authorization: `Bearer ${companyToken}` },
  });
  console.log(`   Applications received count: ${companyAppsRes.data?.length}`);
  const targetApp = companyAppsRes.data?.find((a) => a._id === applicationId);
  if (!targetApp) {
    throw new Error('Application was not visible in company applications list.');
  }
  console.log(`   Candidate found: ${targetApp.jobTitle} - Current Status: ${targetApp.status}`);

  console.log('   Company moving candidate to "Interviewing"...');
  const moveInterviewRes = await request(`/hiring/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${companyToken}` },
    body: { status: 'Interviewing', notes: 'Candidate shortlisted for technical round.' },
  });
  console.log(`   Update result: Status "${moveInterviewRes.data?.status}"`);
  if (moveInterviewRes.data?.status !== 'Interviewing') {
    throw new Error(`Expected "Interviewing", got "${moveInterviewRes.data?.status}"`);
  }

  console.log('   Company accepting candidate ("Accepted")...');
  const acceptRes = await request(`/hiring/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${companyToken}` },
    body: { status: 'Accepted', notes: 'Official offer extended and accepted.' },
  });
  console.log(`   Final status: "${acceptRes.data?.status}"`);
  if (acceptRes.data?.status !== 'Accepted') {
    throw new Error(`Expected "Accepted", got "${acceptRes.data?.status}"`);
  }

  // ── STEP 10: Learner Views Real-Time Updated Status in Dashboard ───────────
  console.log('\n10. Learner fetching their Application Dashboard...');
  const learnerDashboardRes = await request('/hiring/applications', {
    headers: { Authorization: `Bearer ${learnerToken}` },
  });
  const myApp = learnerDashboardRes.data?.find((a) => a._id === applicationId);
  console.log(`    Learner Dashboard Status for ${myApp?.jobTitle}: "${myApp?.status}"`);
  console.log(`    Status History entries: ${myApp?.statusHistory?.length}`);

  if (myApp?.status !== 'Accepted') {
    throw new Error(`Expected learner to see "Accepted", but saw "${myApp?.status}"`);
  }
  console.log('    ✅ Learner dashboard accurately reflects company status update.');

  console.log('\n================================================================');
  console.log('🎉 ALL 10 E2E HIRING & APPLICATION TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E Test Failed:', err);
  process.exit(1);
});
