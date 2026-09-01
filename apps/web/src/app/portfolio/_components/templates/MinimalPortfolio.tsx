import React from 'react';
import type { PortfolioData } from '@/lib/portfolio';

interface Props {
  portfolio: PortfolioData;
}

export const MinimalPortfolio: React.FC<Props> = ({ portfolio }) => {
  const { title, bio, skills, projects, experience, education, socialLinks } = portfolio;

  return (
    <div className="w-full min-h-full bg-base-100 text-base-content font-sans select-text p-6 sm:p-12 space-y-10">
      {/* Header */}
      <header className="border-b border-gray-900 pb-6 space-y-3 max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight uppercase text-black">{title || 'Portfolio'}</h1>
        <p className="text-sm text-base-content/70 font-serif leading-relaxed">{bio}</p>

        <div className="flex flex-wrap gap-4 text-xs font-mono text-base-content/70 pt-2">
          {socialLinks?.github && <span>GitHub: {socialLinks.github}</span>}
          {socialLinks?.linkedin && <span>LinkedIn: {socialLinks.linkedin}</span>}
          {socialLinks?.email && <span>Email: {socialLinks.email}</span>}
        </div>
      </header>

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="space-y-2 max-w-3xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-base-300 pb-1">
            Skills
          </h2>
          <p className="text-xs font-mono text-base-content leading-normal">{skills.join(', ')}</p>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="space-y-4 max-w-3xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-base-300 pb-1">
            Projects
          </h2>
          <div className="space-y-4">
            {projects.map((proj, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-sm text-black">{proj.name}</h3>
                  {proj.githubUrl && (
                    <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-xs font-mono text-base-content/70 underline">
                      {proj.githubUrl}
                    </a>
                  )}
                </div>
                <p className="text-xs text-base-content/70 font-serif leading-normal">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="space-y-3 max-w-3xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-base-300 pb-1">
            Experience
          </h2>
          <div className="space-y-3">
            {experience.map((exp, i) => (
              <div key={i} className="space-y-0.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span>{exp.role} — {exp.company}</span>
                  <span className="font-mono text-base-content/70 font-normal">{exp.startDate} - {exp.endDate}</span>
                </div>
                <p className="text-base-content/70 font-serif leading-normal">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
