/**
 * Devotopia — ITI Project Documentation.
 * Section numbering follows "Documentation Template.docx" exactly.
 */
const fs = require('fs');
const path = require('path');
const {
  AlignmentType, Document, Packer, Paragraph, TableOfContents, TextRun, PageBreak,
} = require('docx');
const {
  numbering, styles, P, H1, H2, H3, Bullet, BulletLead, Num, Tbl, ActionBox, Spacer, Figure, Logo, Headers, MUTED,
} = require('./shared');
const DIAG = process.env.DIAG_DIR;
const LOGO = process.env.LOGO_PATH;

const OUT = process.argv[2];
const c = [];

// ══════════════════════════ COVER ══════════════════════════════════════════
// The ITI mark sits in the page header (top-left) on every page; the cover
// therefore only needs the project logo placeholder.
c.push(new Paragraph({ spacing: { after: 760 }, children: [] }));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: '< Project Logo >', color: MUTED, size: 20 })],
}));
c.push(new Paragraph({ spacing: { after: 620 }, children: [] }));
c.push(new Paragraph({ text: 'Devotopia', heading: 'Title' }));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: 'Verified Skill Roadmaps', size: 30, color: '4F46E5' })],
}));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 700 },
  children: [new TextRun({
    text: 'AI career-preparation platform that turns a target job role into a personalised\nlearning roadmap and verifies every skill with an adaptive exam.',
    size: 21, color: MUTED, italics: true,
  })],
}));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 300 },
  children: [new TextRun({ text: 'Project Documentation', size: 26, bold: true })],
}));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 140 },
  children: [new TextRun({ text: 'Prepared by:', bold: true, size: 22 })],
}));
[
  'Ali Maher  —  Open Source Track  —  Project Leader',
  'Mohamed El-Saeed  —  Open Source Track',
  'Nada Nasr  —  Open Source Track',
  'Marina George  —  Open Source Track',
].forEach((n) => c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: n, size: 21 })],
})));
c.push(new Paragraph({ spacing: { after: 240 }, children: [] }));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: 'Project Supervisor:  < Supervisor Name >', size: 21, color: MUTED })],
}));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: 'Intake:  < Intake no. >          Date:  < Date >', size: 21, color: MUTED })],
}));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ══════════════════════════ TOC ════════════════════════════════════════════
c.push(H1('Table of Contents'));
c.push(new TableOfContents('Contents', { hyperlinks: true, headingStyleRange: '1-3' }));
c.push(new Paragraph({
  spacing: { before: 200 },
  children: [new TextRun({
    text: 'Right-click the table above in Word and choose "Update Field" to populate page numbers.',
    italics: true, size: 18, color: MUTED,
  })],
}));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ══════════════════════════ 1. INTRODUCTION ════════════════════════════════
c.push(H1('1. Introduction'));

c.push(H2('1.1 Background (Problem)'));
P0 = (t) => c.push(P(t));
P0('Egyptian computer-science graduates and self-taught juniors enter a hiring market where every CV claims skills that nobody has verified. Two failures compound each other, one on each side of the market.');
c.push(H3('The learner\'s problem'));
P0('A learner picks a target role such as "Full-Stack Developer" and then assembles a curriculum themselves from scattered YouTube playlists and course catalogues. That self-assembled path has no ordering, no prerequisites, and no signal telling the learner that a topic is actually finished. When they fail to grasp something, nothing adapts: the same material is served again, and they stall on the same wall for weeks.');
c.push(H3('The employer\'s problem'));
P0('Recruiters receive hundreds of CVs listing identical keywords with no evidence behind any of them. Junior screening therefore collapses into guesswork, and capable graduates are filtered out alongside unprepared ones.');
P0('The cost is months of misdirected study for the learner, and an expensive, low-signal screening funnel for the company.');
c.push(Spacer());
c.push(ActionBox('To strengthen this section before submission', [
  'The presentation guidelines ask you to open with statistics and expert quotations. Add 2–3 cited figures here — for example Egypt\'s ICT graduate unemployment rate, average time-to-first-job for CS graduates, or the average cost-per-hire for a junior developer.',
  'Cite the source and year for each figure. Assessors weight "problem significance" heavily, and an uncited number is worth less than no number at all.',
]));

c.push(H2('1.2 Purpose'));
P0('The purpose of Devotopia is to replace self-claimed skills with verified ones, and to make the verification useful to both sides of the market at once.');
c.push(Bullet('For the learner: generate an ordered, prerequisite-aware curriculum from a stated target role, and gate each step behind an adaptive exam so progress means demonstrated ability rather than attendance.'));
c.push(Bullet('For the employer: expose the resulting record as a searchable candidate pipeline ranked by measured exam performance instead of CV keywords.'));
c.push(Bullet('For both: close the loop, so that a gap found against a real job posting can be injected straight back into the learner\'s roadmap.'));

c.push(H2('1.3 Previous Work Done (Competitors Analysis)'));
P0('The table below compares Devotopia against the closest products in each direction — a global course marketplace, a global learn-and-hire platform, a community roadmap site, and a regional player.');
c.push(Tbl(
  ['Product', 'What it does', 'Key limitation', 'How Devotopia differs'],
  [
    ['Coursera', 'Global course marketplace with professional certificates and a separate hiring product.',
     'Sells a catalogue; the learner picks the courses. The certificate proves attendance, and the final assessment is identical for everyone and retakeable until passed.',
     'Generates the curriculum itself from a target role and its prerequisites, and gates each module behind an exam whose difficulty moves with the learner\'s answers.'],
    ['LinkedIn Learning + Skill Assessments', 'Courses, badge-style skill quizzes, and a jobs marketplace in one account.',
     'The quiz is a fixed 15-question test decoupled from any learning path; a failed attempt is simply hidden.',
     'The exam is tied to a specific module in a specific roadmap, and failing rewrites the roadmap with a remedial module built from the missed questions.'],
    ['roadmap.sh', 'Community-authored static roadmaps for common developer roles.',
     'Roadmaps are the same for everyone and progress is self-ticked — there is no verification at all.',
     'Roadmaps are generated per learner from their stated skills, and each node is verified rather than self-ticked.'],
    ['Almentor / Udacity Arabia', 'Regional course platforms with Arabic content and nanodegree tracks.',
     'Cohort-priced and instructor-paced; assessment is project review, not adaptive testing, and there is no employer-facing pipeline.',
     'Self-paced and individually priced, with an automated adaptive assessment and a recruiter-facing verified pipeline.'],
  ],
  [14, 26, 30, 30],
));
c.push(Spacer());
P0('The distinguishing mechanism across all four is the same: competitors verify by attendance or by a fixed test, while Devotopia verifies by an adaptive exam whose result is weighted by the difficulty the learner actually faced, and feeds failure back into the curriculum.');

