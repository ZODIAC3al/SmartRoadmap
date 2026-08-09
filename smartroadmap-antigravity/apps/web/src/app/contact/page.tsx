"use client";

import React, { useState } from "react";
import { useApp } from "@/components/AppContext";
import { apiFetch } from "@/lib/api";

const INTEREST_OPTIONS = (t: (k: string) => string) => [
  t("contact.interest_opt1"),
  t("contact.interest_opt2"),
  t("contact.interest_opt3"),
  t("contact.interest_opt4"),
  t("contact.interest_opt5"),
];

export default function ContactPage() {
  const { t, locale } = useApp();

  const [form, setForm] = useState({
    name: "",
    email: "",
    countryCode: "+20",
    phone: "",
    interest: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Extra local translations
  const tLocal = (key: string): string => {
    const dict: any = {
      "contact.interest_opt1": { en: "General inquiry", ar: "استفسار عام" },
      "contact.interest_opt2": { en: "I want to learn", ar: "أرغب في التعلم" },
      "contact.interest_opt3": { en: "I want to hire", ar: "أرغب في التوظيف" },
      "contact.interest_opt4": { en: "Partnership", ar: "شراكات وتكامل" },
      "contact.interest_opt5": { en: "Press", ar: "العلاقات العامة والإعلام" },
      "contact.get_in_touch": {
        en: "Get in touch with SmartRoadmap",
        ar: "تواصل مباشرة مع خارطة الطريق الذكية",
      },
      "contact.egypt": { en: "Egypt", ar: "جمهورية مصر العربية" },
      "contact.location_val": {
        en: "Smouha, Alexandria, Egypt",
        ar: "سموحة، الإسكندرية، مصر",
      },
    };
    const item = dict[key];
    if (!item) return key;
    return item[locale] || item["en"] || key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiFetch("/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch (err) {
      alert(t("contact.terms_warning"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content">
      {/* Breadcrumb + Hero */}
      <section className="pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-base-content/40 font-bold mb-4 tracking-wide">
            {t("contact.subtitle")}
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl text-base-content font-bold mb-5">
            {t("contact.title")}
          </h1>
          <p className="text-sm sm:text-base text-base-content/60 max-w-xl mx-auto leading-relaxed">
            {t("contact.desc")}
          </p>
        </div>
      </section>

      {/* Form Section with side illustrations */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto relative flex items-start justify-center gap-6">
          {/* Left illustration - person at laptop */}
          <div className="hidden lg:block flex-shrink-0 w-40 pt-20">
            <svg
              viewBox="0 0 160 200"
              className="w-full text-primary"
              fill="none"
            >
              <circle
                cx="55"
                cy="50"
                r="26"
                fill="currentColor"
                opacity="0.12"
              />
              <circle
                cx="55"
                cy="44"
                r="16"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M40 60 Q55 75 70 60"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M30 90 Q55 78 80 90 L85 160 Q55 175 25 160 Z"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
              />
              <rect
                x="35"
                y="140"
                width="50"
                height="32"
                rx="3"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
              />
              <rect
                x="40"
                y="146"
                width="40"
                height="20"
                rx="1"
                fill="currentColor"
                opacity="0.15"
              />
              <line
                x1="10"
                y1="178"
                x2="110"
                y2="178"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="20"
                y1="178"
                x2="20"
                y2="160"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <line
                x1="100"
                y1="178"
                x2="100"
                y2="160"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          {/* Center: the form */}
          <div className="w-full max-w-xl">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder={t("contact.name")}
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="input input-bordered w-full bg-base-200 border-base-300 rounded-lg h-12 text-sm focus:border-primary focus:outline-none"
                    />
                    <span className="absolute top-3 right-4 text-base-content/40 text-xs">
                      *
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type="email"
                      placeholder={t("contact.email")}
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="input input-bordered w-full bg-base-200 border-base-300 rounded-lg h-12 text-sm focus:border-primary focus:outline-none"
                    />
                    <span className="absolute top-3 right-4 text-base-content/40 text-xs">
                      *
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <select
                      value={form.countryCode}
                      onChange={(e) =>
                        setForm({ ...form, countryCode: e.target.value })
                      }
                      className="select select-bordered bg-base-200 border-base-300 rounded-lg h-12 text-sm w-24 focus:border-primary focus:outline-none"
                    >
                      <option value="+20">🇪🇬 +20</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                    </select>
                    <input
                      type="tel"
                      placeholder={
                        tLocal("contact.phone_placeholder") || "100 1234567"
                      }
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="input input-bordered w-full bg-base-200 border-base-300 rounded-lg h-12 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <select
                      required
                      value={form.interest}
                      onChange={(e) =>
                        setForm({ ...form, interest: e.target.value })
                      }
                      className="select select-bordered w-full bg-base-200 border-base-300 rounded-lg h-12 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="" disabled>
                        {t("contact.interest")}
                      </option>
                      {INTEREST_OPTIONS(tLocal).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <span className="absolute top-3 right-9 text-base-content/40 text-xs">
                      *
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    required
                    placeholder={t("contact.message")}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    className="textarea textarea-bordered w-full bg-base-200 border-base-300 rounded-lg h-36 text-sm focus:border-primary focus:outline-none resize-none"
                  />
                  <span className="absolute top-3 right-4 text-base-content/40 text-xs">
                    *
                  </span>
                </div>

                <div className="flex flex-col items-center pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary rounded-full px-10 h-12 font-semibold text-sm shadow-sm text-white"
                  >
                    {submitting && (
                      <span className="loading loading-spinner loading-xs" />
                    )}
                    {t("contact.btn")}
                  </button>
                  <p className="text-[11px] text-base-content/40 mt-3 text-center leading-relaxed">
                    {t("contact.terms_warning")}
                  </p>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 px-6 bg-base-200 border border-base-300 rounded-2xl">
                <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4 text-2xl">
                  ✓
                </div>
                <h3 className="font-bold text-lg text-base-content mb-2">
                  {t("contact.success_title")}
                </h3>
                <p className="text-sm text-base-content/60">
                  {t("contact.success_desc")}
                </p>
              </div>
            )}
          </div>

          {/* Right illustration - person snapping fingers */}
          <div className="hidden lg:block flex-shrink-0 w-40 pt-12">
            <svg
              viewBox="0 0 160 220"
              className="w-full text-primary"
              fill="none"
            >
              <circle
                cx="90"
                cy="40"
                r="16"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M75 50 Q90 65 105 50"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M65 78 Q90 65 115 78 L125 150 Q90 165 55 150 Z"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M115 90 Q140 95 150 110"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="152" cy="112" r="4" fill="currentColor" />
              <path
                d="M55 95 Q35 105 25 125"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <rect
                x="0"
                y="120"
                width="40"
                height="14"
                rx="3"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
              />
              <line
                x1="40"
                y1="165"
                x2="140"
                y2="165"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="60"
                y1="165"
                x2="55"
                y2="195"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <line
                x1="105"
                y1="165"
                x2="110"
                y2="195"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Map + address section */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <p className="text-xs text-base-content/40 font-bold mb-3 tracking-wide uppercase">
            {tLocal("contact.egypt")}
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-base-content font-bold">
            {tLocal("contact.get_in_touch")}
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_320px] gap-5">
          {/* Map embed */}
          <div className="rounded-2xl overflow-hidden border border-base-300 h-[340px]">
            <iframe
              title="SmartRoadmap office location"
              className="w-full h-full"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Alexandria,Egypt&output=embed"
            />
          </div>

          {/* Address card */}
          <div className="bg-base-200 border border-base-300 rounded-2xl p-7 flex flex-col gap-6">
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1.5">
                {t("contact.address")}
              </p>
              <p className="text-sm font-bold text-base-content">
                {tLocal("contact.location_val")}
              </p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1.5">
                {t("nav.contact")}
              </p>
              <a
                href="mailto:hi@smartroadmap.dev"
                className="text-sm font-bold text-primary hover:underline"
              >
                hi@smartroadmap.dev
              </a>
            </div>
            <div>
              <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1.5">
                {locale === "en" ? "Phone" : "الهاتف"}
              </p>
              <a
                href="tel:+20100000000"
                className="text-sm font-bold text-primary hover:underline"
              >
                +20 100 000 0000
              </a>
            </div>
            <div className="flex gap-2.5 mt-auto pt-2">
              {[
                "facebook",
                "x",
                "linkedin",
                "youtube",
                "instagram",
                "tiktok",
              ].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="w-9 h-9 rounded-full bg-base-100 border border-base-300 flex items-center justify-center text-base-content/70 hover:border-primary hover:text-primary transition-colors text-xs"
                >
                  {s[0].toUpperCase()}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
