/**
 * Devotopia — ITI Presentation Outline.
 * Slide order follows the 11 points in "Presentation-Outline.docx".
 */
const fs = require('fs');
const path = require('path');
const { AlignmentType, Document, Packer, Paragraph, TextRun, PageBreak } = require('docx');
const {
  numbering, styles, P, H1, H2, H3, Bullet, BulletLead, Num, Tbl, ActionBox, Spacer, Figure, Logo, Headers, MUTED,
} = require('./shared');
const DIAG = process.env.DIAG_DIR;
const LOGO = process.env.LOGO_PATH;

const OUT = process.argv[2];
const c = [];

const SlideHead = (n, title, time) =>
  new Paragraph({
    heading: 'Heading1',
    children: [new TextRun({ text: `Slide ${n} — ${title}` })],
  });

const Note = (t) => new Paragraph({
  spacing: { after: 100, line: 260 },
  children: [new TextRun({ text: t, italics: true, size: 19, color: MUTED })],
});

const Say = (t) => new Paragraph({
  spacing: { after: 80, line: 270 },
  indent: { left: 220 },
  children: [
    new TextRun({ text: 'Say:  ', bold: true, size: 19, color: '4F46E5' }),
    new TextRun({ text: t, size: 20 }),
  ],
});

// ══════════════════════════ COVER ══════════════════════════════════════════
c.push(new Paragraph({ spacing: { after: 1200 }, children: [] }));
c.push(new Paragraph({ text: 'Devotopia', heading: 'Title' }));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: 'Verified Skill Roadmaps', size: 28, color: '4F46E5' })],
}));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 600 },
  children: [new TextRun({ text: 'Presentation Outline & Speaker Notes', size: 24, bold: true })],
}));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 100 },
  children: [new TextRun({ text: 'Ali Maher (Leader) · Mohamed El-Saeed · Nada Nasr · Marina George', size: 21 })],
}));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 500 },
  children: [new TextRun({ text: 'Open Source Track · ITI', size: 21, color: MUTED })],
}));
c.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: 'Target length: 15 minutes presenting + 5 minutes questions', size: 20, color: MUTED, italics: true })],
}));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ══════════════════════════ RUNNING ORDER ══════════════════════════════════
c.push(H1('Running order'));
c.push(Tbl(
  ['#', 'Slide', 'Owner', 'Time'],
  [
    ['1', 'Title — ITI logo, project logo, date', 'Ali', '0:15'],
    ['2', 'Team & tracks', 'Ali', '0:30'],
    ['3', 'Outline', 'Ali', '0:20'],
    ['4', 'The problem', 'Nada', '2:00'],
    ['5', 'Competitor analysis', 'Nada', '1:30'],
    ['6', 'Customer analysis', 'Nada', '1:30'],
    ['7', 'Proposed solution & scope', 'Mohamed', '2:00'],
    ['8', 'Stakeholders & impact', 'Marina', '1:00'],
    ['9', 'Tools & technologies', 'Mohamed', '1:00'],
    ['10', 'System architecture', 'Mohamed', '1:30'],
    ['11', 'Demo (2 minutes)', 'Ali', '2:00'],
    ['12', 'Deep dive — the adaptive engine', 'Mohamed', '1:30'],
    ['13', 'Customer testing & improvements', 'Marina', '1:30'],
    ['14', 'Business model', 'Marina', '1:00'],
    ['15', 'Future work & close', 'Ali', '0:45'],
  ],
  [6, 46, 24, 24],
));
c.push(Spacer());
c.push(Note('Owners above are a suggestion — adjust to match who built what. Assessors often direct questions to whoever presented the slide.'));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ══════════════════════════ SLIDES ═════════════════════════════════════════
c.push(SlideHead(1, 'Title'));
c.push(Bullet('ITI logo (top-left) and the Devotopia project logo (centre).'));
c.push(Bullet('Project name: Devotopia — Verified Skill Roadmaps.'));
c.push(Bullet('Date of the defence.'));
c.push(Note('Keep this slide almost empty. It is on screen while the audience settles.'));

c.push(SlideHead(2, 'Team & tracks'));
c.push(Tbl(
  ['Name', 'Track', 'Role'],
  [
    ['Ali Maher', 'Open Source', 'Project Leader'],
    ['Mohamed El-Saeed', 'Open Source', '< your area >'],
    ['Nada Nasr', 'Open Source', '< your area >'],
    ['Marina George', 'Open Source', '< your area >'],
    ['< Supervisor >', '—', 'Project Supervisor'],
  ],
  [32, 26, 42],
));
c.push(Note('The guidelines require the project leader to be identified explicitly, and the supervisor named.'));