c.push(H2('1.4 Customers\' Analysis'));
P0('This section must report how customer needs were investigated and what the investigation found. The structure below is ready for your data.');
c.push(H3('1.4.1 Method'));
c.push(Bullet('Instrument: online questionnaire distributed to CS students and fresh graduates, plus semi-structured interviews with hiring contacts.'));
c.push(Bullet('Population: final-year and recently graduated CS/IS students; junior-hiring decision makers at software companies.'));
c.push(Bullet('Sample size: < n = ? > learners and < n = ? > employers.'));
c.push(Bullet('Period: < start date > to < end date >.'));
c.push(H3('1.4.2 Findings'));
c.push(Tbl(
  ['#', 'Question asked', 'Result', 'Design decision it drove'],
  [
    ['1', 'How do you currently decide what to learn next?', '< % >', 'Confirms the need for a generated, ordered roadmap.'],
    ['2', 'Have you abandoned a learning path before finishing?', '< % >', 'Motivates the remedial loop instead of a repeated module.'],
    ['3', 'Would a verified skill record help you get interviews?', '< % >', 'Motivates the skill passport and public profile.'],
    ['4', '(Employers) How do you currently screen junior CVs?', '< % >', 'Motivates the ranked candidate pipeline.'],
    ['5', 'Would you pay for AI-generated roadmaps and exams?', '< % >', 'Sets the consumer subscription price point.'],
  ],
  [5, 37, 16, 42],
));
c.push(Spacer());
c.push(ActionBox('This section needs your real data — do not submit it as-is', [
  'Every value above is a placeholder. Fill in the actual counts and percentages from your questionnaire, and insert the charts (bar or pie) that the guidelines explicitly ask for.',
  'If you have not run the questionnaire yet, run it before the defence even at a small sample. A stated n = 40 with real numbers is defensible; invented percentages are not, and assessors do ask how the data was collected.',
  'If you have already spoken to a real company or a real learner cohort, name them here. The guidelines say a single verified customer contact carries more weight than any other evidence in this section.',
]));

c.push(H2('1.5 Scope'));
c.push(H3('1.5.1 In scope'));
c.push(BulletLead('Adaptive learning', 'AI roadmap generation, adaptive assessment, remedial module injection, prerequisite unlocking, certification on track completion.'));
c.push(BulletLead('Talent profile', 'CV upload and parsing, AI bullet enhancement, verified skill passport, shield badges, public portfolio.'));
c.push(BulletLead('Hiring', 'Job listings, skill-gap matching, gap closing back into the roadmap, company candidate pipeline.'));
c.push(BulletLead('Engagement', 'Streaks, achievements, study calendar, community discussion spaces, mentors and mentorship sessions, in-app messaging and notifications.'));
c.push(BulletLead('Support systems', 'AI study chatbot, semantic search over resources, coding-challenge sandbox, mock interview, audio summaries.'));
c.push(BulletLead('Platform', 'Bilingual Arabic/English with RTL, light and dark themes, PWA install, subscription billing, admin moderation.'));
c.push(H3('1.5.2 Out of scope'));
c.push(Bullet('Live proctoring or identity verification during exams.'));
c.push(Bullet('Native mobile applications — the product ships as a responsive PWA.'));
c.push(Bullet('Automated job scraping from external boards; job records are seeded and company-posted.'));
c.push(Bullet('Payroll, contracts, or any post-hire HR process.'));

c.push(H2('1.6 Stakeholders / Beneficiaries'));
c.push(Tbl(
  ['Stakeholder', 'What they need', 'Impact of the system'],
  [
    ['Learners (primary)', 'An ordered curriculum for a named role and proof of skill a recruiter will accept.', 'Study time is directed by prerequisites rather than guesswork, and each pass produces evidence they can show.'],
    ['Career switchers', 'A path that starts from existing knowledge rather than from zero.', 'Generation takes current skills as input, so known material is not repeated.'],
    ['Employers / recruiters', 'A way to screen juniors on evidence rather than keywords.', 'Candidates are ranked by measured exam performance, reducing screening cost and false negatives.'],
    ['Mentors', 'A structured way to advise learners and run sessions.', 'Mentor profiles, ratings, and session booking are part of the platform.'],
    ['Bootcamps / training centres', 'Measurable per-skill outcomes for a cohort.', 'Verified skills provide outcome evidence beyond attendance certificates.'],
    ['Platform administrators', 'Moderation and oversight.', 'Admin dashboard for users, content, reports, audit logs, and analytics.'],
  ],
  [22, 34, 44],
));

