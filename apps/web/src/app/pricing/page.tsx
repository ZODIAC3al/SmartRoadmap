'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import { toast } from 'react-toastify';

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

// Local dictionary for translations
const pricingDict = {
  'pricing.title': { en: 'SaaS Career Intelligence Pricing', ar: 'أسعار باقات الذكاء المهني' },
  'pricing.subtitle': { en: 'Unlock premium AI career diagnostics, verified skill badges, and recruiter talent matching.', ar: 'افتح مزايا التشخيص المهني بالذكاء الاصطناعي، شارات المهارات المعتمدة، ومطابقة التوظيف.' },
  
  // Tiers
  'free.title': { en: 'Starter Free', ar: 'الباقة المجانية' },
  'free.desc': { en: 'Construct your first career roadmap.', ar: 'ابنِ خارطة طريقك المهنية الأولى.' },
  'free.price': { en: '$0', ar: '٠ دولار' },
  'free.period': { en: '/ month', ar: ' / شهرياً' },
  'free.cta': { en: 'Active Plan', ar: 'الباقة النشطة' },

  'pro.title': { en: 'Premium Pro', ar: 'المحترفة Pro' },
  'pro.desc': { en: 'Unlimited custom roadmaps & RAG guides.', ar: 'خرائط طريق غير محدودة وأدلة RAG مخصصة.' },
  'pro.price': { en: '$19.99', ar: '١٩.٩٩ دولار' },
  'pro.period': { en: '/ month', ar: ' / شهرياً' },
  'pro.cta': { en: 'Upgrade to Pro', ar: 'الترقية إلى Pro' },

  'scale.title': { en: 'Recruiter Scale', ar: 'الشركات Scale' },
  'scale.desc': { en: 'Access pre-vetted candidate list.', ar: 'تصفح وفلترة قائمة المرشحين المؤهلين.' },
  'scale.price': { en: '$99.99', ar: '٩٩.٩٩ دولار' },
  'scale.period': { en: '/ month', ar: ' / شهرياً' },
  'scale.cta': { en: 'Access Sourcing', ar: 'باقة التوظيف' },

  'ent.title': { en: 'Enterprise Custom', ar: 'المؤسسات الكبرى' },
  'ent.desc': { en: 'Tailored ATS integrations & SLAs.', ar: 'تكاملات ATS مخصصة واتفاقيات مستوى خدمة.' },
  'ent.price': { en: 'Custom', ar: 'مخصص' },
  'ent.period': { en: '', ar: '' },
  'ent.cta': { en: 'Contact Enterprise', ar: 'اتصل بنا للمؤسسات' },

  // Features list
  'free.f1': { en: '1 AI Roadmap generation', ar: 'خارطة طريق واحدة بالذكاء الاصطناعي' },
  'free.f2': { en: 'Basic adaptive quizzes', ar: 'اختبارات تقييم مهارات أساسية' },
  'free.f3': { en: '1 day data retention', ar: 'حفظ سجلات التعلم لمدة يوم' },
  'free.f4': { en: 'Single team member', ar: 'عضو مستخدم واحد' },
  'free.f5': { en: 'Public sharing link', ar: 'رابط مشاركة خارجي' },

  'pro.f1': { en: 'Unlimited roadmaps', ar: 'خرائط طريق غير محدودة' },
  'pro.f2': { en: 'RAG-backed study guides', ar: 'أدلة دراسية ذكية (RAG)' },
  'pro.f3': { en: '30 days data retention', ar: 'حفظ السجلات لمدة ٣٠ يوماً' },
  'pro.f4': { en: 'Verified skill badge on passport', ar: 'شارة المهارات المعتمدة في الـ Passport' },

  'scale.f1': { en: 'Pre-vetted candidate index', ar: 'تصفح قائمة الكوادر المؤهلة مسبقاً' },
  'scale.f2': { en: 'Vector skill match algorithm', ar: 'خوارزمية مطابقة المهارات الدلالية' },
  'scale.f3': { en: 'Unlimited active job postings', ar: 'وظائف معروضة غير محدودة' },
  'scale.f4': { en: 'Direct candidate contact requests', ar: 'طلبات اتصال وتواصل مباشرة مع المرشحين' },

  'ent.f1': { en: 'Priority support SLA', ar: 'أولوية دعم فني فائقة الاتفاق' },
  'ent.f2': { en: 'Dedicated success manager', ar: 'مدير نجاح عملاء مخصص' },
  'ent.f3': { en: 'Custom vector training indices', ar: 'فهارس تدريب دلالية مخصصة' },
  'ent.f4': { en: 'Unlimited user seats', ar: 'حسابات مستخدمين غير محدودة' },

  // Add-ons
  'addons.title': { en: 'Add-ons & Services', ar: 'الإضافات والخدمات الخاصة' },
  'addons.box_title': { en: 'Proctored assessments — $15 / session pack', ar: 'اختبارات مراقبة موثقة — ١٥ دولاراً لباقة الجلسات' },
  'addons.box_desc': { en: 'Add identity verification and screen monitoring to any quiz on the Scale plan, so recruiters can trust verification scores at face value.', ar: 'أضف ميزة التحقق من الهوية ومراقبة الشاشة لأي اختبار في باقة Scale، لكي يثق مسؤولو التوظيف بالنتائج مباشرة.' },
  'addons.btn': { en: 'Request proctoring', ar: 'طلب اختبار مراقب' },

  // Comparative sections
  'comp.learning': { en: 'Learning & Roadmaps', ar: 'التعلم وخرائط الطريق' },
  'comp.assess': { en: 'Assessments & Verification', ar: 'التقييمات والتوثيق' },
  'comp.hiring': { en: 'Hiring & Talent Tools', ar: 'أدوات التوظيف واستقطاب المواهب' },
  'comp.security': { en: 'Security & Privacy', ar: 'الأمان والخصوصية' },
  'comp.support': { en: 'Customer Support', ar: 'دعم ومساعدة العملاء' },
  'comp.support_desc': { en: 'Support channels per tier', ar: 'قنوات الدعم لكل باقة' },

  // FAQs
  'faq.title': { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة والاستفسارات' },
  
  // CTA bottom
  'cta.title': { en: 'Start proving your expertise today', ar: 'ابدأ في إثبات خبرتك اليوم' },
  'cta.desc': { en: 'Build your vetted career passport profile in minutes.', ar: 'أنشئ ملف جواز سفرك المهني المعتمد في دقائق.' },
  'cta.btn': { en: 'Get Started Free', ar: 'ابدأ مجاناً الآن' },
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
      { label: 'Job posting slots', free: '0', pro: '0', scale: 'Unlimited', enterprise: 'Flexible' },
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
    a: { en: 'We accept all major credit and debit cards, as well as PayPal secure transactions. Enterprise plans can also be invoiced and paid by bank transfer.', ar: 'نقبل بطاقات الائتمان والخصم بالإضافة إلى مدفوعات PayPal الآمنة. يمكن إعداد فواتير مخصصة للشركات الكبرى.' },
  },
  {
    q: { en: 'Is there a free trial available?', ar: 'هل تتوفر فترة تجريبية مجانية؟' },
    a: { en: 'The Free tier has no time limit, so you can build one roadmap and try the full assessment flow before upgrading.', ar: 'الباقة المجانية ليس لها حد زمني، لذا يمكنك بناء مسار تعليمي واحد وتجربة تدفق التقييم الكامل قبل الترقية.' },
  },
  {
    q: { en: 'Who can I contact about a custom plan?', ar: 'بمن يمكنني الاتصال بشأن خطة مخصصة لمؤسستي؟' },
    a: { en: 'Reach out through the contact page and our team will follow up within one business day to scope an Enterprise plan.', ar: 'تواصل معنا عبر صفحة الاتصال بنا، وسيقوم فريقنا بالمتابعة معك خلال يوم عمل واحد كحد أقصى.' },
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
  
  // Checkout variables
  const [user, setUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'scale' | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [paypalOrder, setPaypalOrder] = useState<any>(null);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [simulatedCard, setSimulatedCard] = useState({
    number: '4111 2222 3333 4444',
    expiry: '12/29',
    cvv: '123',
    name: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('smart_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSimulateLogin = (role: 'learner' | 'company') => {
    const mockUser = {
      id: `demo-${role}-${Math.random().toString(36).substring(2, 6)}`,
      name: role === 'learner' ? 'Mohamed Elsaied (Learner)' : 'Lattice HR (Employer)',
      email: role === 'learner' ? 'mohamed@smart.com' : 'recruiter@lattice.com',
      role: role
    };
    localStorage.setItem('smart_user', JSON.stringify(mockUser));
    localStorage.setItem('smart_token', 'demo-token');
    setUser(mockUser);
    toast.success(`Logged in as ${mockUser.name}!`);
  };

  const handleInitiateUpgrade = (plan: 'pro' | 'scale') => {
    setSelectedPlan(plan);
  };

  const handleCancelUpgrade = () => {
    setSelectedPlan(null);
    setPaypalOrder(null);
    setShowSimulatedModal(false);
    setIsProcessingCheckout(false);
  };

  const triggerPayPalCheckout = async () => {
    if (!user) {
      toast.error('Please authenticate to complete checkout');
      return;
    }
    
    setIsProcessingCheckout(true);
    const backendPlanName = selectedPlan === 'pro' ? 'pro_learner' : 'company_tier';

    try {
      const response = await fetch('http://localhost:3000/payment/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          plan: backendPlanName
        })
      });

      if (!response.ok) throw new Error('Order creation failed');
      const order = await response.json();
      setPaypalOrder(order);

      const approveLinkObj = order.links.find((l: any) => l.rel === 'approve');
      const approveHref = approveLinkObj ? approveLinkObj.href : '#';

      if (approveHref === '#') {
        // Mock mode is enabled on the backend. Open the high-fidelity mock payment terminal
        setShowSimulatedModal(true);
      } else {
        // Real PayPal Sandbox/Live integration. Redirect to the PayPal authorization portal
        toast.info('Redirecting to PayPal Checkout Sandbox...');
        window.location.href = approveHref;
      }
    } catch (e) {
      console.warn('Backend payment integration unavailable. Defaulting to local simulator interface.');
      // Create a mock order client-side to ensure the checkout always remains fully testable
      const clientMockOrder = {
        id: 'PAYPAL-MOCK-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        status: 'CREATED',
        links: [{ href: '#', rel: 'approve', method: 'GET' }]
      };
      setPaypalOrder(clientMockOrder);
      setShowSimulatedModal(true);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const captureSimulatedPayment = async () => {
    if (!paypalOrder) return;
    setIsProcessingCheckout(true);

    try {
      const response = await fetch(`http://localhost:3000/payment/orders/${paypalOrder.id}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Capture failed');
      const result = await response.json();

      // Upgrade local user token settings if needed
      const upgradedUser = { ...user, role: selectedPlan === 'pro' ? 'learner' : 'company' };
      localStorage.setItem('smart_user', JSON.stringify(upgradedUser));
      setUser(upgradedUser);

      toast.success(`Payment captured! Upgraded to ${selectedPlan === 'pro' ? 'Premium Pro' : 'Recruiter Scale'} Tier!`);
      handleCancelUpgrade();
    } catch (e) {
      // Local fallback simulation
      const upgradedUser = { ...user, role: selectedPlan === 'pro' ? 'learner' : 'company' };
      localStorage.setItem('smart_user', JSON.stringify(upgradedUser));
      setUser(upgradedUser);
      toast.success(`Simulation completed! Upgraded to ${selectedPlan === 'pro' ? 'Premium Pro' : 'Recruiter Scale'}!`);
      handleCancelUpgrade();
    }
  };

  const tLocal = (key: string): string => {
    const item = (pricingDict as any)[key];
    if (!item) return key;
    return item[locale] || item['en'] || key;
  };

  const translateFeatureVal = (value: boolean | string) => {
    if (value === true) {
      return (
        <span className="inline-flex w-5 h-5 rounded-full bg-[#10B981]/15 text-[#059669] items-center justify-center text-xs font-bold font-mono">
          ✓
        </span>
      );
    }
    if (value === false) {
      return <span className="text-base-content/30 text-xs font-mono">–</span>;
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
    <div className="bg-base-100 text-base-content min-h-screen font-sans selection:bg-[#10B981] selection:text-white">
      
      {/* Header */}
      <section className="pb-12 px-4 text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/25 text-[#059669] px-4 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider font-semibold">
          Transparent Subscriptions
        </span>
        <h1 className="text-display-lg tracking-tight font-extrabold text-base-content leading-none">
          {tLocal('pricing.title')}
        </h1>
        <p className="text-body-md text-base-content/70 max-w-xl mx-auto">
          {tLocal('pricing.subtitle')}
        </p>
      </section>

      {/* Pricing Cards Grid */}
      <section className="px-4 pb-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* Free Tier */}
          <div className="border border-base-300 bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-[#10B981]/30 transition-all text-start">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">{tLocal('free.title')}</h3>
                <p className="text-[10px] text-base-content/50 font-mono mt-0.5">{tLocal('free.desc')}</p>
              </div>
              <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                <span className="text-4xl font-black font-mono text-base-content">{tLocal('free.price')}</span>
                <span className="text-base-content/50 text-xs font-mono">{tLocal('free.period')}</span>
              </div>
              <ul className="space-y-3 text-xs text-base-content/85">
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('free.f1')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('free.f2')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('free.f3')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('free.f4')}</li>
                <li className="flex gap-2 text-base-content/30"><span>–</span>{tLocal('free.f5')}</li>
              </ul>
            </div>
            <button className="w-full btn btn-outline border-base-300 text-base-content/40 hover:bg-transparent rounded-xl btn-sm mt-8 h-10 min-h-0 cursor-not-allowed">
              {tLocal('free.cta')}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="border-2 border-[#10B981] bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-md relative text-start">
            <div className="absolute top-0 right-0 bg-[#10B981] text-white text-[9px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-bl-xl">
              Learner Pick
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">{tLocal('pro.title')}</h3>
                <p className="text-[10px] text-base-content/50 font-mono mt-0.5">{tLocal('pro.desc')}</p>
              </div>
              <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                <span className="text-4xl font-black font-mono text-[#059669]">{tLocal('pro.price')}</span>
                <span className="text-base-content/50 text-xs font-mono">{tLocal('pro.period')}</span>
              </div>
              <ul className="space-y-3 text-xs text-base-content/85">
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('free.f1')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('pro.f1')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('pro.f2')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('pro.f3')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('pro.f4')}</li>
              </ul>
            </div>
            <button 
              onClick={() => handleInitiateUpgrade('pro')}
              className="w-full btn bg-[#10B981] hover:bg-[#059669] border-none text-white rounded-xl btn-sm mt-8 h-10 min-h-0"
            >
              {tLocal('pro.cta')}
            </button>
          </div>

          {/* Scale Tier */}
          <div className="border border-base-300 bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-[#10B981]/30 transition-all text-start">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">{tLocal('scale.title')}</h3>
                <p className="text-[10px] text-base-content/50 font-mono mt-0.5">{tLocal('scale.desc')}</p>
              </div>
              <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                <span className="text-4xl font-black font-mono text-base-content">{tLocal('scale.price')}</span>
                <span className="text-base-content/50 text-xs font-mono">{tLocal('scale.period')}</span>
              </div>
              <ul className="space-y-3 text-xs text-base-content/85">
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('scale.f1')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('scale.f2')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('scale.f3')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('scale.f4')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('free.f5')}</li>
              </ul>
            </div>
            <button 
              onClick={() => handleInitiateUpgrade('scale')}
              className="w-full btn btn-outline border-base-300 text-base-content hover:bg-base-300 rounded-xl btn-sm mt-8 h-10 min-h-0"
            >
              {tLocal('scale.cta')}
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="border border-base-300 bg-base-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-[#10B981]/30 transition-all text-start">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-base-content/50 uppercase tracking-wider font-mono">{tLocal('ent.title')}</h3>
                <p className="text-[10px] text-base-content/50 font-mono mt-0.5">{tLocal('ent.desc')}</p>
              </div>
              <div className="flex items-baseline gap-1.5 border-b border-base-300 pb-4">
                <span className="text-4xl font-black text-base-content">{tLocal('ent.price')}</span>
              </div>
              <ul className="space-y-3 text-xs text-base-content/85">
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('ent.f1')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('ent.f2')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('ent.f3')}</li>
                <li className="flex gap-2"><span className="text-[#059669]">✓</span>{tLocal('ent.f4')}</li>
              </ul>
            </div>
            <button className="w-full btn bg-neutral hover:bg-neutral/80 text-neutral-content border-none rounded-xl btn-sm mt-8 h-10 min-h-0">
              {tLocal('ent.cta')}
            </button>
          </div>

        </div>
      </section>

      {/* Feature Comparative Tables */}
      <section className="px-4 pb-20 max-w-5xl mx-auto">
        <div className="space-y-12">
          {FEATURE_SECTIONS(tLocal).map((section) => (
            <div key={section.title} className="space-y-3">
              <h2 className="text-md font-bold text-base-content text-start">{section.title}</h2>
              <div className="border border-base-300 rounded-2xl overflow-hidden bg-base-200 shadow-sm">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-base-300 bg-base-100">
                      <th className="text-start font-bold text-base-content/60 py-3 px-4 uppercase tracking-wider font-mono">Parameters</th>
                      {['Free', 'Pro', 'Scale', 'Enterprise'].map((t) => (
                        <th key={t} className="text-center font-bold text-base-content/60 py-3 px-4 w-24 uppercase tracking-wider font-mono">
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row, i) => (
                      <tr key={row.label} className={i !== section.rows.length - 1 ? 'border-b border-base-300' : ''}>
                        <td className="text-start text-base-content/90 py-3 px-4 font-semibold">{row.label}</td>
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
      <section className="px-4 pb-20 max-w-5xl mx-auto">
        <div className="bg-base-200 border border-base-300 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm text-start">
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-base-content">{tLocal('addons.box_title')}</h3>
            <p className="text-xs text-base-content/70 max-w-2xl leading-relaxed">
              {tLocal('addons.box_desc')}
            </p>
          </div>
          <button className="btn btn-outline border-base-300 text-base-content hover:bg-base-300 rounded-xl text-xs h-10 min-h-0 px-6 whitespace-nowrap">
            {tLocal('addons.btn')}
          </button>
        </div>
      </section>

      {/* Trusted Logos */}
      <section className="px-4 pb-20 text-center space-y-6">
        <p className="text-[9px] text-base-content/50 uppercase tracking-widest font-mono font-bold">Trusted by candidate guilds at</p>
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-35">
          {LOGOS.map((logo) => (
            <span key={logo} className="text-xs font-black font-mono tracking-wider text-base-content">{logo}</span>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="px-4 pb-20 max-w-2xl mx-auto">
        <h2 className="text-lg font-extrabold mb-6 text-center text-base-content">{tLocal('pricing.faq')}</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={faq.q.en} className="border border-base-300 rounded-xl overflow-hidden bg-base-200 shadow-sm">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center text-start px-4 py-3.5 text-xs hover:bg-base-300 transition-colors font-semibold text-base-content"
              >
                <span>{locale === 'en' ? faq.q.en : faq.q.ar}</span>
                <span className={`text-base-content/50 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-xs text-base-content/70 leading-relaxed border-t border-base-300/50 pt-3">
                  {locale === 'en' ? faq.a.en : faq.a.ar}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 pb-20 max-w-5xl mx-auto grid sm:grid-cols-3 gap-6 text-start">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="border border-base-300 bg-base-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <p className="text-xs text-base-content/70 italic leading-relaxed mb-6">&ldquo;{locale === 'en' ? t.quote.en : t.quote.ar}&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold">
                {t.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <p className="text-xs font-extrabold text-base-content">{t.name}</p>
                <p className="text-[9px] text-base-content/50 font-bold font-mono">{locale === 'en' ? t.role.en : t.role.ar}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-24 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-2xl font-extrabold text-base-content">{tLocal('cta.title')}</h2>
        <p className="text-xs text-base-content/70 leading-relaxed">
          {tLocal('cta.desc')}
        </p>
        <div className="pt-2">
          <a href="/auth/register" className="btn bg-[#10B981] hover:bg-[#059669] border-none text-white rounded-xl px-8 text-xs font-semibold">
            {tLocal('cta.btn')}
          </a>
        </div>
      </section>

      {/* CHECKOUT MODAL WINDOW (STEP 1: CONFIRMATION & GATEWAY LOADING) */}
      {selectedPlan && !showSimulatedModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl bg-base-200 border border-base-300 p-6 text-start space-y-5">
            <h3 className="font-extrabold text-lg text-base-content">
              Confirm Subscription Upgrade
            </h3>
            
            {/* If NOT authenticated, offer simulation or login */}
            {!user ? (
              <div className="space-y-4">
                <p className="text-xs text-error bg-error/10 border border-error/20 p-3 rounded-lg font-semibold">
                  ⚠️ Authenticated Session required to start purchase.
                </p>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  Choose a simulator login role below to immediately test the full billing and PayPal order loops.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleSimulateLogin('learner')}
                    className="btn bg-[#10B981] hover:bg-[#059669] border-none text-white text-xs h-10 min-h-0 rounded-xl"
                  >
                    Login as Learner
                  </button>
                  <button 
                    onClick={() => handleSimulateLogin('company')}
                    className="btn bg-neutral hover:bg-neutral/80 text-neutral-content border-none text-xs h-10 min-h-0 rounded-xl"
                  >
                    Login as Employer
                  </button>
                </div>
                <div className="border-t border-base-300 pt-4 flex justify-end">
                  <button 
                    onClick={handleCancelUpgrade}
                    className="btn btn-outline border-base-300 text-base-content/85 text-xs h-9 min-h-0 rounded-lg px-4"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Authenticated checkout details
              <div className="space-y-4">
                <div className="bg-base-100 border border-base-300 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-base-content/50 font-semibold uppercase font-mono">Plan Selection:</span>
                    <span className="font-bold text-[#059669] font-mono">
                      {selectedPlan === 'pro' ? 'Premium Pro Learner' : 'Employer Sourcing Scale'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-base-content/50 font-semibold uppercase font-mono">Recurrent Fee:</span>
                    <span className="font-bold text-base-content font-mono">
                      {selectedPlan === 'pro' ? '$19.99 / mo' : '$99.99 / mo'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-base-content/55 border-t border-base-300 pt-2 font-mono">
                    <span>Billing Account:</span>
                    <span className="font-bold truncate max-w-xs">{user.email}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-base-300">
                  <button
                    onClick={triggerPayPalCheckout}
                    disabled={isProcessingCheckout}
                    className="w-full btn bg-[#0070BA] hover:bg-[#005EA6] text-white border-none rounded-xl h-11 font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {isProcessingCheckout ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <>
                        <span className="italic font-bold">PayPal</span> Checkout
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleCancelUpgrade}
                    className="w-full btn btn-ghost text-xs text-base-content/50 hover:bg-base-300 rounded-xl h-10 min-h-0"
                  >
                    Cancel Transaction
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. HIGH-FIDELITY SIMULATED PAYPAL SANDBOX TERMINAL MODAL */}
      {showSimulatedModal && paypalOrder && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl bg-base-200 border border-base-300 p-6 text-start max-w-md relative space-y-6">
            
            {/* PayPal sandbox banner */}
            <div className="bg-[#0070BA]/5 border border-[#0070BA]/20 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-[#0070BA] font-bold font-mono uppercase tracking-wider block">PayPal Sandbox Gateway</span>
                <span className="text-xs text-base-content/60 font-semibold mt-0.5">Simulating secure merchant payments</span>
              </div>
              <span className="italic text-lg font-black text-[#0070BA] font-mono">PayPal</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center font-mono">
                <span className="text-base-content/50">Order ID Ref:</span>
                <span className="font-bold text-base-content/95">{paypalOrder.id}</span>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-base-content/50">Amount Charged:</span>
                <span className="font-bold text-base-content">
                  {selectedPlan === 'pro' ? '$19.99 USD' : '$99.99 USD'}
                </span>
              </div>
            </div>

            {/* Credit Card Input simulator */}
            <div className="space-y-4 border-t border-base-300 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 font-mono block">Simulated Card Details:</span>
              
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-base-content/50 block font-mono">CARD NUMBER</label>
                <input
                  type="text"
                  readOnly
                  className="input input-bordered w-full rounded-xl bg-base-100 border-base-300 text-base-content text-xs h-10 font-mono"
                  value={simulatedCard.number}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-base-content/50 block font-mono">EXP DATE</label>
                  <input
                    type="text"
                    readOnly
                    className="input input-bordered w-full rounded-xl bg-base-100 border-base-300 text-base-content text-xs h-10 font-mono"
                    value={simulatedCard.expiry}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-base-content/50 block font-mono">SEC CODE (CVV)</label>
                  <input
                    type="password"
                    readOnly
                    className="input input-bordered w-full rounded-xl bg-base-100 border-base-300 text-base-content text-xs h-10 font-mono"
                    value={simulatedCard.cvv}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-base-300">
              <button
                onClick={captureSimulatedPayment}
                disabled={isProcessingCheckout}
                className="w-full btn bg-[#0070BA] hover:bg-[#005EA6] text-white border-none rounded-xl h-11 font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isProcessingCheckout ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  'Authorize & Capture Payment'
                )}
              </button>
              
              <button
                onClick={handleCancelUpgrade}
                className="w-full btn btn-ghost text-xs text-base-content/50 hover:bg-base-300 rounded-xl h-10 min-h-0"
              >
                Cancel Checkout
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}