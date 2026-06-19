'use client';

import React from 'react';
import { useApp } from '@/components/AppContext';

export default function Home() {
  const { t } = useApp();

  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content">
      
      {/* Hero Section */}
      <main className="flex-grow">
        
        {/* HERO HEADER */}
        <section className="hero min-h-[85vh] bg-base-100 py-20 sm:py-28 relative overflow-hidden">
          {/* Subtle gradient light effects */}
          <div className="absolute top-[-25%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/10 blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-15%] left-[-15%] w-[500px] h-[500px] rounded-full bg-secondary/8 blur-[100px] pointer-events-none"></div>
 
          <div className="hero-content text-center flex-col max-w-5xl mx-auto px-4 relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/15 text-primary mb-8 px-4 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold">
              {t('home.badge')}
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.02] text-base-content mb-8 max-w-4xl">
              {t('home.title1')} <br />
              <span className="text-secondary bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {t('home.title2')}
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-base-content/75 max-w-3xl mb-12 leading-relaxed">
              {t('home.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <a href="/onboarding" className="btn btn-primary btn-lg px-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-base h-14">
                {t('home.cta_start')}
              </a>
              <a href="/auth/register" className="btn btn-outline border-primary hover:bg-primary/5 text-primary btn-lg px-10 rounded-xl font-semibold text-base h-14">
                {t('home.cta_talent')}
              </a>
            </div>
 
            {/* Trusted by Section */}
            <div className="mt-24 w-full">
              <p className="text-[10px] uppercase tracking-[0.2em] text-base-content/40 font-mono mb-8 font-bold">
                {t('home.trusted')}
              </p>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-50 grayscale hover:opacity-75 transition-all duration-300">
                <span className="text-base sm:text-lg font-black tracking-tight font-sans">ANTHROPIC</span>
                <span className="text-base sm:text-lg font-black tracking-tight font-sans">ROBINHOOD</span>
                <span className="text-base sm:text-lg font-black tracking-tight font-sans">LOOM</span>
                <span className="text-base sm:text-lg font-black tracking-tight font-sans">DUOLINGO</span>
                <span className="text-base sm:text-lg font-black tracking-tight font-sans">DISCORD</span>
                <span className="text-base sm:text-lg font-black tracking-tight font-sans">GUSTO</span>
              </div>
            </div>
          </div>
        </section>
 
        {/* PROBLEM STATEMENT SECTION */}
        <section className="py-24 bg-base-200 border-y border-base-300 relative">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
                {t('home.sections_title')}
              </h2>
              <p className="text-sm text-base-content/60 mt-3">
                {t('home.sections_subtitle')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Card: Learners */}
              <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl group hover:-translate-y-1">
                <div className="card-body p-8 sm:p-10">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-xl mb-6">
                    🎓
                  </div>
                  <h3 className="text-xl font-bold text-base-content mb-3 group-hover:text-primary transition-colors">
                    {t('home.candidate_title')}
                  </h3>
                  <p className="text-sm text-base-content/70 mb-6 leading-relaxed">
                    {t('home.candidate_desc')}
                  </p>
                  <div className="flex justify-between items-center mt-auto border-t border-base-300 pt-5">
                    <span className="text-xs font-semibold text-accent">
                      {t('home.candidate_badge')}
                    </span>
                    <a href="/onboarding" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      {t('home.candidate_cta')}
                    </a>
                  </div>
                </div>
              </div>
 
              {/* Card: Companies */}
              <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl group hover:-translate-y-1">
                <div className="card-body p-8 sm:p-10">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xl mb-6">
                    💼
                  </div>
                  <h3 className="text-xl font-bold text-base-content mb-3 group-hover:text-primary transition-colors">
                    {t('home.company_title')}
                  </h3>
                  <p className="text-sm text-base-content/70 mb-6 leading-relaxed">
                    {t('home.company_desc')}
                  </p>
                  <div className="flex justify-between items-center mt-auto border-t border-base-300 pt-5">
                    <span className="text-xs font-semibold text-secondary">
                      {t('home.company_badge')}
                    </span>
                    <a href="/auth/register" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      {t('home.company_cta')}
                    </a>
                  </div>
                </div>
              </div>
 
            </div>
          </div>
        </section>
 
        {/* HOW IT WORKS */}
        <section className="py-24 bg-base-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
                {t('home.how_it_works_title')}
              </h2>
              <p className="text-sm text-base-content/60 mt-3">
                {t('home.how_it_works_subtitle')}
              </p>
            </div>
 
            <div className="grid md:grid-cols-3 gap-10 relative">
              
              {/* Step 1 */}
              <div className="text-center flex flex-col items-center group">
                <div className="w-16 h-16 rounded-full bg-primary/5 border border-primary/15 text-primary flex items-center justify-center font-mono text-xl font-bold mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                  1
                </div>
                <h3 className="text-lg font-bold text-base-content mb-2.5">
                  {t('home.step1_title')}
                </h3>
                <p className="text-xs text-base-content/60 max-w-xs leading-relaxed">
                  {t('home.step1_desc')}
                </p>
              </div>
 
              {/* Step 2 */}
              <div className="text-center flex flex-col items-center group">
                <div className="w-16 h-16 rounded-full bg-secondary/5 border border-secondary/15 text-secondary flex items-center justify-center font-mono text-xl font-bold mb-6 group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-sm">
                  2
                </div>
                <h3 className="text-lg font-bold text-base-content mb-2.5">
                  {t('home.step2_title')}
                </h3>
                <p className="text-xs text-base-content/60 max-w-xs leading-relaxed">
                  {t('home.step2_desc')}
                </p>
              </div>
 
              {/* Step 3 */}
              <div className="text-center flex flex-col items-center group">
                <div className="w-16 h-16 rounded-full bg-accent/5 border border-accent/15 text-accent flex items-center justify-center font-mono text-xl font-bold mb-6 group-hover:bg-accent group-hover:text-white transition-all duration-300 shadow-sm">
                  3
                </div>
                <h3 className="text-lg font-bold text-base-content mb-2.5">
                  {t('home.step3_title')}
                </h3>
                <p className="text-xs text-base-content/60 max-w-xs leading-relaxed">
                  {t('home.step3_desc')}
                </p>
              </div>
 
            </div>
          </div>
        </section>
 
        {/* AI TRINITY PILLARS */}
        <section className="py-24 bg-base-200 border-t border-base-300">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
                {t('home.trinity_title')}
              </h2>
              <p className="text-sm text-base-content/60 mt-3">
                {t('home.trinity_subtitle')}
              </p>
            </div>
 
            <div className="grid md:grid-cols-3 gap-8">
              
              <div className="card bg-base-100 border border-base-300 p-6 shadow-sm rounded-2xl">
                <div className="card-body p-0">
                  <div className="text-xs font-bold font-mono tracking-widest text-primary uppercase mb-2">
                    {t('home.trinity1_badge')}
                  </div>
                  <h3 className="font-bold text-lg text-base-content mb-2">
                    {t('home.trinity1_title')}
                  </h3>
                  <p className="text-xs text-base-content/60 leading-relaxed">
                    {t('home.trinity1_desc')}
                  </p>
                </div>
              </div>
 
              <div className="card bg-base-100 border border-base-300 p-6 shadow-sm rounded-2xl">
                <div className="card-body p-0">
                  <div className="text-xs font-bold font-mono tracking-widest text-secondary uppercase mb-2">
                    {t('home.trinity2_badge')}
                  </div>
                  <h3 className="font-bold text-lg text-base-content mb-2">
                    {t('home.trinity2_title')}
                  </h3>
                  <p className="text-xs text-base-content/60 leading-relaxed">
                    {t('home.trinity2_desc')}
                  </p>
                </div>
              </div>
 
              <div className="card bg-base-100 border border-base-300 p-6 shadow-sm rounded-2xl">
                <div className="card-body p-0">
                  <div className="text-xs font-bold font-mono tracking-widest text-accent uppercase mb-2">
                    {t('home.trinity3_badge')}
                  </div>
                  <h3 className="font-bold text-lg text-base-content mb-2">
                    {t('home.trinity3_title')}
                  </h3>
                  <p className="text-xs text-base-content/60 leading-relaxed">
                    {t('home.trinity3_desc')}
                  </p>
                </div>
              </div>
 
            </div>
          </div>
        </section>
 
        {/* TESTIMONIALS SECTION */}
        <section className="py-24 bg-base-100">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-extrabold text-base-content tracking-tight mb-12">
              {t('home.testimonials_title')}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="bg-base-200 border border-base-300 p-8 rounded-2xl relative">
                <span className="absolute top-4 right-6 text-5xl text-base-content/20 font-serif">“</span>
                <p className="text-sm text-base-content/85 italic mb-6 leading-relaxed">
                  {t('home.test1_quote')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    {t('home.test1_author').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-base-content">{t('home.test1_author')}</h4>
                    <p className="text-[10px] text-base-content/50">{t('home.test1_role')}</p>
                  </div>
                </div>
              </div>
 
              <div className="bg-base-200 border border-base-300 p-8 rounded-2xl relative">
                <span className="absolute top-4 right-6 text-5xl text-base-content/20 font-serif">“</span>
                <p className="text-sm text-base-content/85 italic mb-6 leading-relaxed">
                  {t('home.test2_quote')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs">
                    LR
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-base-content">{t('home.test2_author')}</h4>
                    <p className="text-[10px] text-base-content/50">{t('home.test2_role')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
 
        {/* PRICING TABLE SECTION */}
        <section className="py-24 bg-base-200 border-t border-base-300">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
                {t('home.pricing_title')}
              </h2>
              <p className="text-sm text-base-content/60 mt-3">
                {t('home.pricing_subtitle')}
              </p>
            </div>
 
            <div className="grid md:grid-cols-3 gap-8">
              
              {/* Free Tier */}
              <div className="card bg-base-100 border border-base-300 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-base-content">{t('home.plan_free_title')}</h3>
                  <p className="text-xs text-base-content/50 mt-1">{t('home.plan_free_desc')}</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-base-content font-mono">{t('home.plan_free_price')}</span>
                    <span className="text-xs text-base-content/50 ml-1">{t('home.plan_free_period')}</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs mb-8 text-base-content/75">
                  <li className="flex gap-2">✓ <span className="font-medium">{t('home.plan_free_f1')}</span></li>
                  <li className="flex gap-2">✓ <span className="font-medium">{t('home.plan_free_f2')}</span></li>
                  <li className="flex gap-2">✓ <span className="font-medium">{t('home.plan_free_f3')}</span></li>
                </ul>
                <a href="/auth/register" className="btn btn-outline border-primary text-primary hover:bg-primary/5 btn-block rounded-xl mt-auto h-11 text-xs font-semibold">
                  {t('home.plan_free_cta')}
                </a>
              </div>
 
              {/* Pro Tier (Popular) */}
              <div className="card bg-base-100 border-2 border-primary p-8 rounded-2xl shadow-md hover:shadow-lg transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-white text-[9px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-bl-xl">
                  Popular
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-base-content">{t('home.plan_pro_title')}</h3>
                  <p className="text-xs text-base-content/50 mt-1">{t('home.plan_pro_desc')}</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-base-content font-mono">{t('home.plan_pro_price')}</span>
                    <span className="text-xs text-base-content/50 ml-1">{t('home.plan_pro_period')}</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs mb-8 text-base-content/75">
                  <li className="flex gap-2">✓ <span className="font-medium">{t('home.plan_pro_f1')}</span></li>
                  <li className="flex gap-2">✓ <span className="font-medium">{t('home.plan_pro_f2')}</span></li>
                  <li className="flex gap-2">✓ <span className="font-medium">{t('home.plan_pro_f3')}</span></li>
                  <li className="flex gap-2">✓ <span className="font-medium">{t('home.plan_pro_f4')}</span></li>
                </ul>
                <a href="/pricing" className="btn btn-primary btn-block rounded-xl mt-auto h-11 text-xs font-semibold">
                  {t('home.plan_pro_cta')}
                </a>
              </div>
 
              {/* Recruiter Enterprise Tier */}
              <div className="card bg-base-100 border border-base-300 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-base-content">{t('home.plan_ent_title')}</h3>
                  <p className="text-xs text-base-content/50 mt-1">{t('home.plan_ent_desc')}</p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-base-content font-mono">{t('home.plan_ent_price')}</span>
                    <span className="text-xs text-base-content/50 ml-1">{t('home.plan_ent_period')}</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs mb-8 text-base-content/75">
                  <li className="flex gap-2">✓ <span className="font-medium">{t('home.plan_ent_f1')}</span></li>
                  <li className="flex gap-2">✓ <span className="font-medium">{t('home.plan_ent_f2')}</span></li>
                  <li className="flex gap-2">✓ <span className="font-medium">{t('home.plan_ent_f3')}</span></li>
                  <li className="flex gap-2">✓ <span className="font-medium">{t('home.plan_ent_f4')}</span></li>
                </ul>
                <a href="/auth/register" className="btn btn-outline border-primary text-primary hover:bg-primary/5 btn-block rounded-xl mt-auto h-11 text-xs font-semibold">
                  {t('home.plan_ent_cta')}
                </a>
              </div>
 
            </div>
          </div>
        </section>
 
      </main>
     </div>
  );
}