c.push(H2('1.7 Business Model'));
P0('Two subscriptions, both collected through PayPal. The price is resolved server-side from the plan name, so a tampered checkout request cannot alter the amount charged.');
c.push(Tbl(
  ['Plan', 'Audience', 'Price (USD)', 'Includes'],
  [
    ['Free', 'New learners', '0', 'One roadmap, a limited number of adaptive exams, community access.'],
    ['Pro Learner', 'Serious learners', '19.99 / month', 'Unlimited roadmap generation and exams, CV enhancement, certificate export, vector job matching.'],
    ['Company Tier', 'Employers', '99.99 / month', 'Verified-candidate pipeline, candidate search and filtering, job postings.'],
  ],
  [16, 22, 18, 44],
));
c.push(Spacer());
c.push(H3('1.7.1 Route to the first 100 customers'));
c.push(Num('Our own graduating cohort — a single demo session reaches 100+ students, offered free Pro accounts for a semester in exchange for usage data and a reference.'));
c.push(Num('Student bodies that already run career-prep tracks — IEEE, GDG on Campus and ACM chapters in Alexandria and Cairo, each reaching several hundred students per event.'));
c.push(Num('Software houses in Alexandria and Smart Village that already hire from those cohorts, offered the verified-candidate pipeline free for three months in exchange for a reference.'));
c.push(Spacer());
c.push(H3('1.7.2 Cost structure'));
c.push(Bullet('AI inference: approximately 200 USD per month at 1,000 active learners, based on the current model mix.'));
c.push(Bullet('Infrastructure: MongoDB Atlas, Qdrant, Redis, and container hosting.'));
c.push(Bullet('Media and email: Cloudinary and Resend, both usage-priced.'));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ══════════════════════════ 2. REQUIREMENTS ════════════════════════════════
c.push(H1('2. Requirements'));

c.push(H2('2.1 User / Functional Requirements'));
c.push(H3('2.1.1 List of Functional Requirements'));
c.push(Tbl(
  ['ID', 'Requirement', 'Actor', 'Priority'],
  [
    ['FR-01', 'Register and authenticate with email/password or Google identity.', 'All', 'Must'],
    ['FR-02', 'Capture target role, education, experience and current skills during onboarding.', 'Learner', 'Must'],
    ['FR-03', 'Generate a dependency-ordered roadmap of modules with hour estimates and canvas coordinates.', 'Learner', 'Must'],
    ['FR-04', 'Start an adaptive exam for an unlocked module.', 'Learner', 'Must'],
    ['FR-05', 'Adjust question difficulty from the learner\'s recent answer streak.', 'System', 'Must'],
    ['FR-06', 'Score the exam weighted by the difficulty faced and apply the 70% pass threshold.', 'System', 'Must'],
    ['FR-07', 'Unlock dependent modules when a module is passed.', 'System', 'Must'],
    ['FR-08', 'Generate and inject a remedial module built from the missed topics on failure.', 'System', 'Must'],
    ['FR-09', 'Issue a track certificate when every module in a track is completed.', 'System', 'Must'],
    ['FR-10', 'Upload a résumé PDF and parse it into a structured profile.', 'Learner', 'Must'],
    ['FR-11', 'Enhance CV experience bullets using AI.', 'Learner', 'Should'],
    ['FR-12', 'Display a verified skill passport with badges and share it publicly.', 'Learner', 'Must'],
    ['FR-13', 'Match verified skills against job requirements and show the gap.', 'Learner', 'Must'],
    ['FR-14', 'Inject missing job requirements back into the roadmap ("close gap").', 'Learner', 'Should'],
    ['FR-15', 'Post jobs and browse the ranked candidate pipeline.', 'Company', 'Must'],
    ['FR-16', 'Ask the AI study assistant questions grounded in retrieved material.', 'Learner', 'Should'],
    ['FR-17', 'Solve coding challenges in a sandboxed execution environment.', 'Learner', 'Should'],
    ['FR-18', 'Book and rate mentorship sessions.', 'Learner / Mentor', 'Should'],
    ['FR-19', 'Participate in community discussion spaces and report content.', 'Learner', 'Should'],
    ['FR-20', 'Track streaks, achievements and study activity analytics.', 'Learner', 'Should'],
    ['FR-21', 'Subscribe to a paid plan and have entitlement applied.', 'Learner / Company', 'Must'],
    ['FR-22', 'Moderate users, content and reports; view audit logs and analytics.', 'Admin', 'Must'],
    ['FR-23', 'Switch interface language (AR/EN) and theme (light/dark).', 'All', 'Must'],
  ],
  [8, 52, 20, 12],
));

