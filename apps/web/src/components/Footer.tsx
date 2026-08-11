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
      if (!response.ok) throw new Error("Subscribe failed");
      setNewsletterSubmitted(true);
    } catch (err) {
      alert("Could not subscribe right now. Please try again.");
    }
  };

  return (
    <footer className="bg-base-200 text-base-content px-4 py-16 border-t border-base-300 relative overflow-hidden">
      {/* Red ambient glow */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#E1251B]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex-1 w-full max-w-xl text-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E1251B]/15 border border-[#E1251B]/30 text-[#FF7B72] text-xs font-mono font-bold mb-4">
            <span>🔥</span> STAY AHEAD IN SOFTWARE ENGINEERING
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-4 text-base-content">
            {t("contact.newsletter_title")}
          </h2>
          <p className="text-xs text-base-content/70 mb-6 leading-relaxed">
            {locale === "en" 
              ? "Weekly deep-dive articles, career roadmaps, and software engineering masterclasses directly to your inbox." 
              : "مقالات أسبوعية معمقة، وخرائط طريق مهنية، ودروس متقدمة في هندسة البرمجيات مباشرة إلى بريدك."}
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
                className="input flex-1 bg-base-100 border border-base-300 rounded-xl h-12 text-sm text-base-content placeholder:text-base-content/40 focus:border-[#E1251B] focus:outline-none px-4"
              />
              <button
                type="submit"
                className="btn fem-btn-primary rounded-xl h-12 px-6 font-bold text-xs"
              >
                {t("contact.newsletter_btn")}
              </button>
            </form>
          ) : (
            <p className="text-sm text-emerald-500 font-semibold">
              {locale === "en"
                ? "✓ You're subscribed — welcome aboard."
                : "✓ تم اشتراكك بنجاح — مرحباً بك معنا."}
            </p>
          )}
        </div>

        {/* Right illustration / badge */}
        <div className="w-full md:w-auto p-6 rounded-2xl bg-base-100 border border-base-300 text-start max-w-xs space-y-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E1251B] to-[#FF5A4E] flex items-center justify-center font-bold text-white shadow-lg shadow-red-600/30">
              <span className="text-lg">⚡</span>
            </div>
            <div>
              <div className="text-base-content font-extrabold text-sm">Devotopia Masters</div>
              <div className="text-base-content/60 text-xs font-mono">Continuous Growth</div>
            </div>
          </div>
          <p className="text-xs text-base-content/70 leading-relaxed">
            Master Frontend, Backend, Cloud & AI with proven engineering roadmaps.
          </p>
        </div>
      </div>

      {/* Footer columns */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-10 border-t border-base-300 text-start">
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs uppercase tracking-wider text-base-content/60 font-bold mb-4 font-mono">
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-xs text-base-content/75 hover:text-[#E1251B] transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-6 border-t border-base-300">
        <div className="flex items-center gap-2 font-bold text-base-content text-sm">
          <div className="w-5 h-5 rounded bg-[#E1251B] flex items-center justify-center text-white text-xs font-black">
            D
          </div>
          Devotopia SmartRoadmap
        </div>
        <p className="text-xs text-base-content/50 text-center font-mono">
          © 2026 Devotopia Masters. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
