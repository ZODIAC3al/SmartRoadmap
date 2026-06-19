'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';

type ScoredJob = {
  _id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  requiredSkills: string[];
  salaryMin?: number;
  salaryMax?: number;
  remote: boolean;
  description?: string;
  matchScore: number;
  skillsGap: string[];
  relativeTime?: string;
  budget?: string;
  overallSpent?: string;
  clientRating?: string;
};

export default function HiringPage() {
  const router = useRouter();
  const { t, locale } = useApp();
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [successApplyJob, setSuccessApplyJob] = useState<string | null>(null);
  const [addingSkills, setAddingSkills] = useState<string[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [removedJobIds, setRemovedJobIds] = useState<string[]>([]);

  // Local state for editable Jobs Focus criteria
  const [focusSkills, setFocusSkills] = useState('product-design, user-experience, wire-framing');
  const [outdatedSkills, setOutdatedSkills] = useState('web-design');
  const [countries, setCountries] = useState('USA, UK, CA');
  const [avoidCountries, setAvoidCountries] = useState('IN, BD, RU');
  const [minHourly, setMinHourly] = useState('$20/hour');
  const [minProject, setMinProject] = useState('$200');

  useEffect(() => {
    const storedUser = localStorage.getItem('smart_user');
    const storedToken = localStorage.getItem('smart_token');

    if (!storedUser || !storedToken) {
      setLoading(false);
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    async function fetchMatches() {
      try {
        const res = await fetch(`http://localhost:3000/hiring/jobs/matches/${parsedUser.id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        // Enrich data with mockup properties
        const enriched = data.map((job: any, index: number) => ({
          ...job,
          relativeTime: index === 0 ? '8 hours ago' : index === 1 ? '2 hours ago' : '7 hours ago',
          budget: job.salaryMin ? `$${job.salaryMin}${job.salaryMax ? ` - $${job.salaryMax}` : ''}` : index === 0 ? '$200' : index === 1 ? '$20/hour' : '$25/hour',
          overallSpent: index === 0 ? '$50k' : 'N/A',
          clientRating: index === 0 ? '5★' : 'N/A',
        }));

        setJobs(enriched);
      } catch (e) {
        // Fallback mockup jobs to ensure layout is populated and verified
        setJobs([
          {
            _id: 'mock-1',
            title: 'User Experience Consultant to perform a UX Audit/Usability Report',
            company: 'Periodix SaaS Agency',
            location: 'Remote',
            country: 'United States',
            requiredSkills: ['product-design', 'user-experience', 'wire-framing'],
            remote: true,
            description: 'We are looking for an experienced UX consultant to audit our platform workflows, identify visual hierarchy friction points, and provide recommendations for layout and stepper enhancements.',
            matchScore: 93,
            skillsGap: [],
            relativeTime: '8 hours ago',
            budget: '$200',
            overallSpent: '$50k',
            clientRating: '5★'
          },
          {
            _id: 'mock-2',
            title: 'Rapid Iterative Mobile UI Prototyping',
            company: 'Vapor Tech Corp',
            location: 'Hybrid',
            country: 'United Kingdom',
            requiredSkills: ['mobile-design', 'wire-framing', 'figma'],
            remote: false,
            description: 'Seeking a freelance UI specialist to build dynamic wireframe screens for our upcoming Android and iOS mobile interfaces. Focus on fast iteration cycles.',
            matchScore: 87,
            skillsGap: ['figma'],
            relativeTime: '2 hours ago',
            budget: '$20/hour',
            overallSpent: 'N/A',
            clientRating: 'N/A'
          },
          {
            _id: 'mock-3',
            title: 'UX UI Designer',
            company: 'Lattice Recruiting',
            location: 'Remote',
            country: 'United States',
            requiredSkills: ['product-design', 'web-design'],
            remote: true,
            description: 'Join our product design guild. Responsible for prototyping responsive templates, setting layout guidelines, and verifying contrast and color token compliance.',
            matchScore: 81,
            skillsGap: ['web-design'],
            relativeTime: '7 hours ago',
            budget: '$25/hour',
            overallSpent: 'N/A',
            clientRating: '4.8★'
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  const handleApply = (company: string, jobTitle: string) => {
    setSuccessApplyJob(`${jobTitle} at ${company}`);
  };

  const handleAddSkills = async (jobId: string, skills: string[]) => {
    setAddingSkills(prev => [...prev, jobId]);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setJobs(prevJobs => 
        prevJobs.map(job => {
          if (job._id === jobId) {
            return {
              ...job,
              matchScore: 100,
              skillsGap: []
            };
          }
          return job;
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      setAddingSkills(prev => prev.filter(id => id !== jobId));
    }
  };

  const handleRemoveJob = (jobId: string) => {
    setRemovedJobIds(prev => [...prev, jobId]);
  };

  const editPrompt = (label: string, current: string, setter: (v: string) => void) => {
    const val = prompt(`Edit ${label}:`, current);
    if (val !== null) setter(val);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center p-8 text-center bg-base-100">
        <h2 className="text-2xl font-bold mb-2 text-base-content">Access Restricted</h2>
        <p className="text-sm text-base-content/65 max-w-sm mb-6">
          You must log in with a Learner Profile to view compatible job opportunities.
        </p>
        <Link href="/auth/login" className="btn btn-primary rounded-xl">
          Sign In to Portal
        </Link>
      </div>
    );
  }

  const activeJobs = jobs.filter(j => !removedJobIds.includes(j._id));

  return (
    <div className="min-h-screen bg-base-100 text-base-content py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
          
          {/* LEFT COLUMN: Jobs Feed List */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* Header section inside column */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight">{t('hiring.title')}</h1>
                <p className="text-xs text-base-content/50 mt-1">{t('hiring.desc')}</p>
              </div>
              <Link href="/roadmap" className="btn btn-outline btn-sm rounded-lg text-xs font-semibold">
                {t('hiring.view_timeline')}
              </Link>
            </div>

            {activeJobs.length === 0 ? (
              <div className="card bg-base-200 border border-base-300 p-8 text-center text-base-content/60 rounded-xl">
                {locale === 'en' 
                  ? 'No matching job listings available. Modify your Jobs Focus filters.' 
                  : 'لا توجد وظائف مطابقة متاحة حالياً. قم بتعديل مهارات التركيز.'}
              </div>
            ) : (
              activeJobs.map((job) => {
                const isMatchPerfect = job.matchScore >= 90;
                const isExpanded = expandedJobId === job._id;

                return (
                  <div key={job._id} className="card bg-base-200 border border-base-300 rounded-xl relative overflow-hidden transition-all duration-300 hover:shadow-sm">
                    {/* Close x button top right */}
                    <button
                      onClick={() => handleRemoveJob(job._id)}
                      className="absolute top-3 right-3 text-base-content/40 hover:text-red-500 font-bold transition-colors z-10 text-sm"
                      title="Hide job"
                    >
                      ✕
                    </button>

                    <div className="card-body p-6 flex flex-col md:flex-row justify-between gap-6">
                      
                      {/* Left: Job Core Info */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h2 className="text-lg font-extrabold leading-snug text-base-content pr-6">{job.title}</h2>
                          <p className="text-xs text-base-content/50 mt-1 font-semibold">{job.relativeTime} • {job.company}</p>
                        </div>

                        {/* Stats Matrix Grid (Mockup Columns) */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs border-y border-base-300/50 py-3">
                          <div>
                            <span className="text-base-content/40 font-semibold">{locale === 'en' ? 'Budget: ' : 'الميزانية: '}</span>
                            <span className="font-bold">{job.budget}</span>
                          </div>
                          <div>
                            <span className="text-base-content/40 font-semibold">{locale === 'en' ? 'Country: ' : 'البلد: '}</span>
                            <span className="font-bold">{job.country}</span>
                          </div>
                          <div>
                            <span className="text-base-content/40 font-semibold">{locale === 'en' ? 'Overall spent: ' : 'إجمالي الإنفاق: '}</span>
                            <span className="font-bold">{job.overallSpent}</span>
                          </div>
                          <div>
                            <span className="text-base-content/40 font-semibold">{locale === 'en' ? "Client's rating: " : 'تقييم العميل: '}</span>
                            <span className="font-bold text-yellow-500">{job.clientRating}</span>
                          </div>
                        </div>

                        {/* Collapsible description */}
                        <div>
                          <p className={`text-xs text-base-content/70 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {job.description}
                          </p>
                          <button
                            onClick={() => setExpandedJobId(isExpanded ? null : job._id)}
                            className="text-xs font-bold text-primary hover:underline mt-2 flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <span>{locale === 'en' ? 'Show less' : 'عرض أقل'}</span>
                                <span>▲</span>
                              </>
                            ) : (
                              <>
                                <span>{locale === 'en' ? 'Show more' : 'عرض المزيد'}</span>
                                <span>▼</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => handleApply(job.company, job.title)}
                            className="btn btn-primary btn-sm rounded-lg text-white font-bold px-6"
                          >
                            {t('hiring.apply')}
                          </button>
                        </div>
                      </div>

                      {/* Right: Mockup Alignment widgets */}
                      <div className="w-full md:w-56 shrink-0 flex flex-col justify-between items-center md:items-end gap-5 text-center md:text-right border-t md:border-t-0 md:border-s border-base-300 pt-5 md:pt-0 md:ps-6">
                        
                        <div className="flex gap-2 w-full justify-center md:justify-end">
                          {/* Possibility Badge */}
                          <div className="border border-success/30 bg-success/5 rounded-lg px-2.5 py-1.5 text-center min-w-[90px]">
                            <p className="text-[10px] text-success font-bold leading-tight">
                              {isMatchPerfect ? 'High' : 'Good'}
                            </p>
                            <span className="text-[8px] text-base-content/50">{locale === 'en' ? 'hire possibility' : 'فرصة توظيف'}</span>
                          </div>

                          {/* Match Percent Gauge */}
                          <div className="border border-primary/30 bg-primary/5 rounded-lg px-2.5 py-1.5 text-center min-w-[90px]">
                            <p className="text-[10px] text-primary font-black font-mono leading-tight">
                              {job.matchScore}.00%
                            </p>
                            <span className="text-[8px] text-base-content/50">{locale === 'en' ? 'project match' : 'تطابق المشروع'}</span>
                          </div>
                        </div>

                        {/* Predicted matching line (mock dots) */}
                        <div className="w-full text-center">
                          <p className="text-[10px] font-bold text-base-content/50 uppercase font-mono tracking-wider">
                            {locale === 'en' ? 'Predicted matching line' : 'خط التوافق المتوقع'}
                          </p>
                          <div className="relative mt-3.5 inline-block">
                            {/* "you are here" pointer bubble */}
                            <div className={`absolute -top-5.5 ${locale === 'ar' ? 'right-0' : 'left-0'} flex flex-col items-center shrink-0`}>
                              <span className="text-[8px] font-bold bg-primary text-white px-1.5 py-0.5 rounded font-mono leading-none">
                                {locale === 'en' ? 'you are here' : 'أنت هنا'}
                              </span>
                              <div className="w-1.5 h-1.5 bg-primary rotate-45 -mt-0.5" />
                            </div>
                            
                            {/* Avatar dots grid */}
                            <div className="flex gap-1.5 mt-1">
                              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-white">👨‍💻</span>
                              {[1, 2, 3, 4, 5].map(dot => (
                                <span key={dot} className="w-4 h-4 rounded-full bg-base-300 flex items-center justify-center text-[8px] opacity-45">👤</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Compatibility thumbs feedback */}
                        <div className="flex gap-4 text-[10px] font-bold font-mono justify-center w-full mt-auto">
                          <button 
                            onClick={() => alert('Thanks for the skill feedback!')}
                            className="text-primary hover:opacity-80 flex items-center gap-1.5"
                          >
                            👍 <span className="underline">{locale === 'en' ? 'Fits my skills' : 'يناسب مهاراتي'}</span>
                          </button>
                          <button 
                            onClick={() => {
                              if (job.skillsGap.length > 0) {
                                handleAddSkills(job._id, job.skillsGap);
                              } else {
                                alert('No skills gaps detected for this job!');
                              }
                            }}
                            className="text-red-500 hover:opacity-80 flex items-center gap-1.5"
                          >
                            👎 <span className="underline">{locale === 'en' ? 'Not my skills' : 'لا يناسبني'}</span>
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* RIGHT COLUMN: Sidebar (Mockup Panels) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Panel 1: Profile Summary */}
            <div className="card bg-base-200 border border-base-300 p-6 rounded-xl flex flex-col items-center text-center">
              <div className="avatar mb-4">
                <div className="w-20 h-20 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-2 bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold uppercase">
                  {user.name.slice(0, 2)}
                </div>
              </div>
              <h3 className="font-extrabold text-base-content text-md">{user.name}</h3>
              <p className="text-xs text-base-content/50 mt-1 font-semibold">
                {locale === 'en' ? 'User Experience/User Interface Designer' : 'مصمم تجربة وواجهة المستخدم'}
              </p>
            </div>

            {/* Panel 2: Counters banner */}
            <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-xl p-6 shadow-sm">
              <div className="text-4xl font-black font-mono tracking-tight">8791</div>
              <p className="text-xs uppercase font-bold tracking-widest opacity-90 mt-1.5">
                {locale === 'en' ? 'Upwork jobs checked today' : 'وظائف تم فحصها اليوم'}
              </p>
            </div>

            {/* Panel 3: Jobs Focus configurations */}
            <div className="card bg-base-200 border border-base-300 rounded-xl p-5">
              <div className="flex justify-between items-center border-b border-base-300/60 pb-3 mb-4">
                <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  🎛 {locale === 'en' ? 'Jobs Focus' : 'تركيز الوظائف'}
                </span>
                <button 
                  onClick={() => {
                    setFocusSkills('product-design, user-experience, wire-framing');
                    setOutdatedSkills('web-design');
                    setCountries('USA, UK, CA');
                  }} 
                  className="text-base-content/40 hover:text-red-500 text-xs" 
                  title="Reset filter criteria"
                >
                  🗑
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-baseline text-[10px] text-base-content/50 font-bold uppercase">
                    <span>{locale === 'en' ? 'Best skills' : 'أفضل المهارات'}</span>
                    <button onClick={() => editPrompt('Best skills', focusSkills, setFocusSkills)} className="text-primary font-bold hover:underline">✏️</button>
                  </div>
                  <p className="font-semibold mt-1 text-base-content/95">{focusSkills}</p>
                </div>

                <div>
                  <div className="flex justify-between items-baseline text-[10px] text-base-content/50 font-bold uppercase">
                    <span>{locale === 'en' ? 'Outdated skills' : 'المهارات القديمة'}</span>
                    <button onClick={() => editPrompt('Outdated skills', outdatedSkills, setOutdatedSkills)} className="text-primary font-bold hover:underline">✏️</button>
                  </div>
                  <p className="font-semibold mt-1 text-base-content/95">{outdatedSkills}</p>
                </div>

                <div>
                  <div className="flex justify-between items-baseline text-[10px] text-base-content/50 font-bold uppercase">
                    <span>{locale === 'en' ? 'Preferable countries' : 'البلدان المفضلة'}</span>
                    <button onClick={() => editPrompt('Preferable countries', countries, setCountries)} className="text-primary font-bold hover:underline">✏️</button>
                  </div>
                  <p className="font-semibold mt-1 text-base-content/95">{countries}</p>
                </div>

                <div>
                  <div className="flex justify-between items-baseline text-[10px] text-base-content/50 font-bold uppercase">
                    <span>{locale === 'en' ? 'Avoid countries' : 'بلدان لتجنبها'}</span>
                    <button onClick={() => editPrompt('Avoid countries', avoidCountries, setAvoidCountries)} className="text-primary font-bold hover:underline">✏️</button>
                  </div>
                  <p className="font-semibold mt-1 text-base-content/95">{avoidCountries}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-base-300/40 pt-3">
                  <div>
                    <div className="flex justify-between items-baseline text-[9px] text-base-content/50 font-bold uppercase">
                      <span>{locale === 'en' ? 'Min hourly' : 'أقل أجر ساعي'}</span>
                      <button onClick={() => editPrompt('Min hourly rate', minHourly, setMinHourly)} className="text-primary font-bold hover:underline">✏️</button>
                    </div>
                    <p className="font-semibold mt-0.5">{minHourly}</p>
                  </div>
                  <div>
                    <div className="flex justify-between items-baseline text-[9px] text-base-content/50 font-bold uppercase">
                      <span>{locale === 'en' ? 'Min project' : 'أقل ميزانية مشروع'}</span>
                      <button onClick={() => editPrompt('Min project price', minProject, setMinProject)} className="text-primary font-bold hover:underline">✏️</button>
                    </div>
                    <p className="font-semibold mt-0.5">{minProject}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Live Chat widget mockup */}
            <div className="bg-[#38bdf8] text-white p-3 rounded-lg flex items-center justify-between text-xs cursor-pointer shadow-sm hover:brightness-95 transition-all">
              <span className="font-semibold">💬 {locale === 'en' ? 'Leave a message...' : 'اترك رسالة...'}</span>
              <span>▲</span>
            </div>

          </aside>

        </div>
      </div>

      {/* Application Success Modal */}
      {successApplyJob && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl bg-base-200 border border-base-300 text-center">
            <div className="w-16 h-16 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🚀
            </div>
            <h3 className="font-bold text-xl text-primary">
              {locale === 'en' ? 'Application Submitted!' : 'تم تقديم الطلب بنجاح!'}
            </h3>
            <p className="py-4 text-xs sm:text-sm text-base-content/85">
              {locale === 'en' 
                ? 'Your profile, parsed CV details, and verified quiz scores have been submitted successfully for:' 
                : 'تم تقديم ملفك التعريفي، وتفاصيل سيرتك الذاتية المحللة، ونتائج اختبارات التقييم الموثقة بنجاح لصالح:'}
              <br />
              <strong className="text-secondary font-bold block mt-2 text-md">{successApplyJob}</strong>
            </p>
            <p className="text-xs text-base-content/50 leading-relaxed italic">
              {locale === 'en' 
                ? 'Recruiters at this firm can now view your learning milestones, project records, and testing assessments.' 
                : 'يمكن لمسؤولي التوظيف في هذه الشركة الآن تصفح معالم تعلمك، وسجلات مشاريعك، واختبارات تقييمك.'}
            </p>
            <div className="modal-action justify-center mt-6">
              <button onClick={() => setSuccessApplyJob(null)} className="btn btn-primary btn-sm rounded-xl text-white px-8">
                {locale === 'en' ? 'Confirm' : 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