c.push(H2('2.2 Use Cases'));
c.push(H3('2.2.1 Actors'));
c.push(Tbl(
  ['Actor', 'Description', 'Access'],
  [
    ['Learner', 'Studies a roadmap, sits exams, builds a verified profile.', 'Own roadmap, exams, CV, passport, jobs, community.'],
    ['Company / Recruiter', 'Posts jobs and screens verified candidates.', 'Candidate pipeline, job postings, own company profile.'],
    ['Mentor', 'Advises learners and runs mentorship sessions.', 'Mentor profile, session scheduling, ratings.'],
    ['Admin', 'Operates and moderates the platform.', 'All users, content, reports, audit logs, analytics.'],
    ['AI Services (external)', 'LLM, embedding, speech and vector-search providers.', 'Invoked by the server only, never by the client.'],
    ['PayPal (external)', 'Processes subscription payments and webhooks.', 'Payment creation, capture, webhook verification.'],
  ],
  [22, 42, 36],
));
c.push(H3('2.2.2 List of Use Cases'));
c.push(Tbl(
  ['ID', 'Use Case', 'Primary Actor', 'Brief description'],
  [
    ['UC-01', 'Register / Log in', 'All', 'Create an account or authenticate; receive access and refresh tokens.'],
    ['UC-02', 'Complete onboarding', 'Learner', 'Provide target role, education, experience and skills.'],
    ['UC-03', 'Generate roadmap', 'Learner', 'System produces an ordered module tree for the stated role.'],
    ['UC-04', 'Take adaptive exam', 'Learner', 'Answer five questions whose difficulty adapts to performance.'],
    ['UC-05', 'Pass module', 'System', 'Unlock dependent modules and record a verified skill.'],
    ['UC-06', 'Fail module', 'System', 'Generate and insert a remedial module from missed topics.'],
    ['UC-07', 'Earn certificate', 'Learner', 'Receive a track credential once all modules are passed.'],
    ['UC-08', 'Build CV', 'Learner', 'Upload and parse a résumé; enhance bullets with AI.'],
    ['UC-09', 'View skill passport', 'Learner', 'See and share verified milestones and badges.'],
    ['UC-10', 'Match to job', 'Learner', 'Compare verified skills to job requirements and view the gap.'],
    ['UC-11', 'Close skill gap', 'Learner', 'Inject missing requirements into the roadmap.'],
    ['UC-12', 'Post job', 'Company', 'Publish a role with required skills.'],
    ['UC-13', 'Screen candidates', 'Company', 'Browse candidates ranked by verified performance.'],
    ['UC-14', 'Book mentorship', 'Learner', 'Request and rate a session with a mentor.'],
    ['UC-15', 'Ask study assistant', 'Learner', 'Get grounded answers about the current module.'],
    ['UC-16', 'Solve coding challenge', 'Learner', 'Submit code and run it in a sandbox.'],
    ['UC-17', 'Subscribe', 'Learner / Company', 'Pay for a plan and receive entitlement.'],
    ['UC-18', 'Moderate platform', 'Admin', 'Handle reports, manage users and review audit logs.'],
  ],
  [8, 22, 18, 52],
));
c.push(H3('2.2.3 Use Case Diagram'));
P0('The diagram below shows the four human actors against the system boundary. Solid lines are associations; dashed arrows are «include» relationships, showing the outcomes the system derives automatically once an exam is submitted.');
c.push(...Figure(`${DIAG}/use-case-diagram.png`, 'Figure 2.1 — Use Case Diagram'));

c.push(H2('2.3 Classes'));
c.push(H3('2.3.1 List of Classes'));
P0('The domain is persisted as 49 Mongoose schemas. The principal entities are listed below; the remainder support community, messaging, mentorship, portfolio and administration.');
c.push(Tbl(
  ['Class', 'Key attributes', 'Relationships'],
  [
    ['User', 'email, passwordHash, name, role, provider, plan, subscriptionStatus, isVerified, tokensValidFrom', 'Owns CV, Roadmap; has many QuizSession, Payment, Notification, Message.'],
    ['Roadmap', 'userId, title, targetRole, totalEstimatedHours, status, modules[]', 'Belongs to User; contains ModuleItem sub-documents.'],
    ['ModuleItem', 'id, title, description, difficulty, estimatedHours, topics[], prerequisites[], status, positionX, positionY', 'Embedded in Roadmap; referenced by QuizSession.'],
    ['QuizSession', 'userId, moduleId, status, score, passed, answers[]', 'Belongs to User; references a ModuleItem.'],
    ['QuizAnswer', 'question, userAnswer, correct, difficulty, timeTaken', 'Embedded in QuizSession.'],
    ['UserTopicResult', 'userId, trackId, topicId, attempts, failedAttempts, failPercentage, lastScore, status', 'Drives the remedial trigger.'],
    ['CV', 'userId, personal, experience[], education[], skills[], projects[], references[]', 'One per User.'],
    ['Job', 'title, company, location, requiredSkills[], salaryMin, salaryMax, remote', 'Matched against verified skills.'],
    ['TrackCertification', 'userId, certificateId, trackTitle, issuedAt', 'Issued when a track completes.'],
    ['Payment', 'userId, paypalOrderId, amount, status, plan', 'Belongs to User.'],
    ['Streak / UserAchievement', 'userId, current, longest, lastActiveAt / achievementId, earnedAt', 'Written by exam and activity events.'],
    ['MentorProfile / MentorshipSession', 'userId, expertise[], rating / mentorId, learnerId, scheduledAt, status', 'Connects Learner and Mentor.'],
  ],
  [22, 44, 34],
));
c.push(Spacer());
c.push(...Figure(`${DIAG}/class-diagram.png`, 'Figure 2.2 — Class Diagram (core domain, with multiplicities)'));

