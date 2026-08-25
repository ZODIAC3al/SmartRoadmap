import React from 'react';
import type { PortfolioData } from '@/lib/portfolio';

interface Props {
  portfolio: PortfolioData;
}

export const ModernPortfolio: React.FC<Props> = ({ portfolio }) => {
  const { title, bio, about, skills, projects, experience, education, socialLinks } = portfolio;

  return (
    <div className="w-full min-h-full bg-base-300 text-slate-100 font-sans select-text p-6 sm:p-12 space-y-12">
      {/* Modern Gradient Banner Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-4">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          {title || 'Developer Portfolio'}
        </h1>
        <p className="text-sm sm:text-lg text-blue-100 max-w-2xl leading-relaxed font-medium">
          {bio || 'Building scalable web applications and technical solutions.'}
        </p>

        <div className="flex flex-wrap gap-4 pt-4 text-xs font-bold">
          {socialLinks?.github && (
            <a href={socialLinks.github} target="_blank" rel="noreferrer" className="btn btn-sm bg-base-100 text-base-content hover:bg-base-200 border-none rounded-xl font-bold transition-all duration-300 ease-in-out">
              GitHub Profile
            </a>
          )}
          {socialLinks?.linkedin && (
            <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="btn btn-sm bg-primary text-primary-content hover:bg-primary text-primary-content text-white border-none rounded-xl font-bold transition-all duration-300 ease-in-out">
              LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* Featured Skills */}
      {skills && skills.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-indigo-400 font-mono">
            Expertise & Technologies
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <span key={i} className="bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs font-extrabold px-3 py-1.5 rounded-xl">
                ✨ {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Projects Grid */}
      {projects && projects.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-indigo-400 font-mono">
            Projects Showcase ({projects.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj, i) => (
              <div key={i} className="bg-base-300/80 border border-slate-700/80 rounded-3xl p-6 space-y-4 shadow-lg hover:border-primary transition-colors">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-xl text-white">{proj.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
                </div>

                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {proj.technologies.map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-base-300 text-indigo-300 font-mono px-2 py-0.5 rounded-xl">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 text-xs font-bold pt-2">
                  {proj.githubUrl && (
                    <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline transition-all duration-300 ease-in-out">
                      GitHub →
                    </a>
                  )}
                  {proj.demoLink && (
                    <a href={proj.demoLink} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline transition-all duration-300 ease-in-out">
                      Live Preview ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timeline Section */}
      {experience && experience.length > 0 && (
        <section className="space-y-6 max-w-4xl">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-indigo-400 font-mono">
            Work History
          </h2>
          <div className="space-y-4 border-l-2 border-primary pl-6">
            {experience.map((exp, i) => (
              <div key={i} className="space-y-1 relative">
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-primary text-primary-content border-2 border-slate-900" />
                <div className="flex justify-between items-baseline">
                  <h3 className="font-extrabold text-sm text-white">{exp.role}</h3>
                  <span className="text-xs text-indigo-400 font-mono">{exp.startDate} – {exp.endDate}</span>
                </div>
                <p className="text-xs text-indigo-300 font-semibold">{exp.company}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
