'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/components/AppContext';

export default function Footer() {
  const { t, locale } = useApp();
  const pathname = usePathname();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  if (pathname.startsWith('/auth') || pathname.startsWith('/onboarding')) {
    return null;
  }

  const FOOTER_COLUMNS = [
    {
      title: locale === 'en' ? 'For Candidates' : 'للمرشحين',
      links: [
        locale === 'en' ? 'Build a Roadmap' : 'بناء خارطة طريق',
        locale === 'en' ? 'Take Assessments' : 'إجراء التقييمات',
        locale === 'en' ? 'CV Builder' : 'منشئ السيرة الذاتية',
        locale === 'en' ? 'Job Matching' : 'مطابقة الوظائف',
        locale === 'en' ? 'Success Stories' : 'قصص النجاح'
      ],
    },
    {
      title: locale === 'en' ? 'For Companies' : 'للشركات',
      links: [
        locale === 'en' ? 'Talent Board' : 'لوحة الكفاءات',
        locale === 'en' ? 'Candidate Search' : 'بحث المرشحين',
        locale === 'en' ? 'Verified Scoring' : 'النتائج المعتمدة',
        locale === 'en' ? 'Bulk Hiring' : 'التوظيف المجمع',
        locale === 'en' ? 'API Access' : 'واجهة البرمجة (API)'
      ],
    },
    {
      title: locale === 'en' ? 'Resources' : 'المصادر',
      links: [
        locale === 'en' ? 'Our Blog' : 'مدونتنا',
        locale === 'en' ? 'Learning Guides' : 'أدلة التعلم',
        locale === 'en' ? 'Skill Benchmarks' : 'معايير المهارات',
        locale === 'en' ? 'Webinars' : 'الندوات عبر الإنترنت',
        locale === 'en' ? 'Career Quiz' : 'اختبار المسار المهني'
      ],
    },
    {
      title: locale === 'en' ? 'Company' : 'الشركة',
      links: [
        locale === 'en' ? 'About Us' : 'من نحن',
        locale === 'en' ? 'Contact Us' : 'اتصل بنا',
        locale === 'en' ? 'Careers' : 'الوظائف الشاغرة',
        locale === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية',
        locale === 'en' ? 'Terms & Conditions' : 'الشروط والأحكام'
      ],
    },
  ];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      if (!response.ok) throw new Error('Subscribe failed');
      setNewsletterSubmitted(true);
    } catch (err) {
      alert('Could not subscribe right now. Please try again.');
    }
  };

  return (
    <footer className="bg-neutral text-neutral-content px-4 py-16 border-t border-base-300/10">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 w-full">
          <h2 className="font-serif text-3xl sm:text-4xl leading-tight mb-8 max-w-md font-bold text-white">
            {t('contact.newsletter_title')}
          </h2>
          {!newsletterSubmitted ? (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                required
                type="email"
                placeholder={t('contact.email')}
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="input flex-1 bg-neutral border border-neutral-content/30 rounded-full h-12 text-sm text-neutral-content placeholder:text-neutral-content/50 focus:border-white focus:outline-none px-5"
              />
              <button
                type="submit"
                className="btn bg-transparent border-2 border-neutral-content text-neutral-content hover:bg-neutral-content hover:text-neutral rounded-full h-12 px-7 font-bold text-sm"
              >
                {t('contact.newsletter_btn')}
              </button>
            </form>
          ) : (
            <p className="text-sm text-neutral-content/85">
              {locale === 'en' ? "You're subscribed — welcome aboard." : 'تم اشتراكك بنجاح — مرحباً بك معنا.'}
            </p>
          )}
          <p className="text-[11px] text-neutral-content/40 mt-4">
            {t('contact.terms_warning')}
          </p>
        </div>

        {/* Right illustration - person with megaphone */}
        <div className="hidden md:block w-44 flex-shrink-0">
          <svg viewBox="0 0 160 200" className="w-full text-neutral-content/50" fill="none">
            <circle cx="85" cy="45" r="17" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M70 55 Q85 68 100 55" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M58 85 Q85 70 112 85 L120 155 Q85 170 50 155 Z" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M55 95 L20 80 L10 90 L40 110 Z" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            <path d="M10 90 L-5 85 M10 90 L-5 95 M10 90 L-8 90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="40" y1="170" x2="130" y2="170" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Footer columns */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-10 border-t border-neutral-content/10">
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-[11px] uppercase tracking-wider text-neutral-content/40 font-bold mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-neutral-content/70 hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-6 border-t border-neutral-content/10">
        <div className="flex items-center gap-2 font-bold text-white">
          <svg className="w-5 h-5 text-secondary" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15 8L22 9L17 14L18 21L12 17L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" />
          </svg>
          {t('nav.logo')}
        </div>
        <p className="text-[11px] text-neutral-content/40 text-center">
          © 2026 SmartRoadmap. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