c.push(H2('2.4 Non-Functional Requirements'));
c.push(H3('2.4.1 Performance Requirements'));
c.push(Tbl(
  ['Attribute', 'Requirement', 'How it is met', 'Measured result'],
  [
    ['Page performance', 'Largest Contentful Paint under 2.5 s on public pages.', 'Route-level code splitting; charting and animation libraries loaded after first paint.', 'LCP 196–272 ms measured on the production build.'],
    ['Payload', 'Keep first-load JavaScript small enough for a mid-range connection.', 'Recharts and Framer Motion moved out of the initial bundle.', 'Dashboard reduced 316 kB → 161 kB; quiz 243 kB → 131 kB.'],
    ['Responsiveness', 'No main-thread task long enough to block input.', 'Deferred hydration of heavy widgets.', 'Longest task 0 ms on the measured routes.'],
    ['Visual stability', 'Cumulative Layout Shift below 0.1.', 'Skeletons reserve the exact height of deferred content.', 'CLS 0 on all measured routes.'],
    ['Availability', 'Remain usable when an external provider fails.', 'Provider fallback chain ending in a deterministic mock; in-memory queue fallback; RAG mock mode.', 'Verified: all three AI providers failed simultaneously and the application continued to operate.'],
    ['Security', 'Authenticated by default; role and ownership enforced server-side.', 'Global JwtAuthGuard, RolesGuard, ownership assertions, bcrypt at 12 rounds, httpOnly refresh cookies, Helmet headers.', '44-check smoke suite plus 38 end-to-end tests passing.'],
    ['Rate limiting', 'Resist credential stuffing and abuse.', 'Global throttler with a stricter budget on authentication routes.', '15 requests/min on auth, 100 elsewhere.'],
    ['Scalability', 'Absorb load spikes on generation without blocking requests.', 'Remedial generation dispatched to a BullMQ queue.', 'Queue with in-memory fallback when Redis is absent.'],
    ['Usability', 'Full Arabic and English support.', 'Logical CSS properties and RTL layout switching across all screens.', 'Both locales verified on every major screen.'],
  ],
  [16, 24, 34, 26],
));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ══════════════════════════ 3. OBJECTIVES ══════════════════════════════════
c.push(H1('3. Objectives / List of Services (measurable)'));
P0('Each objective below is stated with the measure that decides whether it was met.');
c.push(Tbl(
  ['#', 'Objective / Service', 'Measure', 'Status'],
  [
    ['O-01', 'Generate a personalised roadmap from a target role.', 'A roadmap with ordered modules, prerequisites and hour estimates is produced in a single request.', 'Achieved'],
    ['O-02', 'Adapt question difficulty to the learner.', 'Difficulty moves one step after two consecutive correct or incorrect answers.', 'Achieved'],
    ['O-03', 'Score by difficulty rather than question count.', 'Weights applied: easy 1.0, medium 1.5, hard 2.0.', 'Achieved'],
    ['O-04', 'Gate progression on demonstrated ability.', 'Pass threshold fixed at 70% of weighted score.', 'Achieved'],
    ['O-05', 'Never leave a failing learner stuck.', 'A remedial module is generated once a topic\'s running fail percentage reaches 30%.', 'Achieved'],
    ['O-06', 'Unlock the curriculum automatically.', 'Dependent modules move out of "locked" on a pass, following the prerequisite graph.', 'Achieved'],
    ['O-07', 'Issue verifiable credentials.', 'A track certificate is issued automatically when all modules are completed.', 'Achieved'],
    ['O-08', 'Structure a résumé automatically.', 'An uploaded PDF is parsed into personal, experience, education, projects and skills.', 'Achieved'],
    ['O-09', 'Quantify job fit.', 'Verified skills are compared to a posting\'s requirements and the gap is listed.', 'Achieved'],
    ['O-10', 'Close a skill gap in one action.', 'Missing requirements are injected into the roadmap as new modules.', 'Achieved'],
    ['O-11', 'Rank candidates on evidence.', 'The company pipeline orders candidates by exam performance and completion rate.', 'Achieved'],
    ['O-12', 'Degrade instead of failing when AI is unavailable.', 'Five-provider chain terminating in a deterministic mock; verified under total provider failure.', 'Achieved'],
    ['O-13', 'Serve both languages equally.', 'Arabic and English across every screen with RTL layout switching.', 'Achieved'],
    ['O-14', 'Keep the interface fast.', 'LCP under 300 ms and CLS of 0 on measured public routes.', 'Achieved'],
    ['O-15', 'Enforce authorization server-side.', 'Deny-by-default guard, role checks and ownership assertions; 44 security checks passing.', 'Achieved'],
    ['O-16', 'Charge correctly and safely.', 'Plan price resolved server-side; webhook signature verified before entitlement changes.', 'Achieved'],
  ],
  [7, 33, 46, 14],
));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ══════════════════════════ 4. DESIGN OVERVIEW ═════════════════════════════
c.push(H1('4. Design Overview'));

c.push(H2('4.1 System Architecture'));
P0('The system is a Turborepo monorepo with three packages: a Next.js client, a NestJS API, and a shared package of Zod schemas and TypeScript types that keeps the request/response contract synchronised across both.');
c.push(...Figure(`${DIAG}/architecture.png`, 'Figure 4.1 — System Architecture'));
c.push(H3('4.1.1 Layer responsibilities'));
c.push(BulletLead('Presentation (apps/web)', 'Next.js App Router with 24 page routes, Tailwind and DaisyUI styling, client-side state in Redux Toolkit, charts and animation loaded on demand.'));
c.push(BulletLead('Application (apps/api)', 'NestJS with 40 feature modules and 118 mapped HTTP routes; modular dependency injection, guards, interceptors and DTO validation at the boundary.'));
c.push(BulletLead('Domain', 'Business rules that determine a learner\'s outcome — difficulty selection, weighted scoring, pass/fail, prerequisite unlocking, remedial triggering — implemented as deterministic, unit-tested code rather than delegated to a model.'));
c.push(BulletLead('Data', 'MongoDB for application state, Qdrant for vector retrieval, Redis behind the job queue.'));
c.push(BulletLead('Integration', 'All third-party calls are server-side; no provider key is ever exposed to the browser.'));
c.push(Spacer());
c.push(H3('4.1.2 Key design decision'));
P0('The language model generates content — the curriculum, the questions, the remedial material, CV phrasing. It never decides control flow. Every branch that determines a learner\'s outcome is deterministic application code, which is what makes those rules unit-testable and what allows the product to keep working when every AI provider is unavailable.');

