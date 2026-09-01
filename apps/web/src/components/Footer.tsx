"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/AppContext";
import { apiFetch } from "@/lib/api";

export default function Footer() {
  const { t, locale } = useApp();
  const pathname = usePathname();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  if (
    !pathname ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname === "/cv" ||
    pathname === "/roadmap" ||
    pathname === "/dashboard" ||
    pathname === "/hiring"
  ) {
    return null;
  }

  const FOOTER_COLUMNS = [
    {
      title: locale === "en" ? "For Candidates" : "للمرشحين",
      links: [
        locale === "en" ? "Build a Roadmap" : "بناء خارطة طريق",
        locale === "en" ? "Take Assessments" : "إجراء التقييمات",
        locale === "en" ? "CV Builder" : "منشئ السيرة الذاتية",
        locale === "en" ? "Job Matching" : "مطابقة الوظائف",
        locale === "en" ? "Success Stories" : "قصص النجاح",
      ],
    },
    {
      title: locale === "en" ? "For Companies" : "للشركات",
      links: [
        locale === "en" ? "Talent Board" : "لوحة الكفاءات",
        locale === "en" ? "Candidate Search" : "بحث المرشحين",
        locale === "en" ? "Verified Scoring" : "النتائج المعتمدة",
        locale === "en" ? "Bulk Hiring" : "التوظيف المجمع",
        locale === "en" ? "API Access" : "واجهة البرمجة (API)",
      ],
    },
    {
      title: locale === "en" ? "Resources" : "المصادر",
      links: [
        locale === "en" ? "Our Blog" : "مدونتنا",
        locale === "en" ? "Learning Guides" : "أدلة التعلم",
        locale === "en" ? "Skill Benchmarks" : "معايير المهارات",
        locale === "en" ? "Webinars" : "الندوات عبر الإنترنت",
        locale === "en" ? "Career Quiz" : "اختبار المسار المهني",
      ],
    },
    {
      title: locale === "en" ? "Company" : "الشركة",
      links: [
        locale === "en" ? "About Us" : "من نحن",
        locale === "en" ? "Contact Us" : "اتصل بنا",
        locale === "en" ? "Careers" : "الوظائف الشاغرة",
        locale === "en" ? "Privacy Policy" : "سياسة الخصوصية",
        locale === "en" ? "Terms & Conditions" : "الشروط والأحكام",
      ],
    },
  ];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch("/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      if (response.ok) {
        setNewsletterSubmitted(true);
      }
    } catch {
      // silently fail — newsletter is non-critical
    }
  };

  return (
    <footer className="bg-[#121212] text-[#F5EBE1] px-4 py-16 border-t border-[#E8C999]/20 relative overflow-hidden">
      {/* Subtle warm glow orb */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8E1616]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 relative z-10">
        <div className="flex-1 w-full text-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8E1616]/20 border border-[#8E1616]/30 text-[#E8C999] text-xs font-mono font-bold mb-4">
            <span>✨</span> Stay Ahead of the Curve
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl leading-tight mb-4 max-w-md font-bold text-white">
            {t("contact.newsletter_title")}
          </h2>
          <p className="text-xs text-[#F5EBE1]/70 mb-6 max-w-md leading-relaxed">
            Get bi-weekly career path updates, curated roadmap modules, and vetted candidate benchmarks directly to your inbox.
          </p>
          {!newsletterSubmitted ? (
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-2.5 max-w-md"
            >
              <input
                required
                type="email"
                placeholder={t("contact.email")}
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="input flex-1 bg-[#1A1A1A] border border-[#E8C999]/30 rounded-xl h-12 text-sm text-[#F5EBE1] placeholder:text-[#F5EBE1]/40 focus:border-[#E8C999] focus:outline-none px-5"
              />
              <button
                type="submit"
                className="btn bg-[#8E1616] hover:bg-[#701111] text-white border-none rounded-xl h-12 px-7 font-bold text-sm shadow-md shadow-[#8E1616]/30 transition-all transform hover:-translate-y-0.5"
              >
                {t("contact.newsletter_btn")}
              </button>
            </form>
          ) : (
            <p className="text-sm text-[#E8C999] font-bold">
              {locale === "en"
                ? "✓ You're subscribed — welcome aboard."
                : "✓ تم اشتراكك بنجاح — مرحباً بك معنا."}
            </p>
          )}
          <p className="text-[11px] text-[#F5EBE1]/40 mt-4">
            {t("contact.terms_warning")}
          </p>
        </div>

        {/* Right illustration */}
        <div className="hidden md:block w-44 flex-shrink-0">
          <svg viewBox="0 0 160 200" className="w-full text-[#E8C999]/70" fill="none">
            <circle cx="85" cy="45" r="17" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M70 55 Q85 68 100 55" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M58 85 Q85 70 112 85 L120 155 Q85 170 50 155 Z" stroke="#8E1616" strokeWidth="2.5" fill="rgba(142, 22, 22, 0.2)" />
            <path d="M55 95 L20 80 L10 90 L40 110 Z" stroke="#E8C999" strokeWidth="2.5" fill="rgba(232, 201, 153, 0.2)" strokeLinejoin="round" />
            <path d="M10 90 L-5 85 M10 90 L-5 95 M10 90 L-8 90" stroke="#E8C999" strokeWidth="2" strokeLinecap="round" />
            <line x1="40" y1="170" x2="130" y2="170" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Footer columns */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-10 border-t border-white/10 text-start">
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-[11px] uppercase tracking-wider text-[#E8C999] font-bold mb-4 font-mono">
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-[#F5EBE1]/70 hover:text-[#E8C999] transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-6 border-t border-white/10">
        <div className="flex items-center gap-2 font-black text-white text-sm tracking-wide">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8E1616] inline-block" />
          {t("nav.logo")}
        </div>
        <p className="text-[11px] text-[#F5EBE1]/50 text-center font-mono">
          © 2026 Devotopia SmartRoadmap. All rights reserved.
        </p>
      </div>
    </footer>
  );
}