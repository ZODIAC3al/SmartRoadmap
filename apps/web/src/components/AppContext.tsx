'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'smartlight' | 'smartdark';
type Locale = 'en' | 'ar';

interface TranslationDict {
  [key: string]: {
    en: string;
    ar: string;
  };
}

const translations: TranslationDict = {
  // Navbar
  'nav.logo': { en: 'SmartRoadmap', ar: 'خارطة الطريق الذكية' },
  'nav.roadmap': { en: 'Learning Path', ar: 'مسار التعلم' },
  'nav.cv': { en: 'CV Profile', ar: 'ملف السيرة الذاتية' },
  'nav.jobsMatch': { en: 'Matched Jobs', ar: 'الوظائف المتطابقة' },
  'nav.talentBoard': { en: 'Talent Board', ar: 'لوحة المواهب' },
  'nav.pricing': { en: 'Pricing', ar: 'الأسعار' },
  'nav.about': { en: 'About', ar: 'من نحن' },
  'nav.contact': { en: 'Contact', ar: 'اتصل بنا' },
  'nav.login': { en: 'Log in', ar: 'تسجيل الدخول' },
  'nav.signup': { en: 'Sign In', ar: 'إنشاء حساب' },
  'nav.dashboard': { en: 'My Dashboard', ar: 'لوحة التحكم' },
  'nav.logout': { en: 'Logout', ar: 'تسجيل الخروج' },

  // Home (Landing Page)
  'home.badge': { en: '🚀 AI-Powered Personalized Syllabus Builder', ar: '🚀 منشئ المناهج التعليمية المخصص بالذكاء الاصطناعي' },
  'home.title1': { en: 'Your personalized path to', ar: 'مسارك الشخصي الموجه نحو' },
  'home.title2': { en: 'mastery & employment.', ar: 'الاحتراف والتوظيف المباشر.' },
  'home.subtitle': { en: 'SmartRoadmap constructs dynamic, AI-generated curriculum graphs based on your career targets. Prove real mastery through adaptive quizzes, and get directly matched to hiring teams.', ar: 'تقوم خارطة الطريق الذكية ببناء مخططات مناهج دراسية ديناميكية يتم إنشاؤها بواسطة الذكاء الاصطناعي بناءً على أهدافك المهنية. أثبت جدارتك من خلال اختبارات تفاعلية، واحصل على تطابق مباشر مع فرق التوظيف.' },
  'home.cta_start': { en: 'Start Learning Now', ar: 'ابدأ التعلم الآن' },
  'home.cta_talent': { en: 'Find Talent', ar: 'ابحث عن مواهب' },
  'home.trusted': { en: 'Empowering candidates at forward-thinking companies', ar: 'تمكين المرشحين في الشركات الأكثر ريادة وتطلعاً' },
  'home.sections_title': { en: 'Designed for Both Sides of the Market', ar: 'مصمم خصيصاً لكلا جانبي سوق العمل' },
  'home.sections_subtitle': { en: 'Bridging candidates seeking structured goals and recruiters sourcing verified mastery.', ar: 'جسر يربط بين الباحثين عن أهداف منظمة وبين مسؤولي التوظيف الباحثين عن كفاءات معتمدة.' },
  'home.candidate_title': { en: 'For Candidates', ar: 'للمرشحين والطلاب' },
  'home.candidate_desc': { en: 'Stop guessing what syllabus to learn. Get custom interactive curriculum nodes, clear milestone quizzes to unlock modules, and get matched to jobs based on verified scores.', ar: 'توقف عن التخمين حول ما يجب دراسته. احصل على مخطط مهارات تفاعلي مخصص، واجتز اختبارات تقييم المراحل لفتح الوحدات التالية، وتطابق مع الوظائف بناءً على نتائجك.' },
  'home.candidate_badge': { en: 'Verify real technical skills', ar: 'إثبات المهارات التقنية الحقيقية' },
  'home.candidate_cta': { en: 'Build roadmap →', ar: 'أنشئ خارطة طريقك ←' },
  'home.company_title': { en: 'For Hiring Managers', ar: 'لمسؤولي التوظيف والشركات' },
  'home.company_desc': { en: 'Skip manually vetting CV stacks. Source pre-vetted candidate pools backed by transparent quiz logs, validated project milestones, and vector matchmaking indexes.', ar: 'تجاوز الفرز اليدوي لأكوام السير الذاتية. استقطب مرشحين تم تقييمهم مسبقاً ومدعومين بسجلات اختبارات شفافة، ومشاريع موثقة، وفهارس مطابقة متقدمة.' },
  'home.company_badge': { en: 'Targeted vector matching', ar: 'مطابقة موجهة بالذكاء الاصطناعي' },
  'home.company_cta': { en: 'Access board →', ar: 'افتح لوحة المواهب ←' },

  // Home - How It Works
  'home.how_it_works_title': { en: 'How It Works', ar: 'كيف يعمل البرنامج' },
  'home.how_it_works_subtitle': { en: 'Our closed-loop pipeline bridges the gap between learning and landing a job.', ar: 'تربط عمليتنا التعليمية المغلقة الفجوة بين اكتساب المعرفة والحصول على الوظيفة.' },
  'home.step1_title': { en: 'Diagnose', ar: 'التقييم والتشخيص' },
  'home.step1_desc': { en: 'Submit a target goals career profile. AI builds matching questions to establish your starting baseline.', ar: 'حدد أهدافك المهنية، وسيقوم الذكاء الاصطناعي ببناء أسئلة تقييم لتحديد نقطة انطلاقك الحالية.' },
  'home.step2_title': { en: 'Learn & Prove', ar: 'التعلم والإثبات' },
  'home.step2_desc': { en: 'Follow a direct-acyclic-graph timeline. Unlock downstream topics only by clearing adaptive assessments.', ar: 'تتبع خطاً زمنياً تفاعلياً، واجتز اختبارات تقييم مخصصة لفتح المراحل والمواضيع التالية.' },
  'home.step3_title': { en: 'Get Hired', ar: 'التوظيف والعمل' },
  'home.step3_desc': { en: 'Matched jobs recommend compatible listings. Recruiter logs show verified scores for immediate selection.', ar: 'احصل على ترشيحات وظائف متوافقة. يمكن لمسؤولي التوظيف تصفح نتائجك الموثقة واختيارك مباشرة.' },

  // Home - AI Trinity
  'home.trinity_title': { en: 'The AI Trinity', ar: 'ركائز الذكاء الاصطناعي الثلاثة' },
  'home.trinity_subtitle': { en: 'Powered by state-of-the-art LLMs, vector database schemas, and scraping agents.', ar: 'مدعوم بأحدث النماذج اللغوية الكبيرة، وقواعد البيانات الموجهة، ووكلاء فحص الويب.' },
  'home.trinity1_badge': { en: 'Pillar 1', ar: 'الركيزة الأولى' },
  'home.trinity1_title': { en: 'Intelligence (LLM)', ar: 'الذكاء والتحليل (LLM)' },
  'home.trinity1_desc': { en: 'Generates dependency syllabuses, parses educational gaps, and drafts customized quiz sessions matching your learning difficulty metrics.', ar: 'إنشاء مناهج دراسية متسلسلة، وتحليل الثغرات التعليمية، وتصميم جلسات اختبار مخصصة تناسب قدراتك.' },
  'home.trinity2_badge': { en: 'Pillar 2', ar: 'الركيزة الثانية' },
  'home.trinity2_title': { en: 'Knowledge (RAG)', ar: 'المعرفة والاسترجاع (RAG)' },
  'home.trinity2_desc': { en: 'Applies similarity search indexes across vetted learning resources and job databases, feeding ranked references dynamically.', ar: 'ربط مصادر التعلم الموثقة وقواعد بيانات الوظائف عبر فهارس بحث دلالية ذكية لتقديم مراجع دراسية مخصصة.' },
  'home.trinity3_badge': { en: 'Pillar 3', ar: 'الركيزة الثالثة' },
  'home.trinity3_title': { en: 'Action (Agents)', ar: 'التنفيذ والعمليات (Agents)' },
  'home.trinity3_desc': { en: 'Polls global career demands, parses candidate resumes, vettes skill compatibility scores, and indexes recruitment profiles.', ar: 'فحص متمتطلبات سوق العمل العالمي، وتحليل السير الذاتية، ومطابقة المهارات الفنية، وفهرسة ملفات المترشحين.' },

  // Home - Testimonials
  'home.testimonials_title': { en: 'What Candidates and Recruiters Say', ar: 'ماذا يقول المرشحون ومسؤولو التوظيف' },
  'home.test1_quote': { en: '"I was tired of sending out resume templates. SmartRoadmap allowed me to prove my actual JavaScript skills in real-time. Within weeks, I was contacted by recruiter teams."', ar: '"لقد سئمت من إرسال السير الذاتية التقليدية. أتاحت لي هذه المنصة إثبات مهاراتي البرمجية الفعلية في جافا سكريبت بشكل موثق. وخلال أسابيع قليلة تواصلت معي فرق التوظيف."' },
  'home.test1_author': { en: 'Ali Maher', ar: 'علي ماهر' },
  'home.test1_role': { en: 'Frontend Candidate', ar: 'مطور واجهات أمامية' },
  'home.test2_quote': { en: '"SmartRoadmap has cut our screening cycles by half. We no longer look at generic resumes; we search candidate profiles backed by validated test scores and completed paths."', ar: '"لقد اختصرت المنصة دورة الفرز لدينا إلى النصف. لم نعد بحاجة لفحص سير ذاتية مكررة؛ بل نبحث عن مرشحين بناءً على تقييماتهم الموثقة ومساراتهم المنجزة فعلياً."' },
  'home.test2_author': { en: 'Lattice Recruiter', ar: 'مسؤول توظيف في Lattice' },
  'home.test2_role': { en: 'Director of Talent Acquisition', ar: 'مدير استقطاب الكفاءات' },

  // Home - Pricing Tiers
  'home.pricing_title': { en: 'Simple, Transparent Pricing', ar: 'خطط أسعار بسيطة وشفافة' },
  'home.pricing_subtitle': { en: 'Start learning for free, upgrade as you scale your search.', ar: 'ابدأ التعلم مجاناً، وقم بالترقية تدريجياً لتعزيز فرص توظيفك.' },
  'home.plan_free_title': { en: 'Starter Free', ar: 'الباقة المجانية' },
  'home.plan_free_desc': { en: 'Perfect for software beginners.', ar: 'مثالية للمبتدئين في المجال البرمجي.' },
  'home.plan_free_price': { en: '$0', ar: '٠ دولارات' },
  'home.plan_free_period': { en: '/ forever', ar: ' / مدى الحياة' },
  'home.plan_free_f1': { en: '1 AI Roadmap Generation', ar: 'إنشاء خارطة طريق واحدة بالذكاء الاصطناعي' },
  'home.plan_free_f2': { en: 'Basic assessments and quizzes', ar: 'اختبارات تقييم أساسية ومبسطة' },
  'home.plan_free_f3': { en: 'Manual profile CV editor', ar: 'محرر يدوي لملف السيرة الذاتية' },
  'home.plan_free_cta': { en: 'Get Started', ar: 'ابدأ مجاناً' },

  'home.plan_pro_title': { en: 'Premium Pro', ar: 'باقة المحترفين' },
  'home.plan_pro_desc': { en: 'For active career seekers.', ar: 'مصممة للباحثين عن فرص عمل بنشاط.' },
  'home.plan_pro_price': { en: '$9', ar: '٩ دولارات' },
  'home.plan_pro_period': { en: '/ month', ar: ' / شهرياً' },
  'home.plan_pro_f1': { en: 'Unlimited Roadmap timelines', ar: 'خرائط طريق غير محدودة بالكامل' },
  'home.plan_pro_f2': { en: 'RAG verified study guides', ar: 'أدلة دراسية ذكية وموثقة' },
  'home.plan_pro_f3': { en: 'Verified profile match score badge', ar: 'شارة موثقة لنسبة التطابق مع الوظائف' },
  'home.plan_pro_f4': { en: 'Priority queue parser processing', ar: 'أولوية فرز وتحليل السير الذاتية بالذكاء الاصطناعي' },
  'home.plan_pro_cta': { en: 'Upgrade to Pro', ar: 'اشترك في باقة المحترفين' },

  'home.plan_ent_title': { en: 'Talent Enterprise', ar: 'باقة الشركات' },
  'home.plan_ent_desc': { en: 'For tech recruiting teams.', ar: 'مخصصة لفرق توظيف الكوادر التقنية.' },
  'home.plan_ent_price': { en: '$49', ar: '٤٩ دولاراً' },
  'home.plan_ent_period': { en: '/ month', ar: ' / شهرياً' },
  'home.plan_ent_f1': { en: 'Access pre-vetted candidate list', ar: 'تصفح قائمة المرشحين المؤهلين مسبقاً' },
  'home.plan_ent_f2': { en: 'Advanced vector match criteria', ar: 'معايير بحث ومطابقة دلالية متقدمة' },
  'home.plan_ent_f3': { en: 'Custom job posting index filters', ar: 'فلاتر مخصصة لفهرسة وتصنيف الوظائف المعروضة' },
  'home.plan_ent_f4': { en: 'Export candidate score details', ar: 'تصدير تفاصيل تقييمات ونقاط المرشحين' },
  'home.plan_ent_cta': { en: 'Recruit Candidates', ar: 'استقطب المواهب الآن' },

  // Home - Footer
  'home.footer_desc': { en: 'AI-Powered Personalized Learning & Hiring Platform. Bridging candidates seeking structured goals and recruitment teams looking for verified skills.', ar: 'منصة توظيف وتعلم شخصية مدعومة بالذكاء الاصطناعي. نربط بين الباحثين عن فرص عمل منظمة وبين فرق التوظيف الباحثة عن مهارات فنية موثقة.' },
  'home.footer_credits': { en: 'Developia · Mohamed Elsaied · Ali Maher · Marina George · Nada Nasr · Supervised by Noha Salah', ar: 'Developia · محمد السعيد · علي ماهر · مارينا جورج · ندى نصر · تحت إشراف أ. نهى صلاح' },

  // Dashboard
  'dash.title': { en: 'Candidate Dashboard', ar: 'لوحة التحكم للمرشح' },
  'dash.welcome': { en: 'Welcome back', ar: 'مرحباً بعودتك' },
  'dash.target_role': { en: 'Target role', ar: 'الوظيفة المستهدفة' },
  'dash.not_generated': { en: 'Not generated yet', ar: 'لم يتم الإنشاء بعد' },
  'dash.milestones_status': { en: 'milestones completed', ar: 'من المراحل المكتملة' },
  'dash.open_curriculum': { en: 'Open Curriculum', ar: 'عرض المنهج التعليمي' },
  'dash.this_month': { en: 'Overall Progress', ar: 'التقدم العام' },
  'dash.roadmap_complete': { en: 'Roadmap complete', ar: 'من خارطة الطريق مكتمل' },
  'dash.milestones_completed': { en: 'Milestones completed', ar: 'المراحل المكتملة' },
  'dash.last_7_weeks': { en: 'Adaptive Learning Path', ar: 'مسار التعلم التكيفي' },
  'dash.total_modules': { en: 'Total modules', ar: 'إجمالي الوحدات' },
  'dash.job_matches': { en: 'Job matches', ar: 'تطابقات الوظائف' },
  'dash.module_status': { en: 'Module Status', ar: 'حالة الوحدات الدراسية' },
  'dash.status_completed': { en: 'Completed', ar: 'مكتمل' },
  'dash.status_in_progress': { en: 'In progress', ar: 'قيد الدراسة' },
  'dash.status_locked': { en: 'Locked', ar: 'مغلق' },
  'dash.overall_completion': { en: 'Overall completion', ar: 'نسبة الإنجاز الإجمالية' },
  'dash.next_rec': { en: 'Next Recommended', ar: 'الخطوة التالية الموصى بها' },
  'dash.take_quiz': { en: 'Take Quiz', ar: 'ابدأ الاختبار' },
  'dash.view_roadmap': { en: 'View Roadmap', ar: 'عرض الخارطة' },

  // CV Builder
  'cv.title': { en: 'CV Profile Builder', ar: 'منشئ ملف السيرة الذاتية' },
  'cv.upload': { en: 'Upload CV (PDF/Doc)', ar: 'تحميل السيرة الذاتية (PDF/Doc)' },
  'cv.save': { en: 'Save Profile', ar: 'حفظ الملف الشخصي' },
  'cv.export': { en: 'Export PDF', ar: 'تصدير بصيغة PDF' },
  'cv.personal': { en: 'Personal Info', ar: 'المعلومات الشخصية' },
  'cv.experience': { en: 'Experience', ar: 'الخبرات المهنية' },
  'cv.education': { en: 'Education', ar: 'التعليم والأكاديميا' },
  'cv.skills': { en: 'Skills & Tags', ar: 'المهارات والتصنيفات' },
  'cv.name': { en: 'Full Name', ar: 'الاسم الكامل' },
  'cv.email': { en: 'Email Address', ar: 'البريد الإلكتروني' },
  'cv.phone': { en: 'Phone Number', ar: 'رقم الهاتف' },
  'cv.summary': { en: 'Professional Summary', ar: 'الملخص المهني' },
  'cv.add_exp': { en: '+ Add Work Experience', ar: '+ إضافة خبرة عمل' },
  'cv.company': { en: 'Company', ar: 'الشركة / المؤسسة' },
  'cv.role': { en: 'Role / Title', ar: 'المسمى الوظيفي' },
  'cv.start': { en: 'Start Date', ar: 'تاريخ البدء' },
  'cv.end': { en: 'End Date', ar: 'تاريخ الانتهاء' },
  'cv.description': { en: 'Key accomplishments and duties', ar: 'أبرز الإنجازات والمهام الوظيفية' },
  'cv.enhance': { en: '✨ Enhance Accomplishments with AI', ar: '✨ تحسين الإنجازات بالذكاء الاصطناعي' },
  'cv.add_edu': { en: '+ Add Education Record', ar: '+ إضافة سجل تعليمي' },
  'cv.school': { en: 'School / University', ar: 'المدرسة / الجامعة' },
  'cv.degree': { en: 'Degree (e.g. Bachelor)', ar: 'الدرجة العلمية (مثال: بكالوريوس)' },
  'cv.field': { en: 'Field of Study', ar: 'التخصص الدراسي' },
  'cv.grad_date': { en: 'Graduation Date', ar: 'تاريخ التخرج' },
  'cv.skills_list': { en: 'Verified Skills Cloud', ar: 'سحابة المهارات المعتمدة' },
  'cv.skills_tip': { en: 'These skills are linked directly to your quiz credentials.', ar: 'ترتبط هذه المهارات تلقائياً بنتائج التقييمات التي اجتزتها.' },

  // Pricing
  'pricing.title': { en: 'Pricing', ar: 'خطط الأسعار' },
  'pricing.subtitle': { en: 'Start for free and scale as you grow.', ar: 'ابدأ مجاناً وقم بالترقية تدريجياً مع نمو أهدافك المهنية.' },
  'pricing.free': { en: 'Free', ar: 'المجانية' },
  'pricing.free_desc': { en: '1 roadmap generation', ar: 'إنشاء خارطة طريق واحدة' },
  'pricing.pro': { en: 'Pro', ar: 'المحترفة' },
  'pricing.pro_desc': { en: 'Unlimited roadmaps', ar: 'خرائط طريق غير محدودة' },
  'pricing.scale': { en: 'Scale', ar: 'الموسعة' },
  'pricing.scale_desc': { en: 'Hiring tools included', ar: 'أدوات التوظيف متضمنة' },
  'pricing.enterprise': { en: 'Enterprise', ar: 'الشركات' },
  'pricing.enterprise_desc': { en: 'A plan based on your needs', ar: 'خطة مخصصة تلبي احتياجات مؤسستك' },
  'pricing.get_started': { en: 'Get started', ar: 'ابدأ الآن' },
  'pricing.contact': { en: 'Contact us', ar: 'اتصل بنا' },
  'pricing.faq': { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة' },
  'pricing.testimonials': { en: 'Success Stories', ar: 'قصص نجاح عملائنا' },

  // Hiring (Job Match)
  'hiring.pipeline': { en: 'AI Matchmaking Pipeline', ar: 'نظام المطابقة المعتمد على الذكاء الاصطناعي' },
  'hiring.title': { en: 'Your Recommended Career Matches', ar: 'فرص العمل الموصى بها لك' },
  'hiring.desc': { en: 'Jobs are sorted dynamically by semantic compatibility with your completed course milestones.', ar: 'يتم ترتيب الوظائف ديناميكياً وفقاً للتطابق الدلالي مع معالم التعلم التي أتممتها.' },
  'hiring.view_timeline': { en: 'View Roadmap Timeline', ar: 'عرض الجدول الزمني للخارطة' },
  'hiring.similarity': { en: 'Similarity:', ar: 'نسبة التطابق:' },
  'hiring.match': { en: 'Match', ar: 'تطابق' },
  'hiring.required': { en: 'Required Skills:', ar: 'المهارات المطلوبة:' },
  'hiring.gap_detected': { en: 'Missing Skills Gap detected:', ar: 'تم رصد فجوة مهارات مفقودة:' },
  'hiring.gap_tip': { en: 'Add these skills to your learning nodes to achieve 100% compatibility.', ar: 'أضف هذه المهارات إلى مسارك للوصول إلى نسبة تطابق كاملة ١٠٠٪.' },
  'hiring.no_gap': { en: '100% Verified Skill Compatibility! No gaps detected.', ar: 'تطابق تام وموثق بنسبة ١٠٠٪! لم يتم رصد أي فجوات مهارية.' },
  'hiring.add_gaps': { en: '⚡ Add Gaps to Roadmap', ar: '⚡ أضف الفجوات إلى خارطتي' },
  'hiring.apply': { en: 'Apply Instantly', ar: 'تقدم بطلبك فوراً' },

  // Roadmap
  'road.target_role': { en: 'LEARNING ROADMAP FOR:', ar: 'خارطة طريق التعلم لوظيفة:' },
  'road.title_label': { en: 'Path:', ar: 'المسار الدراسي:' },
  'road.hours': { en: 'Estimated Hours', ar: 'ساعة تقديرية' },
  'road.regenerate': { en: 'Re-generate', ar: 'إعادة إنشاء' },
  'road.upgrade': { en: 'Upgrade to Pro', ar: 'الترقية للمحترفين' },
  'road.milestones': { en: 'Syllabus Milestones', ar: 'المراحل المنهجية المكتملة' },
  'road.details_title': { en: 'Milestone details', ar: 'تفاصيل المرحلة التعليمية' },
  'road.syllabus': { en: 'Module syllabus', ar: 'المنهج التفصيلي للوحدة' },
  'road.resources': { en: 'Verified learning resources', ar: 'مصادر تعليمية موثقة' },
  'road.study_guide': { en: 'Comprehensive Study Guide', ar: 'دليل دراسي شامل ومفصل' },
  'road.video_tutorial': { en: 'Video Tutorial Walkthroughs', ar: 'دروس فيديو تعليمية وتطبيقية' },
  'road.locked': { en: '🔒 Module Locked', ar: '🔒 الوحدة مقفلة حالياً' },
  'road.prove_skill': { en: 'Prove Skill & Unlock Next ⚡️', ar: 'أثبت مهارتك وافتح التالي ⚡️' },

  // Contact
  'contact.subtitle': { en: 'SmartRoadmap • Contact us', ar: 'خارطة الطريق الذكية • اتصل بنا' },
  'contact.title': { en: 'Contact us', ar: 'تواصل معنا' },
  'contact.desc': { en: 'Get in touch and ask us anything. Whether it&apos;s about building a roadmap, verifying a skill, or sourcing candidates — we answer it all.', ar: 'تواصل معنا واسألنا عن أي شيء. سواء كان ذلك يتعلق بإنشاء مسار تعليمي، أو إثبات مهارة، أو توظيف الكوادر الفنية — نحن نجيبك على كل شيء.' },
  'contact.name': { en: 'Your name', ar: 'الاسم بالكامل' },
  'contact.email': { en: 'Email address', ar: 'البريد الإلكتروني' },
  'contact.phone_placeholder': { en: '100 1234567', ar: '100 1234567' },
  'contact.interest': { en: 'Interested in', ar: 'الاستفسار بخصوص' },
  'contact.message': { en: 'How can we help?', ar: 'كيف يمكننا مساعدتك؟' },
  'contact.btn': { en: 'Send your message', ar: 'إرسال الرسالة' },
  'contact.terms_warning': { en: 'By clicking, you agree to our Terms & Conditions, and Privacy Policy.', ar: 'بالنقر هنا، فإنك توافق على الشروط والأحكام وسياسة الخصوصية الخاصة بنا.' },
  'contact.success_title': { en: 'Message sent', ar: 'تم إرسال الرسالة بنجاح' },
  'contact.success_desc': { en: 'We will get back to you within one business day.', ar: 'سنتواصل معك خلال يوم عمل واحد كحد أقصى.' },
  'contact.address': { en: 'Address', ar: 'العنوان الجغرافي' },
  'contact.newsletter_title': { en: 'Get expert tips and career insights', ar: 'احصل على نصائح الخبراء ورؤى وظيفية مميزة' },
  'contact.newsletter_btn': { en: 'Subscribe', ar: 'اشتراك النشرة' },

  // Onboarding
  'onboard.step1': { en: 'Goal Selection', ar: 'تحديد الهدف' },
  'onboard.step2': { en: 'Background', ar: 'الخلفية المهنية' },
  'onboard.step3': { en: 'Skills Mapping', ar: 'تحديد المهارات' },
  'onboard.step4': { en: 'Generating', ar: 'جاري إنشاء المسار' },
  'onboard.title': { en: 'Personalize Your Syllabus Path', ar: 'تخصيص مسارك التعليمي الموجه' },
  'onboard.subtitle': { en: 'SmartRoadmap generates a tailored technical path to prepare you directly for this role.', ar: 'خارطة الطريق الذكية تبني لك مساراً تقنياً مخصصاً يجهزك للعمل مباشرة.' },
  'onboard.custom_divider': { en: 'OR DEFINE A CUSTOM ROLE', ar: 'أو حدد دوراً وظيفياً مخصصاً يدوياً' },
  'onboard.custom_placeholder': { en: 'e.g. Cloud Security Engineer', ar: 'مثال: مهندس أمن الحوسبة السحابية' },
  'onboard.edu_label': { en: 'Educational Path', ar: 'المسار التعليمي والتعليم الأساسي' },
  'onboard.exp_label': { en: 'Years of software experience', ar: 'سنوات الخبرة في تطوير البرمجيات' },
  'onboard.skills_subtitle': { en: 'SmartRoadmap will skip the topics you already know or adjust modules accordingly.', ar: 'ستقوم الخارطة بتخطي الموضوعات التي تتقنها بالفعل لضبط المسار تلقائياً.' },
  'onboard.btn_next': { en: 'Next Step', ar: 'الخطوة التالية' },
  'onboard.btn_back': { en: 'Back', ar: 'الرجوع' },
  'onboard.btn_submit': { en: 'Generate My Roadmap ⚡️', ar: 'أنشئ خارطة طريقي الآن ⚡️' },

  // Redesigned Settings
  'profile.header.search': { en: 'Search...', ar: 'البحث...' },
  'profile.header.welcome': { en: 'Welcome', ar: 'مرحباً' },
  'profile.sidebar.home': { en: 'Home', ar: 'الرئيسية' },
  'profile.sidebar.popular': { en: 'Popular Blogs', ar: 'مقالات شائعة' },
  'profile.sidebar.activity': { en: 'Your Activity', ar: 'نشاطك' },
  'profile.sidebar.saved': { en: 'Saved Blogs', ar: 'مقالات محفوظة' },
  'profile.sidebar.settings': { en: 'Settings', ar: 'الإعدادات' },
  'profile.sidebar.logout': { en: 'Logout', ar: 'تسجيل الخروج' },
  'profile.tabs.account': { en: 'Account Settings', ar: 'إعدادات الحساب' },
  'profile.tabs.security': { en: 'Login & Security', ar: 'الأمان والدخول' },
  'profile.tabs.notifications': { en: 'Notification Settings', ar: 'إعدادات الإشعارات' },
  'profile.tabs.interface': { en: 'Interface', ar: 'تخصيص الواجهة' },
  'profile.tabs.danger': { en: 'Additional Settings', ar: 'إعدادات إضافية' },
  'profile.form.avatar': { en: 'Your Profile Picture', ar: 'الصورة الشخصية' },
  'profile.form.upload': { en: 'Upload New', ar: 'تحميل جديد' },
  'profile.form.remove': { en: 'Remove Profile Picture', ar: 'إزالة الصورة' },
  'profile.form.name': { en: 'Full name', ar: 'الاسم بالكامل' },
  'profile.form.email': { en: 'Email address', ar: 'البريد الإلكتروني' },
  'profile.form.username': { en: 'Username', ar: 'اسم المستخدم' },
  'profile.form.phone': { en: 'Phone number', ar: 'رقم الهاتف' },
  'profile.form.bio': { en: 'Bio', ar: 'نبذة تعريفية' },
  'profile.form.update': { en: 'Update Profile', ar: 'تحديث الحساب' },
  'profile.form.verified': { en: 'Verified', ar: 'موثق' },

  // Redesigned CV Builder
  'cv.header.resume': { en: 'Resume', ar: 'السيرة الذاتية' },
  'cv.header.create': { en: 'Create resume', ar: 'إنشاء سيرة ذاتية' },
  'cv.header.search': { en: 'Search...', ar: 'البحث...' },
  'cv.header.upload': { en: 'Upload resume...', ar: 'تحميل سيرة ذاتية...' },
  'cv.header.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'cv.header.save': { en: 'Save', ar: 'حفظ' },
  'cv.form.complication': { en: 'Resume complication', ar: 'نسبة اكتمال السيرة' },
  'cv.tabs.fillin': { en: 'Fill in', ar: 'ملء البيانات' },
  'cv.tabs.guidance': { en: 'Guidance', ar: 'توجيهات' },
  'cv.tabs.analysis': { en: 'Analysis', ar: 'التحليل' },
  'cv.tabs.matching': { en: 'Matching', ar: 'المطابقة' },
  'cv.tabs.design': { en: 'Design', ar: 'التصميم' },
  'cv.tabs.cover': { en: 'Cover letter', ar: 'خطاب التقديم' },
  'cv.form.basic': { en: 'Basic Information', ar: 'المعلومات الأساسية' },
  'cv.form.photo_title': { en: 'Upload your photo', ar: 'تحميل صورتك الشخصية' },
  'cv.form.photo_desc': { en: 'Upload files up to 2.0 MB in size. Only JPG/PNG formatted files are allowed.', ar: 'يصل حجم الملف إلى ٢ ميجابايت كحد أقصى. يُسمح فقط بتنسيق JPG/PNG.' },
  'cv.form.photo_btn': { en: 'Browse photo', ar: 'تصفح الصور' },
  'cv.form.first_name': { en: 'First name', ar: 'الاسم الأول' },
  'cv.form.last_name': { en: 'Last name', ar: 'اسم العائلة' },
  'cv.form.pro_title': { en: 'Professional Title', ar: 'المسمى المهني' },
  'cv.form.career_obj': { en: 'Career Objectives', ar: 'الهدف المهني' },
  'cv.form.add_section': { en: '+ Add section', ar: '+ إضافة قسم' },
  'cv.sidebar.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'cv.sidebar.resumes': { en: 'Resumes', ar: 'السير الذاتية' },
  'cv.sidebar.jobs': { en: 'Job offer', ar: 'عروض الوظائف' },
  'cv.sidebar.applied': { en: 'Applied job', ar: 'الوظائف المقدمة' },
  'cv.sidebar.saved': { en: 'Saved job', ar: 'الوظائف المحفوظة' },
  'cv.sidebar.message': { en: 'Message', ar: 'الرسائل' },
  'cv.sidebar.notification': { en: 'Notification', ar: 'التنبيهات' },
  'cv.sidebar.profile': { en: 'My profile', ar: 'ملفي الشخصي' },
  'cv.sidebar.settings': { en: 'Settings', ar: 'الإعدادات' },
  'cv.sidebar.help': { en: 'Help & Support', ar: 'المساعدة والدعم' },
  'cv.sidebar.upgrade': { en: 'Experience the improved dashboard. Upgrade plan', ar: 'جرب لوحة التحكم المحسنة بالكامل. ترقية الباقة' },
};

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('smartlight');
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load configuration on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('smart_theme') as Theme;
    const savedLocale = localStorage.getItem('smart_locale') as Locale;

    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'smartlight');
    }

    if (savedLocale) {
      setLocaleState(savedLocale);
      document.documentElement.setAttribute('lang', savedLocale);
      document.documentElement.setAttribute('dir', savedLocale === 'ar' ? 'rtl' : 'ltr');
    } else {
      document.documentElement.setAttribute('lang', 'en');
      document.documentElement.setAttribute('dir', 'ltr');
    }

    // Register PWA service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('PWA ServiceWorker registered with scope:', reg.scope))
        .catch((err) => console.error('PWA ServiceWorker registration failed:', err));
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('smart_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'smartlight' ? 'smartdark' : 'smartlight';
    setTheme(nextTheme);
  };

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('smart_locale', newLocale);
    document.documentElement.setAttribute('lang', newLocale);
    document.documentElement.setAttribute('dir', newLocale === 'ar' ? 'rtl' : 'ltr');
  };

  const toggleLocale = () => {
    const nextLocale = locale === 'en' ? 'ar' : 'en';
    setLocale(nextLocale);
  };

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return item[locale] || item['en'] || key;
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        locale,
        setLocale,
        toggleLocale,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
}