c.push(H2('4.2 Data Design (Entity Relationship Diagram)'));
P0('Principal relationships between the core entities:');
c.push(Tbl(
  ['Relationship', 'Cardinality', 'Meaning'],
  [
    ['User → CV', '1 : 0..1', 'A learner has at most one parsed résumé.'],
    ['User → Roadmap', '1 : 0..*', 'A learner owns roadmaps; one is active at a time.'],
    ['Roadmap → ModuleItem', '1 : *', 'Modules are embedded sub-documents with prerequisite links to sibling modules.'],
    ['User → QuizSession', '1 : *', 'One session per exam attempt on a module.'],
    ['QuizSession → QuizAnswer', '1 : *', 'Five answers per session, each carrying its own difficulty.'],
    ['User → UserTopicResult', '1 : *', 'Running attempt and fail statistics per topic, driving the remedial trigger.'],
    ['User → TrackCertification', '1 : 0..*', 'Issued on completion of all modules in a track.'],
    ['User → Payment / Subscription', '1 : *', 'Billing history and current entitlement.'],
    ['Company → Job', '1 : *', 'A company publishes job postings.'],
    ['Job ↔ User (verified skills)', '* : *', 'Matching computed from verified skills against required skills.'],
    ['User ↔ MentorProfile', '1 : 0..1', 'A user with the mentor role has one mentor profile.'],
  ],
  [30, 16, 54],
));
c.push(Spacer());
c.push(...Figure(`${DIAG}/erd.png`, 'Figure 4.2 — Entity Relationship Diagram'));
P0('The diagram is limited to the ten core entities. MODULE_ITEM and QUIZ_ANSWER are embedded sub-documents rather than separate collections, which is why they carry no independent collection of their own in MongoDB.');
c.push(new Paragraph({ children: [new PageBreak()] }));

// ══════════════════════════ 5. IMPLEMENTATION ══════════════════════════════
c.push(H1('5. Implementation'));

c.push(H2('5.1 Tools & Technologies'));
c.push(Tbl(
  ['Category', 'Technologies'],
  [
    ['Frontend', 'Next.js 14.2 (App Router) · React 18.3 · TypeScript 5 · Tailwind CSS 3.4 · DaisyUI 4.12 · Framer Motion 12 (LazyMotion) · Recharts 3.9 · Lucide React · Monaco Editor · React Toastify · Redux Toolkit · PWA (manifest + service worker)'],
    ['Backend', 'NestJS 11 · Node.js 20 · Express · RxJS 7.8 · class-validator · class-transformer · Zod 3.23 · Swagger/OpenAPI · @nestjs/event-emitter · BullMQ 5.81 · Helmet 8 · @nestjs/throttler · Multer · pdf-parse · Axios'],
    ['Database', 'MongoDB 6 / Atlas · Mongoose 8.9 (49 schemas) · Qdrant 1.12 (vector, cosine) · Redis 7'],
    ['Data & BI', 'Recharts dashboards · progress snapshots · streak tracking · per-topic fail statistics · 7/30/90-day activity analytics · Adzuna salary API · Qdrant semantic search'],
    ['AI infrastructure', 'OpenAI (gpt-4o-mini, text-embedding-3-small, tts-1) · Google Gemini (2.5-flash, 2.0-flash, text-embedding-004) · Groq (llama-3.3-70b) · Hugging Face (Llama-3.1-8B) · AssemblyAI (speech-to-text) · provider fallback chain with deterministic mock'],
    ['Authentication', 'JWT access + refresh rotation · bcrypt (12 rounds) · Google Identity · httpOnly cookies scoped to /auth · global JwtAuthGuard · RolesGuard · ownership assertions · Helmet · rate limiting'],
    ['Cloud & deployment', 'Docker · Docker Compose · GitHub Actions CI (Node 20) · Turborepo · npm workspaces · MongoDB Atlas · Cloudinary · Appwrite · Next.js standalone output'],
    ['Payments', 'PayPal REST API v2 · sandbox/live switching · server-side price resolution · webhook signature verification'],
    ['Testing & tooling', 'Playwright (end-to-end, mobile, performance) · Jest 30 · ts-jest · Supertest · 44-check security smoke suite · ESLint · Prettier · Piston code sandbox'],
    ['Communication', 'Resend (transactional email) · web-push VAPID · OneSignal · Socket.IO (realtime)'],
  ],
  [20, 80],
));

c.push(H2('5.2 Hardware Requirements'));
c.push(H3('5.2.1 Development machine'));
c.push(Tbl(
  ['Resource', 'Minimum', 'Recommended'],
  [
    ['CPU', 'Dual-core x64', 'Quad-core x64 or better'],
    ['RAM', '8 GB', '16 GB — both dev servers plus MongoDB run concurrently'],
    ['Disk', '5 GB free', '10 GB free (node_modules, database, build artefacts)'],
    ['OS', 'Windows 10 / macOS 12 / Ubuntu 20.04', 'Any of the above, 64-bit'],
    ['Runtime', 'Node.js 20, npm 10', 'Node.js 20 LTS'],
    ['Network', 'Required for AI providers and Atlas', 'Broadband; the app also runs offline in mock mode'],
  ],
  [20, 38, 42],
));
c.push(H3('5.2.2 Server / deployment'));
c.push(Tbl(
  ['Component', 'Requirement'],
  [
    ['API container', '1 vCPU, 1 GB RAM minimum; 2 vCPU / 2 GB recommended.'],
    ['Web container', '1 vCPU, 512 MB RAM (Next.js standalone output).'],
    ['MongoDB', 'Atlas M0 for evaluation; M10 or larger for production traffic.'],
    ['Qdrant', '1 vCPU, 1 GB RAM; optional — retrieval falls back to mock mode without it.'],
    ['Redis', '256 MB; optional — the queue falls back to an in-memory implementation.'],
    ['Client', 'Any modern browser (Chrome, Edge, Firefox, Safari); installable as a PWA.'],
  ],
  [24, 76],
));