c.push(SlideHead(3, 'Outline'));
c.push(Bullet('The problem'));
c.push(Bullet('Who else solves it, and how we differ'));
c.push(Bullet('What customers told us'));
c.push(Bullet('Our solution and its scope'));
c.push(Bullet('Architecture and technology'));
c.push(Bullet('Live demo'));
c.push(Bullet('Testing, business model, and what comes next'));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(4, 'The problem'));
c.push(H3('Slide content'));
c.push(Bullet('One headline statistic on graduate employability, large and centred.'));
c.push(Bullet('Left: what the learner faces — a self-assembled curriculum with no order, no prerequisites, and no signal that a topic is finished.'));
c.push(Bullet('Right: what the employer faces — hundreds of CVs with identical keywords and no evidence behind any of them.'));
c.push(Bullet('Bottom: the cost — months of misdirected study; an expensive, low-signal screening funnel.'));
c.push(H3('Speaker notes'));
c.push(Say('A graduate decides they want to be a full-stack developer. Nobody tells them what to learn first, so they assemble a path from YouTube and course catalogues. When they get stuck, nothing changes — the same material is served again, and they stall for weeks.'));
c.push(Say('On the other side, a recruiter opens two hundred CVs that all say "React, Node, MongoDB". None of it is verified, so screening becomes guesswork — and good candidates get filtered out with the rest.'));
c.push(Say('Both problems have the same root: there is no trustworthy signal of what someone can actually do.'));
c.push(Spacer());
c.push(ActionBox('This slide needs a cited statistic', [
  'The guidelines ask you to open with statistics or expert quotations. Put one number on this slide — ICT graduate unemployment in Egypt, time-to-first-job for CS graduates, or cost-per-hire for a junior developer.',
  'Show the source and year on the slide itself. Assessors weight problem significance heavily, and they do ask where a number came from.',
]));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(5, 'Competitor analysis'));
c.push(H3('Slide content — use this table directly'));
c.push(Tbl(
  ['Product', 'Verifies by', 'Curriculum', 'Employer side'],
  [
    ['Coursera', 'Attendance certificate; fixed retakeable test', 'Learner picks from a catalogue', 'Separate hiring product'],
    ['LinkedIn Learning', 'Fixed 15-question badge quiz', 'Not tied to a path', 'Jobs marketplace'],
    ['roadmap.sh', 'Self-ticked — no verification', 'Static, same for everyone', 'None'],
    ['Almentor / Udacity Arabia', 'Project review', 'Instructor-paced cohort', 'None'],
    ['Devotopia', 'Adaptive exam, difficulty-weighted', 'Generated per learner from prerequisites', 'Ranked verified pipeline'],
  ],
  [22, 26, 26, 26],
));
c.push(H3('Speaker notes'));
c.push(Say('We looked in both directions — globally, and regionally. Globally, Coursera and LinkedIn dominate, but both verify by attendance or by a fixed test that can be retaken until it passes.'));
c.push(Say('The closest product by idea is roadmap.sh, which publishes learning roadmaps — but they are the same for everyone and progress is self-ticked, so there is no verification at all.'));
c.push(Say('Our difference is one a user would notice: the exam adapts, the score is weighted by the difficulty you actually faced, and failing rewrites your roadmap instead of just recording a failure.'));
c.push(Note('Highlight the bottom row visually. This table is the answer to "what is new here?" and assessors look for it.'));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(6, 'Customer analysis'));
c.push(H3('Slide content'));
c.push(Bullet('Method: questionnaire + interviews. State the sample size and the period.'));
c.push(Bullet('Two or three charts — the guidelines explicitly ask for graphs and statistics.'));
c.push(Bullet('Each finding paired with the design decision it drove.'));
c.push(H3('Suggested chart set'));
c.push(Num('Bar chart: how learners currently decide what to learn next.'));
c.push(Num('Pie chart: proportion who have abandoned a learning path before finishing.'));
c.push(Num('Bar chart: what recruiters trust most when screening a junior CV.'));
c.push(H3('Speaker notes'));
c.push(Say('We surveyed < n > learners and spoke to < n > hiring contacts. < The single most striking finding >.'));
c.push(Say('That is the reason we built < the specific feature it drove > rather than < the obvious alternative >.'));
c.push(Spacer());
c.push(ActionBox('This slide cannot be presented with placeholder numbers', [
  'You need real questionnaire results here. If the survey has not run yet, run it before the defence — even n = 40 from your own cohort is defensible when reported honestly.',
  'If you have spoken to a real company or a real learner group, name them on this slide. The guidelines state that one verified customer contact carries more weight than anything else in this section.',
  'Never present invented percentages. "We surveyed 40 students" with modest numbers scores better than impressive numbers you cannot source.',
]));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(7, 'Proposed solution & scope'));
c.push(H3('Slide content — whole picture first, then scope'));
c.push(BulletLead('The whole picture', 'a learner states a target job role; the system builds the curriculum, verifies each step, and turns the result into evidence a recruiter can search.'));
c.push(BulletLead('Then the scope', 'the services we actually focus on:'));
c.push(Bullet('AI roadmap generation from a target role, current skills and experience.', 1));
c.push(Bullet('Adaptive assessment with difficulty-weighted scoring.', 1));
c.push(Bullet('Remedial loop that rewrites the roadmap on failure.', 1));
c.push(Bullet('Verified skill passport, badges and exportable certificates.', 1));
c.push(Bullet('CV parsing and AI enhancement.', 1));
c.push(Bullet('Job matching, skill-gap closing, and a recruiter pipeline.', 1));
c.push(Bullet('Community, mentors, coding practice, and an AI study assistant.', 1));
c.push(BulletLead('Explicitly out of scope', 'live proctoring, native mobile apps, automated job scraping, post-hire HR processes.'));
c.push(H3('Speaker notes'));
c.push(Say('Devotopia turns a target job role into an ordered learning roadmap, and then makes the learner prove each step before moving on.'));
c.push(Say('Stating what we did not build matters as much as what we did — it shows the scope was a decision, not an accident.'));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(8, 'Stakeholders & impact'));
c.push(Tbl(
  ['Stakeholder', 'Impact of the system'],
  [
    ['Learners', 'Study time is directed by prerequisites instead of guesswork, and every pass produces evidence.'],
    ['Career switchers', 'The roadmap starts from what they already know, so known material is not repeated.'],
    ['Employers', 'Candidates ranked by measured exam performance — lower screening cost, fewer false negatives.'],
    ['Mentors', 'A structured way to advise learners, with profiles, ratings and session booking.'],
    ['Bootcamps', 'Measurable per-skill outcomes across a cohort, beyond attendance certificates.'],
  ],
  [26, 74],
));
c.push(H3('Speaker notes'));
c.push(Say('The impact is on both sides of the same transaction: the learner gets direction and proof, the employer gets signal. That is why the verified skill is the centre of the product rather than the course catalogue.'));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(9, 'Tools & technologies'));
c.push(Tbl(
  ['Layer', 'Technologies'],
  [
    ['Frontend', 'Next.js 14 · React 18 · TypeScript · Tailwind · DaisyUI · Framer Motion · Recharts · PWA'],
    ['Backend', 'NestJS 11 · Node.js 20 · Express · Zod · BullMQ · Helmet · Swagger'],
    ['Database', 'MongoDB Atlas · Mongoose (49 schemas) · Qdrant (vector) · Redis'],
    ['AI', 'Gemini · Groq · OpenAI · Hugging Face · AssemblyAI — behind one fallback chain'],
    ['Auth & security', 'JWT + refresh rotation · bcrypt · Google Identity · httpOnly cookies · rate limiting'],
    ['Cloud & DevOps', 'Docker · GitHub Actions · Turborepo · Cloudinary · Appwrite'],
    ['Payments', 'PayPal REST v2 with server-side pricing'],
    ['Testing', 'Playwright · Jest · Supertest · 44-check security suite'],
  ],
  [22, 78],
));
c.push(Note('Show logos rather than lists if you can — this slide is scanned, not read. Keep the spoken part to the two or three choices you can defend.'));
c.push(H3('Speaker notes'));
c.push(Say('One choice worth calling out: every AI call goes through a fallback chain of five providers that ends in a deterministic mock. If every provider fails, the platform keeps working — and that is not theoretical, it happened during our own testing.'));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(10, 'System architecture'));
c.push(H3('Diagram for the slide — use this image directly'));
c.push(...Figure(`${DIAG}/architecture.png`, 'Put this on the slide full-width. The file is in output/docs/diagrams/architecture.png'));
c.push(H3('Speaker notes'));
c.push(Say('Three layers: a Next.js client, a NestJS API, and a shared package of schemas that keeps the contract between them synchronised.'));
c.push(Say('The design decision I would highlight: the model generates content — the curriculum, the questions — but it never decides control flow. Difficulty, pass or fail, unlocking, remedial triggering are all deterministic code. That is what makes those rules unit-testable, and it is why the product survives an AI outage.'));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(11, 'Demo — 2 minutes'));
c.push(H3('Exact path to walk, and nothing more'));
c.push(Num('Register as a learner and complete onboarding with a target role. (20 s)'));
c.push(Num('Show the generated roadmap — point at prerequisites, hour estimates, locked versus unlocked. (25 s)'));
c.push(Num('Open a module and start the exam. Point at the difficulty badge on the first question. (20 s)'));
c.push(Num('Answer two correctly and show the difficulty rising on the next question. (25 s)'));
c.push(Num('Finish and show the result — the weighted score, the pass, and the newly unlocked modules. (20 s)'));
c.push(Num('Open the skill passport to show the verified skill that just appeared. (10 s)'));
c.push(Spacer());
c.push(ActionBox('Rehearse the demo against the real system, and prepare a fallback', [
  'Record a screen capture of this exact path and embed it in the slide deck. If the network or an AI provider fails during the defence, play the recording rather than debugging in front of the panel.',
  'Seed a demo account with a completed roadmap before you present, so you are never waiting on live generation.',
  'Two minutes is short. Practise until this path fits without rushing — do not open any screen that is not in the list above.',
]));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(12, 'Deep dive — the adaptive engine'));
c.push(H3('Slide content'));
c.push(BulletLead('Difficulty moves on a two-answer streak', 'two correct in a row moves easy → medium → hard; two wrong moves it back down; a mixed pair holds position.'));
c.push(BulletLead('Scoring is weighted by difficulty faced', 'easy 1.0, medium 1.5, hard 2.0 — so climbing the ladder is what raises the mark.'));
c.push(BulletLead('Pass threshold 70%', 'passing unlocks dependent modules and records a verified skill.'));
c.push(BulletLead('Failure rewrites the curriculum', 'once a topic\'s running fail percentage reaches 30%, a shorter remedial module built from the missed questions is inserted ahead of the failed one.'));
c.push(H3('Speaker notes'));
c.push(Say('Why two answers and not one? On a five-question exam, adapting after a single answer over-reacts to a lucky guess or a careless slip.'));
c.push(Say('Why weight the score? Without weighting the ladder is decorative — a learner who climbs to hard questions would score the same as one who stayed on easy. The weighting is also what lets a recruiter filter on skills passed at a measured difficulty.'));
c.push(Say('And these rules are deterministic code, not model decisions — which is exactly why we can unit-test them.'));
c.push(Note('Expect the panel to push here. Be ready for: "why 70%?", "why 30%?", and "what is the weakness of this design?" — the honest answer to the last one is that five questions is a small sample, so the ladder rarely reaches hard.'));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(13, 'Customer testing & improvements'));
c.push(H3('Slide content — before and after'));
c.push(Tbl(
  ['Issue found', 'Change made', 'Measured result'],
  [
    ['Dashboard slow to become interactive', 'Charting library moved out of the initial bundle', '316 kB → 161 kB  (−49%)'],
    ['Quiz page slow to load', 'Countdown chart replaced with plain SVG', '243 kB → 131 kB  (−46%)'],
    ['Sign-up felt slow despite a fast first paint', 'Removed the entrance delay on the largest element', 'LCP 1,540 ms → 272 ms  (−82%)'],
    ['AI outage broke generation', 'Five-provider fallback chain ending in a mock', 'Survived all three providers failing at once'],
    ['< from your user sessions >', '< … >', '< … >'],
  ],
  [30, 36, 34],
));
c.push(H3('Speaker notes'));
c.push(Say('The guidelines ask us to show what changed because of feedback. These four are engineering improvements we measured before and after — every number here is reproducible.'));
c.push(Spacer());
c.push(ActionBox('Add real user feedback rows before the defence', [
  'The four rows above are real and measured, and you can defend every number. But they are engineering findings, not customer findings.',
  'Run 3–5 short sessions: give someone a task, watch without helping, note where they hesitate, then add those rows. The guidelines explicitly ask for modifications made during the customer testing phase.',
]));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(14, 'Business model'));
c.push(Tbl(
  ['Plan', 'Who pays', 'Price', 'Unlocks'],
  [
    ['Free', 'New learners', '$0', 'One roadmap, limited exams, community'],
    ['Pro Learner', 'Serious learners', '$19.99 / month', 'Unlimited roadmaps and exams, CV enhancement, certificates'],
    ['Company', 'Employers', '$99.99 / month', 'Verified candidate pipeline, search, job postings'],
  ],
  [16, 22, 20, 42],
));
c.push(H3('Route to the first 100 customers'));
c.push(Num('Our own graduating cohort — one demo session reaches 100+ students.'));
c.push(Num('IEEE, GDG on Campus and ACM chapters in Alexandria and Cairo.'));
c.push(Num('Alexandria and Smart Village software houses that already hire from these cohorts.'));
c.push(H3('Speaker notes'));
c.push(Say('Running cost is roughly 200 dollars a month in AI inference at a thousand active learners, which sits comfortably under the subscription revenue at that scale.'));
c.push(Note('If you have actually spoken to a gym, company or training centre willing to pilot, say so here — it is the strongest single sentence available in this section.'));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(SlideHead(15, 'Future work & close'));
c.push(Bullet('Larger item bank with per-question discrimination statistics, so the difficulty ladder has room to work.'));
c.push(Bullet('Advanced retrieval — sentence-window and auto-merging — with the RAG triad as a measured metric.'));
c.push(Bullet('Employer-verified outcomes: track whether a matched candidate was actually interviewed or hired.'));
c.push(Bullet('Cohort dashboards for bootcamps and training centres.'));
c.push(Bullet('Performance budgets enforced in CI so the gains are not lost over time.'));
c.push(H3('Closing line'));
c.push(Say('A completion certificate says a learner attended. A Devotopia verified skill says they answered questions at a measured difficulty and passed a weighted threshold. That difference is the whole product.'));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(H1('Anticipated questions'));
c.push(Tbl(
  ['Question', 'Answer'],
  [
    ['Why 70% to pass?', 'Below it, a learner who guessed half the answers would earn a verified skill — which destroys the signal recruiters are buying.'],
    ['Why 30% for the remedial trigger?', 'It is a running fail percentage per topic, so a single bad attempt does not trigger it but a genuine pattern does.'],
    ['Why two answers before adapting?', 'On a five-question exam, adapting after one answer over-reacts to a lucky guess or a careless slip.'],
    ['What is the weakness of your assessment?', 'Five questions is a small sample, so the ladder rarely reaches hard. The fix is a larger item bank with per-question statistics.'],
    ['Is it agentic?', 'No. The sequence is fixed by application code; the model fills in content but never chooses the next step. That is deliberate — it keeps the rules testable.'],
    ['How do you know it is secure?', 'Deny-by-default global auth guard, role checks, ownership assertions, bcrypt at 12 rounds, and a 44-check suite covering IDOR, privilege escalation and rate limits.'],
    ['What happens if the AI is down?', 'A five-provider chain ends in a deterministic mock. We verified this in practice when all three live providers failed at once — the platform kept working.'],
    ['How is this different from roadmap.sh?', 'Theirs is static and the same for everyone, and progress is self-ticked. Ours is generated per learner and every node is verified by exam.'],
    ['Who did what on the team?', 'Answer honestly and specifically. "I built X, Nada built Y, and I integrated them" is stronger than implied joint ownership, because it is checkable.'],
  ],
  [30, 70],
));

c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(H1('Delivery checklist'));
c.push(Bullet('Spell-check the whole deck — the ITI guidelines call this out explicitly.'));
c.push(Bullet('ITI logo, project logo and date on the title slide.'));
c.push(Bullet('Project leader identified by name on the team slide.'));
c.push(Bullet('At least one cited statistic on the problem slide, with source and year.'));
c.push(Bullet('Competitor table includes at least one global and one regional player.'));
c.push(Bullet('Customer analysis shows real charts with a stated sample size.'));
c.push(Bullet('Demo recorded as a fallback and rehearsed to fit two minutes.'));
c.push(Bullet('Customer-testing slide includes changes driven by real user sessions.'));
c.push(Bullet('Every number on every slide is one you can source if asked.'));
c.push(Bullet('Full run-through timed at least twice before the defence.'));

// ══════════════════════════ BUILD ══════════════════════════════════════════
const doc = new Document({
  creator: 'Devotopia — SmartRoadmap Team',
  title: 'Devotopia — Presentation Outline',
  description: 'ITI graduation project presentation outline and speaker notes',
  numbering,
  styles,
  sections: [{
    properties: {
      titlePage: true,
      page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 560 } },
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
