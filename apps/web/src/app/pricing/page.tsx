'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/AppContext';

type FeatureRow = {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  scale: boolean | string;
  enterprise: boolean | string;
};

type FeatureSection = {
  title: string;
  rows: FeatureRow[];
};

// Local dictionary for pricing-specific elements
const pricingDict = {
  'pricing.title': { en: 'Pricing Plans', ar: 'خطط الأسعار' },
  'pricing.subtitle': { en: 'Start for free and scale as you grow.', ar: 'ابدأ مجاناً وقم بالترقية تدريجياً بما يتناسب مع نموك المهني.' },
  
  // Tiers
  'free.title': { en: 'Free', ar: 'المجانية' },
  'free.desc': { en: '1 roadmap generation', ar: 'إنشاء خارطة طريق واحدة' },
  'free.price': { en: '$0', ar: '٠ دولار' },
  'free.period': { en: '/ mo', ar: ' / شهرياً' },
  'free.cta': { en: 'Get started', ar: 'ابدأ الآن' },

  'pro.title': { en: 'Pro', ar: 'المحترفة' },
  'pro.desc': { en: 'Unlimited roadmaps', ar: 'خرائط طريق غير محدودة' },
  'pro.price': { en: '$9', ar: '٩ دولارات' },
  'pro.period': { en: '/ mo', ar: ' / شهرياً' },
  'pro.cta': { en: 'Get started', ar: 'ابدأ الآن' },

  'scale.title': { en: 'Scale', ar: 'الموسعة' },
  'scale.desc': { en: 'Hiring tools included', ar: 'أدوات التوظيف متضمنة' },
  'scale.price': { en: '$49', ar: '٤٩ دولاراً' },
  'scale.period': { en: '/ mo', ar: ' / شهرياً' },
  'scale.cta': { en: 'Get started', ar: 'ابدأ الآن' },

  'ent.title': { en: 'Enterprise', ar: 'المؤسسات' },
  'ent.desc': { en: 'A plan based on your needs', ar: 'خطة مخصصة تلبي احتياجاتك' },
  'ent.price': { en: 'Custom', ar: 'مخصص' },
  'ent.period': { en: '', ar: '' },
  'ent.cta': { en: 'Contact us', ar: 'اتصل بنا' },

  // Features list
  'free.f1': { en: 'Community support', ar: 'دعم مجتمعي' },
  'free.f2': { en: 'Basic adaptive quizzes', ar: 'اختبارات تقييم مبسطة' },
  'free.f3': { en: '1 day data retention', ar: 'حفظ البيانات لمدة يوم واحد' },
  'free.f4': { en: '1 team member', ar: 'عضو فريق واحد' },
  'free.f5': { en: 'Single sign-on', ar: 'تسجيل دخول موحد' },

  'pro.f2': { en: 'RAG study guides', ar: 'أدلة دراسية تفاعلية (RAG)' },
  'pro.f3': { en: '30 days data retention', ar: 'حفظ البيانات لمدة ٣٠ يوماً' },
  'pro.f4': { en: '3 team members', ar: '٣ أعضاء للفريق' },

  'scale.f1': { en: 'Slack & ticket support', ar: 'دعم فني عبر سلاك والتذاكر' },
  'scale.f2': { en: 'Vector candidate matching', ar: 'مطابقة دلالية للمرشحين' },
  'scale.f3': { en: '1 year data retention', ar: 'حفظ البيانات لمدة سنة كاملة' },
  'scale.f4': { en: '25 team members', ar: '٢٥ عضواً للفريق' },

  'ent.f1': { en: 'Priority support', ar: 'دعم ذو أولوية عالية' },
  'ent.f2': { en: 'Dedicated success manager', ar: 'مدير نجاح عملاء مخصص' },
  'ent.f3': { en: 'Flexible data retention', ar: 'فترات مرنة لحفظ البيانات' },
  'ent.f4': { en: 'Flexible team size', ar: 'أحجام فريق مرنة' },

  // Add-ons
  'addons.title': { en: 'Add-ons', ar: 'الإضافات والخدمات الملحقة' },
  'addons.box_title': { en: 'Proctored assessments — $15 / session pack', ar: 'اختبارات مراقبة موثقة — ١٥ دولاراً لباقة الجلسات' },
  'addons.box_desc': { en: 'Add identity verification and screen monitoring to any quiz on the Scale plan, so recruiters can trust verification scores at face value.', ar: 'أضف ميزة التحقق من الهوية ومراقبة الشاشة لأي اختبار في باقة Scale، لكي يثق مسؤولو التوظيف بالنتائج مباشرة.' },
  'addons.btn': { en: 'Request proctoring', ar: 'طلب اختبار مراقب' },

  // Comparative sections
  'comp.learning': { en: 'Learning & Roadmaps', ar: 'التعلم وخرائط الطريق' },
  'comp.assess': { en: 'Assessments & Verification', ar: 'التقييمات والتوثيق' },
  'comp.hiring': { en: 'Hiring & Talent Tools', ar: 'أدوات التوظيف واستقطاب المواهب' },
  'comp.security': { en: 'Security & Privacy', ar: 'الأمان والخصوصية' },
  'comp.support': { en: 'Customer Support', ar: 'دعم ومساعدة العملاء' },

  // FAQs
  'faq.title': { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة والاستفسارات' },
  
  // CTA bottom
  'cta.title': { en: 'Start learning this afternoon', ar: 'ابدأ التعلم والمذاكرة اليوم' },
  'cta.desc': { en: 'SmartRoadmap builds your first adaptive path in under two minutes.', ar: 'تبني خارطة الطريق الذكية مسارك التفاعلي الأول في أقل من دقيقتين.' },
  'cta.btn': { en: 'Sign up for free', ar: 'سجل مجاناً الآن' },
};

const FEATURE_SECTIONS = (t: (k: string) => string): FeatureSection[] => [
  {
    title: t('comp.learning'),
    rows: [
      { label: 'Daily roadmap generations', free: '1', pro: 'No limit', scale: 'No limit', enterprise: 'No limit' },
      { label: 'AI dependency graph builder', free: true, pro: true, scale: true, enterprise: true },
      { label: 'Adaptive difficulty pacing', free: true, pro: true, scale: true, enterprise: true },
      { label: 'Custom skill targets', free: false, pro: true, scale: true, enterprise: true },
      { label: 'RAG-backed study guides', free: false, pro: true, scale: true, enterprise: true },
      { label: 'Team learning paths', free: false, pro: false, scale: true, enterprise: true },
      { label: 'Roadmap history retention', free: '1 day', pro: '30 days', scale: '1 year', enterprise: 'Flexible' },
    ],
  },
  {
    title: t('comp.assess'),
    rows: [
      { label: 'Adaptive quizzes', free: true, pro: true, scale: true, enterprise: true },
      { label: 'Verified skill badges', free: true, pro: true, scale: true, enterprise: true },
      { label: 'Custom question banks', free: false, pro: false, scale: true, enterprise: true },
      { label: 'Proctored sessions', free: false, pro: false, scale: true, enterprise: 'With Add-on' },
      { label: 'Score export & reporting', free: false, pro: true, scale: true, enterprise: true },
    ],
  },
  {
    title: t('comp.hiring'),
    rows: [
      { label: 'Candidate visibility', free: false, pro: false, scale: true, enterprise: true },
      { label: 'Vector skill matching', free: false, pro: false, scale: true, enterprise: true },
      { label: 'Job posting slots', free: '0', pro: '0', scale: '5', enterprise: 'Flexible' },
      { label: 'Bulk candidate export', free: false, pro: false, scale: false, enterprise: true },
      { label: 'ATS integration', free: false, pro: false, scale: 'With Add-on', enterprise: true },
    ],
  },
  {
    title: t('comp.security'),
    rows: [
      { label: 'Single sign-on', free: false, pro: false, scale: true, enterprise: true },
      { label: 'Team members', free: '1', pro: '3', scale: '25', enterprise: 'Flexible' },
      { label: 'GDPR compliance', free: true, pro: true, scale: true, enterprise: true },
      { label: 'SOC 2 Type II', free: false, pro: false, scale: true, enterprise: true },
      { label: 'Audit logs', free: false, pro: false, scale: true, enterprise: true },
    ],
  },
  {
    title: t('comp.support'),
    rows: [
      { label: 'Community support', free: true, pro: true, scale: true, enterprise: true },
      { label: 'Email support', free: false, pro: true, scale: true, enterprise: true },
      { label: 'Priority response SLA', free: false, pro: false, scale: true, enterprise: true },
      { label: 'Dedicated success manager', free: false, pro: false, scale: false, enterprise: true },
    ],
  },
];

const FAQS = [
  {
    q: { en: 'Do you offer any discounts for annual subscriptions?', ar: 'هل تقدمون أي خصومات للاشتراكات السنوية؟' },
    a: { en: 'Yes — switching to annual billing on Pro or Scale saves you the equivalent of two months compared to paying monthly.', ar: 'نعم — التبديل للفواتير السنوية في باقة Pro أو Scale يوفر لك ما يعادل شهرين مقارنة بالدفع الشهري.' },
  },
  {
    q: { en: 'What payment methods do you accept?', ar: 'ما هي طرق الدفع المقبولة لديكم؟' },
    a: { en: 'We accept all major credit and debit cards. Enterprise plans can also be invoiced and paid by bank transfer.', ar: 'نقبل جميع بطاقات الائتمان والخصم المباشر الرئيسية. يمكن أيضاً إصدار فواتير لخطط الشركات الكبرى ودفعها عن طريق تحويل بنكي.' },
  },
  {
    q: { en: 'Is there a free trial available?', ar: 'هل تتوفر فترة تجريبية مجانية؟' },
    a: { en: 'The Free tier has no time limit, so you can build one roadmap and try the full assessment flow before upgrading.', ar: 'الباقة المجانية ليس لها حد زمني، لذا يمكنك بناء مسار تعليمي واحد وتجربة تدفق التقييم الكامل قبل الترقية.' },
  },
  {
    q: { en: 'Who can I contact about a custom plan?', ar: 'بمن يمكنني الاتصال بشأن خطة مخصصة لمؤسستي؟' },
    a: { en: 'Reach out through the contact page and our team will follow up within one business day to scope an Enterprise plan.', ar: 'تواصل معنا عبر صفحة الاتصال بنا، وسيقوم فريقنا بالمتابعة معك خلال يوم عمل واحد لتحديد احتياجات خطة الشركات.' },
  },
  {
    q: { en: 'What happens if I exceed my plan limits?', ar: 'ماذا يحدث إذا تجاوزت حدود خطتي الحالية؟' },
    a: { en: 'We will notify you before any feature is restricted, and you can upgrade at any time without losing your progress.', ar: 'سنقوم بإخطارك مسبقاً قبل تقييد أي ميزة، ويمكنك الترقية في أي وقت دون أن تفقد تقدمك الحالي.' },
  },
];

const TESTIMONIALS = [
  {
    quote: { en: 'SmartRoadmap took the guesswork out of what to study next. I went from scattered tutorials to a real plan.', ar: 'لقد أزال هذا البرنامج الحيرة بشأن ما يجب دراسته تالياً. تحولت من تصفح عشوائي للمقاطع التعليمية إلى مسار دراسي منظم وموثق.' },
    name: 'Mostafa Hassan',
    role: { en: 'Frontend Candidate', ar: 'مرشح واجهات أمامية' },
  },
  {
    quote: { en: 'Our screening time dropped by half once we could filter by verified quiz scores instead of resumes alone.', ar: 'انخفض وقت تصفية المترشحين لدينا إلى النصف بمجرد قدرتنا على التصفية بناءً على نتائج الاختبارات المعتمدة بدلاً من السير الذاتية وحدها.' },
    name: 'Yara Fathy',
    role: { en: 'Talent Lead, Lattice', ar: 'مسؤولة المواهب في Lattice' },
  },
  {
    quote: { en: 'The quizzes adjust to how you answer. It feels like a real technical interview, not a static test.', ar: 'تتكيف الاختبارات وفقاً لإجاباتك السابقة. تشعر وكأنها مقابلة عمل فنية حقيقية مع مهندس خبير، وليست مجرد اختبار جامد.' },
    name: 'Karim Adel',
    role: { en: 'Backend Candidate', ar: 'مرشح تطوير خلفي' },
  },
];

const LOGOS = ['ANTHROPIC', 'ROBINHOOD', 'LOOM', 'DUOLINGO', 'DISCORD', 'GUSTO', 'NOTION', 'FIGMA'];

export default function PricingPage() {
  const { locale } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Local translate function
  const tLocal = (key: string): string => {
    const item = (pricingDict as any)[key];
    if (!item) return key;
    return item[locale] || item['en'] || key;
  };

  const translateFeatureVal = (value: boolean | string) => {
    if (value === true) {
      return (
        <span className="inline-flex w-5 h-5 rounded-full bg-success/15 text-success items-center justify-center text-xs font-bold">
          ✓
        </span>
      );
    }
    if (value === false) {
      return <span className="text-base-content/20 text-xs">–</span>;
    }
    if (value === 'No limit') {
      return locale === 'ar' ? 'بدون حد' : 'No limit';
    }
    if (value === 'Flexible') {
      return locale === 'ar' ? 'مرن' : 'Flexible';
    }
    if (value === 'With Add-on') {
      return locale === 'ar' ? 'مع خدمة ملحقة' : 'With Add-on';
    }
    if (value === '1 day') {
      return locale === 'ar' ? 'يوم واحد' : '1 day';
    }
    if (value === '30 days') {
      return locale === 'ar' ? '٣٠ يوماً' : '30 days';
    }
    if (value === '1 year') {
      return locale === 'ar' ? 'سنة واحدة' : '1 year';
    }
    return value;
  };

  return (
    <div className="bg-base-100 text-base-content min-h-screen">
      {/* Header */}
      <section className="pt-20 pb-10 px-4 text-center">
        <h1 className="font-serif text-5xl sm:text-6xl mb-3 font-semibold">{tLocal('pricing.title')}</h1>
        <p className="text-base-content/60 text-sm sm:text-base">{tLocal('pricing.subtitle')}</p>
      </section>

      {/* Tier Cards */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Free */}
          <div className="border border-base-300 rounded-xl p-6 flex flex-col bg-base-200">
            <h3 className="text-sm font-bold text-base-content/70 mb-4">{tLocal('free.title')}</h3>
            <div className="mb-1">
              <span className="text-3xl font-black font-mono">{tLocal('free.price')}</span>
              <span className="text-base-content/50 text-sm">{tLocal('free.period')}</span>
            </div>
            <p className="text-xs text-base-content/50 mb-6">{tLocal('free.desc')}</p>
            <ul className="space-y-2.5 text-xs text-base-content/70 mb-8 flex-grow">
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('free.f1')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('free.f2')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('free.f3')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('free.f4')}</li>
              <li className="flex gap-2 opacity-30"><span>–</span>{tLocal('free.f5')}</li>
            </ul>
            <a href="/auth/register" className="btn btn-outline border-base-300 text-base-content hover:bg-primary hover:text-white btn-sm rounded-lg">
              {tLocal('free.cta')}
            </a>
          </div>

          {/* Pro */}
          <div className="border-2 border-primary rounded-xl p-6 flex flex-col bg-base-200 relative">
            <div className="absolute top-0 right-0 bg-primary text-white text-[9px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-bl-xl">
              Popular
            </div>
            <h3 className="text-sm font-bold text-base-content/70 mb-4">{tLocal('pro.title')}</h3>
            <div className="mb-1">
              <span className="text-3xl font-black font-mono">{tLocal('pro.price')}</span>
              <span className="text-base-content/50 text-sm">{tLocal('pro.period')}</span>
            </div>
            <p className="text-xs text-base-content/50 mb-6">{tLocal('pro.desc')}</p>
            <ul className="space-y-2.5 text-xs text-base-content/70 mb-8 flex-grow">
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('free.f1')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('pro.f2')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('pro.f3')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('pro.f4')}</li>
              <li className="flex gap-2 opacity-30"><span>–</span>{tLocal('free.f5')}</li>
            </ul>
            <a href="/auth/register" className="btn btn-primary btn-sm rounded-lg text-white">
              {tLocal('pro.cta')}
            </a>
          </div>

          {/* Scale */}
          <div className="border border-base-300 rounded-xl p-6 flex flex-col bg-base-200">
            <h3 className="text-sm font-bold text-base-content/70 mb-4">{tLocal('scale.title')}</h3>
            <div className="mb-1">
              <span className="text-3xl font-black font-mono">{tLocal('scale.price')}</span>
              <span className="text-base-content/50 text-sm">{tLocal('scale.period')}</span>
            </div>
            <p className="text-xs text-base-content/50 mb-6">{tLocal('scale.desc')}</p>
            <ul className="space-y-2.5 text-xs text-base-content/70 mb-8 flex-grow">
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('scale.f1')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('scale.f2')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('scale.f3')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('scale.f4')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('free.f5')}</li>
            </ul>
            <a href="/pricing" className="btn btn-outline border-base-300 text-base-content hover:bg-primary hover:text-white btn-sm rounded-lg">
              {tLocal('scale.cta')}
            </a>
          </div>

          {/* Enterprise */}
          <div className="border border-base-300 rounded-xl p-6 flex flex-col bg-base-200">
            <h3 className="text-sm font-bold text-base-content/70 mb-4">{tLocal('ent.title')}</h3>
            <div className="mb-1">
              <span className="text-3xl font-black">{tLocal('ent.price')}</span>
            </div>
            <p className="text-xs text-base-content/50 mb-6">{tLocal('ent.desc')}</p>
            <ul className="space-y-2.5 text-xs text-base-content/70 mb-8 flex-grow">
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('ent.f1')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('ent.f2')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('ent.f3')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('ent.f4')}</li>
              <li className="flex gap-2"><span className="text-success font-bold">✓</span>{tLocal('free.f5')}</li>
            </ul>
            <a href="/contact" className="btn btn-neutral btn-sm rounded-lg border-none">
              {tLocal('ent.cta')}
            </a>
          </div>
        </div>
      </section>

      {/* Feature comparison tables */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto space-y-14">
          {FEATURE_SECTIONS(tLocal).map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-bold mb-4">{section.title}</h2>
              <div className="border border-base-300 rounded-xl overflow-hidden bg-base-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-base-300 bg-base-300">
                      <th className="text-start font-bold text-base-content/50 text-xs py-3 px-4"> </th>
                      {['Free', 'Pro', 'Scale', 'Enterprise'].map((t) => (
                        <th key={t} className="text-center font-bold text-base-content/50 text-xs py-3 px-4 w-24">
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row, i) => (
                      <tr key={row.label} className={i !== section.rows.length - 1 ? 'border-b border-base-300/60' : ''}>
                        <td className="text-start text-base-content/90 text-xs py-3 px-4">{row.label}</td>
                        <td className="text-center py-3 px-4">{translateFeatureVal(row.free)}</td>
                        <td className="text-center py-3 px-4">{translateFeatureVal(row.pro)}</td>
                        <td className="text-center py-3 px-4">{translateFeatureVal(row.scale)}</td>
                        <td className="text-center py-3 px-4">{translateFeatureVal(row.enterprise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold mb-4">{tLocal('addons.title')}</h2>
          <div className="border border-base-300 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-200">
            <div>
              <h3 className="font-bold text-sm mb-1">{tLocal('addons.box_title')}</h3>
              <p className="text-xs text-base-content/60 max-w-xl leading-relaxed">
                {tLocal('addons.box_desc')}
              </p>
            </div>
            <button className="btn btn-outline border-base-300 text-base-content hover:bg-primary hover:text-white btn-sm rounded-lg whitespace-nowrap">
              {tLocal('addons.btn')}
            </button>
          </div>
        </div>
      </section>

      {/* Trusted by logos */}
      <section className="px-4 pb-20 text-center">
        <p className="text-xs text-base-content/40 uppercase tracking-wider mb-8">Trusted by</p>
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center items-center gap-x-10 gap-y-6 opacity-40">
          {LOGOS.map((logo) => (
            <span key={logo} className="text-sm font-bold tracking-tight">{logo}</span>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-bold mb-6">{tLocal('pricing.faq')}</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={faq.q.en} className="border border-base-300 rounded-lg overflow-hidden bg-base-200">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center text-start px-4 py-3.5 text-sm hover:bg-base-300 transition-colors"
                >
                  <span>{locale === 'en' ? faq.q.en : faq.q.ar}</span>
                  <span className={`text-base-content/40 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs text-base-content/60 leading-relaxed">
                    {locale === 'en' ? faq.a.en : faq.a.ar}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="border border-base-300 rounded-xl p-5 bg-base-200">
              <p className="text-xs text-base-content/80 leading-relaxed mb-4">&ldquo;{locale === 'en' ? t.quote.en : t.quote.ar}&rdquo;</p>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                  {t.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-xs font-bold">{t.name}</p>
                  <p className="text-[10px] text-base-content/50">{locale === 'en' ? t.role.en : t.role.ar}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-20 text-center">
        <svg className="w-7 h-7 mx-auto mb-6 text-base-content/60" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15 8L22 9L17 14L18 21L12 17L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" />
        </svg>
        <h2 className="font-serif text-3xl sm:text-4xl mb-3 font-semibold">{tLocal('cta.title')}</h2>
        <p className="text-base-content/60 text-sm mb-7">
          {tLocal('cta.desc')}
        </p>
        <a href="/auth/register" className="btn btn-primary rounded-lg px-8 text-white">
          {tLocal('cta.btn')}
        </a>
      </section>
    </div>
  );
}