c.push(H2('5.3 Steps of Installation'));
c.push(H3('5.3.1 Prerequisites'));
c.push(Bullet('Node.js 20 LTS and npm 10.'));
c.push(Bullet('MongoDB — a local server or an Atlas connection string.'));
c.push(Bullet('Docker Desktop (optional) for Redis, Qdrant and the Piston sandbox.'));
c.push(H3('5.3.2 Procedure'));
c.push(Num('Clone the repository and enter it.'));
c.push(Num('Copy the environment template: cp .env.example apps/api/.env'));
c.push(Num('Set MONGODB_URI, JWT_SECRET and JWT_REFRESH_SECRET (32+ characters each). Set PORT=3002 so it matches NEXT_PUBLIC_API_URL in apps/web/.env.'));
c.push(Num('Optionally add AI provider keys. Without them the system runs in mock mode and remains fully usable.'));
c.push(Num('Install dependencies from the repository root: npm install'));
c.push(Num('Optionally start the supporting services: docker compose up -d'));
c.push(Num('Start both applications: npm run dev'));
c.push(Num('Open http://localhost:3001. The API serves on http://localhost:3002.'));
c.push(Num('Verify the installation: npm run smoke (44 checks) and npx playwright test (end-to-end suite).'));
c.push(Spacer());
c.push(ActionBox('Two installation notes worth keeping in the document', [
  'PORT must be 3002 in apps/api/.env. The web client reads NEXT_PUBLIC_API_URL=http://localhost:3002, so a mismatch produces a "Failed to fetch" error on every authenticated call while both servers appear to be running normally.',
  'Set NEXT_PUBLIC_SOCKET_URL in apps/web/.env. Without it the realtime client falls back to port 3000 and retries indefinitely.',
]));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ══════════════════════════ 6. TESTING ═════════════════════════════════════
c.push(H1('6. User / Customer Testing'));

c.push(H2('6.1 Users / Customers Feedback'));
P0('This section must report feedback gathered from real users during the customer-testing phase. The structure is prepared below.');
c.push(Tbl(
  ['#', 'Participant / role', 'Task observed', 'Feedback received', 'Severity'],
  [
    ['1', '< name / role >', '< e.g. complete onboarding and generate a roadmap >', '< what they said or where they hesitated >', '< High/Med/Low >'],
    ['2', '< name / role >', '< e.g. sit an adaptive exam >', '< … >', '< … >'],
    ['3', '< name / role >', '< e.g. upload a CV and read the parsed result >', '< … >', '< … >'],
    ['4', '< recruiter >', '< e.g. screen the candidate pipeline >', '< … >', '< … >'],
    ['5', '< name / role >', '< e.g. use the Arabic interface >', '< … >', '< … >'],
  ],
  [5, 20, 26, 35, 14],
));

c.push(H2('6.2 Improvements Done'));
P0('Changes made in response to feedback. The rows below are the verified engineering improvements already carried out on the system; add the rows that came from your user sessions.');
c.push(Tbl(
  ['Issue identified', 'Change made', 'Verified result'],
  [
    ['Dashboard and quiz pages were slow to become interactive.', 'Moved the charting library out of the initial bundle and loaded it after first paint.', 'Dashboard 316 kB → 161 kB (−49%); quiz 243 kB → 131 kB (−46%).'],
    ['Animation library shipped in full on every animated route.', 'Adopted on-demand loading of only the animation features actually used.', 'Auth, calendar, notifications and achievements routes each reduced by ~24 kB.'],
    ['Sign-up pages felt slow to appear despite a fast first paint.', 'Removed the entrance delay on the largest element so it paints immediately.', 'Largest Contentful Paint 1,540 ms → 272 ms (−82%).'],
    ['A failed AI provider could break curriculum and exam generation.', 'Introduced a five-provider fallback chain terminating in a deterministic mock.', 'Confirmed in practice: all three live providers failed simultaneously and the platform continued to operate.'],
    ['Long chat messages inflated the cost of every later turn.', 'Budgeted conversation context by token size rather than message count, and capped model output.', 'Bounded worst-case prompt size; stored transcript capped per session.'],
    ['< from your user testing >', '< … >', '< … >'],
  ],
  [30, 36, 34],
));
c.push(Spacer());
c.push(ActionBox('This section needs real user sessions — assessors ask about it directly', [
  'Section 6.1 is entirely placeholders. Run at least 3–5 short sessions: give a participant a concrete task, watch without helping, and write down where they hesitate.',
  'The engineering improvements listed in 6.2 are real and measured, and you can defend every number. Keep them, but add the rows that came from watching real users — the guidelines specifically ask you to present modifications made in response to customer feedback.',
  'Even five sessions with your own cohort is enough, provided you report it honestly as five.',
]));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ══════════════════════════ 7. RECOMMENDATIONS ═════════════════════════════
c.push(H1('7. Recommendations (Future Work)'));

c.push(H2('7.1 Assessment quality'));
c.push(BulletLead('Larger item bank', 'five questions is a small sample, so the difficulty ladder rarely reaches its top step. A larger bank with per-question discrimination statistics would let the exam settle on an accurate level within the same number of questions.'));
c.push(BulletLead('Item response theory', 'replacing the fixed difficulty weights with a calibrated IRT model would make scores comparable across modules rather than only within one.'));
c.push(BulletLead('Integrity measures', 'question randomisation, time-per-question analysis and optional proctoring would strengthen the credential against sharing.'));

c.push(H2('7.2 Retrieval and AI'));
c.push(BulletLead('Advanced retrieval', 'sentence-window and auto-merging retrieval over the knowledge base, replacing fixed-size chunking, to reduce truncated context in assistant answers.'));
c.push(BulletLead('Retrieval evaluation', 'adopt the RAG triad — context relevance, groundedness and answer relevance — as a measured metric rather than relying on user reports.'));
c.push(BulletLead('Cost control', 'per-user token budgets and caching of repeated generations to keep inference cost predictable as usage grows.'));

c.push(H2('7.3 Product'));
c.push(BulletLead('Employer-verified outcomes', 'record whether a matched candidate was actually interviewed or hired, closing the feedback loop on match quality.'));
c.push(BulletLead('Team and cohort accounts', 'bootcamp-facing dashboards showing per-skill outcomes across a cohort.'));
c.push(BulletLead('Live job ingestion', 'wire an external job feed so postings stay current without manual seeding.'));
c.push(BulletLead('Native mobile applications', 'beyond the current progressive web app.'));

