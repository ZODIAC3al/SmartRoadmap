'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Stepper from '@/components/Stepper';
import { useApp } from '@/components/AppContext';

const PRESET_ROLES = [
  { id: 'fe', title: 'Frontend Engineer', desc: 'Build reactive user interfaces, state managers, and modern layouts.', icon: '⚛️' },
  { id: 'be', title: 'Backend Developer', desc: 'Design microservices, API architectures, databases, and message queues.', icon: '⚙️' },
  { id: 'ds', title: 'Data Scientist', desc: 'Process datasets, design machine learning algorithms, and build models.', icon: '📊' },
  { id: 'do', title: 'DevOps Engineer', desc: 'Deploy cloud infrastructure, orchestrate containers, and automate CI/CD.', icon: '🚀' },
];

const PRESET_SKILLS = ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'Docker', 'TypeScript'];

export default function OnboardingPage() {
  const router = useRouter();
  const { t, locale } = useApp();
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState('');

  const [education, setEducation] = useState('Bootcamp/Self-Taught');
  const [experienceYears, setExperienceYears] = useState(0);

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);

  const [userId, setUserId] = useState('654321098765432109876543');

  const STEP_LABELS = [
    { label: t('onboard.step1') },
    { label: t('onboard.step2') },
    { label: t('onboard.step3') },
    { label: t('onboard.step4') },
  ];

  const loadingMessages = [
    locale === 'en' ? 'Analyzing your background diagnostics...' : 'جاري تحليل تشخيصات خلفيتك الفنية...',
    locale === 'en' ? 'Mapping syllabus dependency graphs...' : 'جاري رسم خرائط تبعية المناهج الدراسية...',
    locale === 'en' ? 'Optimizing modules sequence parameters...' : 'جاري تحسين تسلسل الوحدات والدروس...',
    locale === 'en' ? 'Compiling personalized learning roadmap...' : 'جاري تجميع خارطة الطريق التعليمية المخصصة...',
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('smart_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.id) {
          setUserId(u.id);
        }
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    if (step === 4) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleNext = () => {
    if (step === 1 && !targetRole && !customRoleInput) {
      alert(locale === 'en' ? 'Please select a role or input a custom goal.' : 'يرجى اختيار مسمى وظيفي أو كتابة هدف مخصص.');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setStep(4);
    const finalRole = isCustomRole ? customRoleInput : targetRole;

    try {
      const response = await fetch('http://localhost:3000/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          role: finalRole,
          education: education,
          experienceYears: experienceYears,
          skills: selectedSkills,
        }),
      });

      if (!response.ok) {
        throw new Error('Roadmap generation failed');
      }

      setTimeout(() => {
        router.push('/roadmap');
      }, 1000);
    } catch (error) {
      console.error(error);
      alert(locale === 'en' ? 'Failed to generate your roadmap. Please check if your backend server is active.' : 'فشل إنشاء خارطة الطريق. يرجى التحقق من تشغيل الخادم الخلفي.');
      setStep(3);
    }
  };

  const getRoleTitle = (roleId: string, def: string) => {
    if (locale === 'ar') {
      switch (roleId) {
        case 'fe': return 'مهندس واجهات أمامية';
        case 'be': return 'مطور برمجيات خلفية';
        case 'ds': return 'عالم بيانات';
        case 'do': return 'مهندس عمليات سحابية (DevOps)';
        default: return def;
      }
    }
    return def;
  };

  const getRoleDesc = (roleId: string, def: string) => {
    if (locale === 'ar') {
      switch (roleId) {
        case 'fe': return 'بناء واجهات تفاعلية للمستخدم، وإدارة الحالة، والتصميمات الحديثة.';
        case 'be': return 'تصميم بنية الخدمات المصغرة، وقواعد البيانات، وأنظمة الرسائل البرمجية.';
        case 'ds': return 'معالجة مجموعات البيانات الكبيرة، وتصميم لوغاريتمات ونماذج التعلم الآلي.';
        case 'do': return 'تهيئة البنية التحتية السحابية، وإدارة الحاويات وأتمتة خطوط النشر.';
        default: return def;
      }
    }
    return def;
  };

  const getEduLabel = (edu: string) => {
    if (locale === 'ar') {
      switch (edu) {
        case 'Bootcamp/Self-Taught': return 'معسكر تدريبي / تعليم ذاتي';
        case 'College Degree': return 'شهادة جامعية';
        case 'High School Graduate': return 'شهادة الثانوية العامة';
        case 'Post-Graduate': return 'دراسات عليا / ماجستير / دكتوراه';
        default: return edu;
      }
    }
    return edu;
  };

  const EDUCATION_OPTIONS = ['Bootcamp/Self-Taught', 'College Degree', 'High School Graduate', 'Post-Graduate'];

  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content items-center justify-center p-4 py-10">
      {/* New Stepper component, replacing DaisyUI steps */}
      <div className="max-w-2xl w-full mb-8">
        <Stepper steps={STEP_LABELS} currentIndex={step - 1} />
      </div>

      {/* Main card panel */}
      <div className="card bg-base-200 border border-base-300 shadow-md max-w-2xl w-full">
        <div className="card-body">
          {/* STEP 1: TARGET CAREER GOAL */}
          {step === 1 && (
            <div>
              <h2 className="card-title text-xl sm:text-2xl mb-2">{t('onboard.title')}</h2>
              <p className="text-xs sm:text-sm text-base-content/70 mb-6">
                {t('onboard.subtitle')}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {PRESET_ROLES.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => {
                      setTargetRole(role.title);
                      setIsCustomRole(false);
                    }}
                    className={`card bg-base-100 border p-4 cursor-pointer hover:border-primary transition-all ${targetRole === role.title && !isCustomRole
                      ? 'border-primary border-2 shadow-sm'
                      : 'border-base-300'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{role.icon}</span>
                      <div>
                        <h3 className="font-bold text-sm text-base-content">{getRoleTitle(role.id, role.title)}</h3>
                        <p className="text-[11px] text-base-content/60 mt-1 leading-snug">{getRoleDesc(role.id, role.desc)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="divider text-[10px] tracking-wider font-bold text-base-content/40 uppercase">{t('onboard.custom_divider')}</div>
              <div className="form-control mb-6">
                <input
                  type="text"
                  placeholder={t('onboard.custom_placeholder')}
                  value={customRoleInput}
                  onChange={(e) => {
                    setCustomRoleInput(e.target.value);
                    setIsCustomRole(true);
                  }}
                  className="input input-bordered w-full bg-base-100 border-base-300 focus:outline-none focus:border-primary h-12 text-sm"
                />
              </div>

              <div className="card-actions justify-end">
                <button onClick={handleNext} className="btn btn-primary px-8 text-white">
                  {locale === 'en' ? 'Continue →' : '← استمرار'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PROFESSIONAL BACKGROUND */}
          {step === 2 && (
            <div>
              <h2 className="card-title text-xl sm:text-2xl mb-2">
                {locale === 'en' ? 'Tell us about your background' : 'أخبرنا عن خلفيتك المهنية'}
              </h2>
              <p className="text-xs sm:text-sm text-base-content/70 mb-6">
                {locale === 'en' 
                  ? 'We adapt the syllabus pacing and baseline requirements to match your background.' 
                  : 'نحن نقوم بضبط سرعة المنهج الدراسي ومستويات الانطلاق لتتناسب مع مستواك وخبرتك.'}
              </p>

              <div className="form-control mb-6">
                <label className="label font-bold text-xs sm:text-sm">{t('onboard.edu_label')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {EDUCATION_OPTIONS.map((edu) => (
                    <label
                      key={edu}
                      className={`card bg-base-100 border p-4 cursor-pointer hover:border-primary flex flex-row gap-3 items-center ${education === edu ? 'border-primary border-2 shadow-sm' : 'border-base-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="education"
                        value={edu}
                        checked={education === edu}
                        onChange={() => setEducation(edu)}
                        className="radio radio-primary radio-sm"
                      />
                      <span className="text-xs sm:text-sm">{getEduLabel(edu)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-control mb-6">
                <label className="label justify-between items-baseline">
                  <span className="font-bold text-xs sm:text-sm">{t('onboard.exp_label')}</span>
                  <span className="badge badge-primary font-mono text-white text-xs px-2 py-2">
                    {experienceYears} {locale === 'en' ? 'years' : 'سنوات'}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value))}
                  className="range range-primary"
                  step="1"
                />
                <div className="w-full flex justify-between text-xs px-2 mt-2 font-mono">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5+</span>
                </div>
              </div>

              <div className="card-actions justify-between">
                <button onClick={handleBack} className="btn btn-outline btn-ghost text-xs sm:text-sm">
                  {locale === 'en' ? '← Back' : 'رجوع →'}
                </button>
                <button onClick={handleNext} className="btn btn-primary px-8 text-white">
                  {locale === 'en' ? 'Continue →' : '← استمرار'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SELF-REPORTED SKILLS */}
          {step === 3 && (
            <div>
              <h2 className="card-title text-xl sm:text-2xl mb-2">{t('onboard.step3')}</h2>
              <p className="text-xs sm:text-sm text-base-content/70 mb-6">
                {t('onboard.skills_subtitle')}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {PRESET_SKILLS.map((skill) => {
                  const active = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`btn btn-sm rounded-full font-mono ${active ? 'btn-primary text-white' : 'btn-outline border-base-300'}`}
                    >
                      {active ? '✓ ' : '+ '} {skill}
                    </button>
                  );
                })}
              </div>

              <div className="card-actions justify-between">
                <button onClick={handleBack} className="btn btn-outline btn-ghost text-xs sm:text-sm">
                  {locale === 'en' ? '← Back' : 'رجوع →'}
                </button>
                <button onClick={handleSubmit} className="btn btn-success px-8 text-white font-bold">
                  {t('onboard.btn_submit')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ANIMATED GENERATION LOADER */}
          {step === 4 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <span className="loading loading-infinity loading-lg text-primary w-24 h-24 mb-6"></span>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-base-content">
                {locale === 'en' ? 'Building Your Dynamic Roadmap' : 'جاري بناء خارطة طريقك التفاعلية'}
              </h3>
              <p className="text-primary font-mono text-xs sm:text-sm animate-pulse">
                {loadingMessages[loadingStep]}
              </p>
              <div className="w-full max-w-xs bg-base-300 rounded-full h-1.5 mt-8 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-1000 ease-out"
                  style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}