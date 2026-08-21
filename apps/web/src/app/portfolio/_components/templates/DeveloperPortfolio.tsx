import React from 'react';
import type { PortfolioData } from '@/lib/portfolio';

interface Props {
  portfolio: PortfolioData;
}

export const DeveloperPortfolio: React.FC<Props> = ({ portfolio }) => {
  const { title, bio, about, skills, projects, experience, education, socialLinks } = portfolio;

  return (
    <div className="w-full min-h-full bg-slate-950 text-slate-100 font-sans text-start select-text p-6 sm:p-12 space-y-12">
      {/* Hero Section */}
      <section className="space-y-4 max-w-3xl border-b border-slate-800 pb-10">
        <div className="inline-block bg-primary/20 text-primary border border-primary/30 text-xs font-mono font-bold px-3 py-1 rounded-full">
          ⚡ Open to opportunities
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          {title || 'Developer Portfolio'}
        </h1>
        <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
          {bio || 'Passionate software engineer building web applications.'}
        </p>

        {/* Social Links */}
        <div className="flex flex-wrap gap-4 text-xs font-mono pt-2">
          {socialLinks?.github && (
            <a href={socialLinks.github} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
              💻 GitHub
            </a>
          )}
          {socialLinks?.linkedin && (
            <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
              🔗 LinkedIn
            </a>
          )}
          {socialLinks?.email && (
            <span className="text-slate-400">📧 {socialLinks.email}</span>
          )}
        </div>
      </section>

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <section className="space-y-4 max-w-3xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
            Tech Stack & Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <span key={i} className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Featured Projects Grid */}
      {projects && projects.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
            Featured Projects ({projects.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj, i) => (
              <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-lg text-white">{proj.name}</h3>
                    {proj.stars !== undefined && proj.stars > 0 && (
                      <span className="text-xs text-yellow-400 font-mono">⭐ {proj.stars}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{proj.description}</p>
                </div>

                <div className="space-y-3 pt-2">
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {proj.technologies.map((t, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 text-xs font-mono">
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        GitHub Repo →
                      </a>
                    )}
                    {proj.demoLink && (
                      <a href={proj.demoLink} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                        Live Demo ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience & Education */}
      {(experience?.length || education?.length) ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl border-t border-slate-800 pt-8">
          {experience && experience.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary font-mono">Experience</h2>
              <div className="space-y-4">
                {experience.map((exp, i) => (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between text-white font-bold">
                      <span>{exp.role}</span>
                      <span className="text-slate-500 font-mono font-normal">{exp.startDate} - {exp.endDate}</span>
                    </div>
                    <p className="text-primary font-medium">{exp.company}</p>
                    <p className="text-slate-400 leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {education && education.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary font-mono">Education</h2>
              <div className="space-y-3">
                {education.map((edu, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <p className="font-bold text-white">{edu.degree} in {edu.fieldOfStudy}</p>
                    <p className="text-slate-400">{edu.school}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{edu.graduateDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
};