c.push(H2('7.4 Engineering'));
c.push(BulletLead('Performance budgets in CI', 'fail the build when a change pushes LCP or bundle size past the agreed threshold, so the measured gains are not lost over time.'));
c.push(BulletLead('Broader automated coverage', 'extend the end-to-end suite to the full learner journey, including payment flows against the PayPal sandbox.'));
c.push(BulletLead('Observability', 'structured logging, error tracking and per-endpoint latency dashboards in production.'));
c.push(BulletLead('Secret hygiene', 'move every credential to a managed secret store and rotate anything that has appeared in the repository or in shared documents.'));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ══════════════════════════ 8. USER GUIDE ══════════════════════════════════
c.push(H1('8. User Guide'));

c.push(H2('8.1 Quick Start Guide'));
c.push(H3('8.1.1 For a learner'));
c.push(Num('Open the platform and choose Register, then select "Learner".'));
c.push(Num('Enter your name, email and a password of at least 8 characters containing a letter and a digit.'));
c.push(Num('Continue to the second step and provide your target career goal and level of education.'));
c.push(Num('Wait for your roadmap to be generated — it appears as a tree of modules under Learning Path.'));
c.push(Num('Open the first unlocked module and choose Start Assessment.'));
c.push(Num('Answer the five questions. Each is timed at 30 seconds and the difficulty adapts as you go.'));
c.push(Num('Score 70% or above to pass: dependent modules unlock and the skill is added to your passport.'));
c.push(Num('If you score below 70%, a shorter remedial module built from the questions you missed is added ahead of the failed one.'));
c.push(Num('Upload your CV under CV Profile to build a structured résumé and enhance it with AI.'));
c.push(Num('Visit Jobs to compare your verified skills against real postings, and close any gap in one click.'));
c.push(H3('8.1.2 For a company'));
c.push(Num('Register and select "Recruiter", then complete your company details.'));
c.push(Num('Open the company dashboard to browse candidates ranked by verified exam performance.'));
c.push(Num('Post a role with its required skills to see matching candidates.'));
c.push(Num('Subscribe to the Company tier to unlock full pipeline access.'));

c.push(H2('8.2 Main Scenarios'));
c.push(Tbl(
  ['Scenario', 'Steps', 'Expected result'],
  [
    ['Generate a roadmap', 'Onboarding → enter target role, education, experience, skills → submit.', 'An ordered module tree with hour estimates and prerequisites appears under Learning Path.'],
    ['Pass a module', 'Learning Path → open an unlocked module → Start Assessment → answer five questions.', 'Score ≥ 70%: the module is marked completed, dependents unlock, and a verified skill is recorded.'],
    ['Fail a module', 'Same as above, scoring below 70%.', 'The module is marked failed and a shorter remedial module covering the missed topics is inserted before it.'],
    ['Earn a certificate', 'Complete every module in a track.', 'A track certificate is issued automatically and can be exported as a printable A4 credential.'],
    ['Build a CV', 'CV Profile → upload a PDF résumé → review parsed sections → Enhance with AI.', 'Structured personal, experience, education, project and skill sections, with rewritten bullets.'],
    ['Close a skill gap', 'Jobs → open a posting → review the gap → Close Gap.', 'Missing requirements are added to the roadmap as new modules.'],
    ['Screen candidates', 'Company dashboard → Candidates → filter by verified skill.', 'A list ranked by exam performance and completion rate.'],
    ['Switch language', 'Navbar → AR / EN toggle.', 'The whole interface switches, and the layout mirrors to right-to-left for Arabic.'],
  ],
  [20, 40, 40],
));

c.push(H2('8.3 Troubleshooting'));
c.push(Tbl(
  ['Symptom', 'Likely cause', 'Resolution'],
  [
    ['"Failed to fetch" when registering or logging in.', 'The API is not running, or PORT does not match NEXT_PUBLIC_API_URL.', 'Confirm the API is listening on 3002 and that apps/api/.env sets PORT=3002. Open http://localhost:3002/health to check.'],
    ['Pages load but every authenticated call returns 401.', 'JWT secrets changed since the session was issued.', 'Log out and back in; changing JWT_SECRET invalidates existing sessions by design.'],
    ['Module titles and questions look generic.', 'No valid AI provider key, so the deterministic mock is answering.', 'Add a valid key for any one provider (Gemini, Groq or OpenAI) and restart the API.'],
    ['The API will not start and reports missing modules.', 'Dependencies declared but not installed.', 'Run npm install from the repository root, then restart.'],
    ['The API exits at boot with a configuration error.', 'A variable read with getOrThrow is absent — for example ASSEMBLYAI_API_KEY or APPWRITE_ENDPOINT.', 'Provide a placeholder value for the missing variable in apps/api/.env.'],
    ['Console fills with WebSocket connection errors.', 'NEXT_PUBLIC_SOCKET_URL is unset, so the client falls back to port 3000.', 'Set NEXT_PUBLIC_SOCKET_URL=http://localhost:3002 in apps/web/.env.'],
    ['Data does not appear in MongoDB Compass.', 'Compass is connected to a different server than the API.', 'Point Compass at the same MONGODB_URI the API uses, and open the smartroadmap database.'],
    ['The quiz page shows a load error on first visit.', 'In development the route compiles on first request, which can outrun the page\'s own data fetch.', 'Reload the page once the route has compiled.'],
  ],
  [26, 30, 44],
));

// ══════════════════════════ BUILD ══════════════════════════════════════════
const doc = new Document({
  creator: 'Devotopia — SmartRoadmap Team',
  title: 'Devotopia — Project Documentation',
  description: 'ITI graduation project documentation',
  numbering,
  styles,
  sections: [{
    properties: {
      titlePage: true,
      page: {
        margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 560 },
      },
    },
    headers: Headers(LOGO),
    children: c,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log('written:', OUT, (buf.length / 1024).toFixed(0) + ' KB');
});
