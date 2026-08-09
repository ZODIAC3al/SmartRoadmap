import React from 'react';
import type { CVData } from '../../types';

interface TemplateProps {
  cv: CVData;
}

export const CreativeTemplate: React.FC<TemplateProps> = ({ cv }) => {
  const { personal, experience, education, skills, projects, certifications, customSections } = cv;

  return (
    <div className="w-full bg-white text-slate-800 flex flex-col font-sans select-text">
      {/* Creative Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white p-6 rounded-t shadow-md">
        <div className="flex items-center gap-4 flex-wrap">
          {personal?.photoUrl && (
            <img
              src={personal.photoUrl}
              alt="Photo"
              className="w-16 h-16 rounded-full object-cover border-2 border-white/80 shadow-md shrink-0"
            />
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">{personal?.name || 'Harry Wells'}</h1>
            <p className="text-xs font-semibold text-pink-200 tracking-wider uppercase mt-0.5">{personal?.title || 'Creative Software Engineer'}</p>
            
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[8.5px] text-white/90 mt-2 font-mono">
              {personal?.email && <span>📧 {personal.email}</span>}
              {personal?.phone && <span>📞 {personal.phone}</span>}
              {personal?.linkedIn && <span>🔗 {personal.linkedIn}</span>}
              {personal?.gitHub && <span>💻 {personal.gitHub}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Summary */}
        {personal?.summary && (
          <div className="bg-indigo-50/60 border-l-4 border-indigo-600 p-3 rounded-r">
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-900 mb-1">About Me</h2>
            <p className="text-[9px] text-indigo-950 leading-relaxed font-medium">{personal.summary}</p>
          </div>
        )}

        {/* Skills Tag Cloud */}
        {skills && skills.length > 0 && (
          <div>
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-900 border-b border-indigo-100 pb-1 mb-2">
              Core Skills & Tech Stack
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span key={idx} className="bg-indigo-100 text-indigo-800 text-[8.5px] font-bold px-2 py-0.5 rounded-full">
                  ⚡ {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <div>
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-900 border-b border-indigo-100 pb-1 mb-2.5">
              Work Experience
            </h2>
            <div className="space-y-3">
              {experience.map((exp, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-extrabold text-[9.5px] text-indigo-950">{exp.role}</span>
                    <span className="text-[8px] text-purple-700 font-mono font-bold">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <p className="text-[8.5px] text-purple-600 font-bold">{exp.company}</p>
                  <p className="text-[8.5px] text-slate-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <div>
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-900 border-b border-indigo-100 pb-1 mb-2.5">
              Featured Projects
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((proj, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-1">
                  <span className="font-extrabold text-[9px] text-slate-900 block">{proj.name}</span>
                  <p className="text-[8px] text-slate-600 leading-normal">{proj.description}</p>
                  {(proj.url || proj.githubUrl) && (
                    <a href={proj.url || proj.githubUrl} target="_blank" rel="noreferrer" className="text-[7.5px] text-pink-600 font-mono underline block truncate">
                      {proj.url || proj.githubUrl}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Certifications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {education && education.length > 0 && (
            <div>
              <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-900 border-b border-indigo-100 pb-1 mb-2">
                Education
              </h2>
              <div className="space-y-1.5">
                {education.map((edu, idx) => (
                  <div key={idx} className="text-[8.5px]">
                    <p className="font-bold text-slate-900">{edu.degree}</p>
                    <p className="text-purple-700">{edu.school}</p>
                    <p className="text-[7.5px] text-slate-400 font-mono">{edu.graduateDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications && certifications.length > 0 && (
            <div>
              <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-900 border-b border-indigo-100 pb-1 mb-2">
                Certifications
              </h2>
              <div className="space-y-1.5 text-[8.5px]">
                {certifications.map((c, idx) => (
                  <div key={idx}>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-pink-600">{c.organization}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom Sections */}
        {customSections && customSections.length > 0 && (
          <div className="space-y-3">
            {customSections.map((sec) => (
              <div key={sec.id}>
                <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-900 border-b border-indigo-100 pb-1 mb-1.5">
                  {sec.title}
                </h2>
                <ul className="list-disc list-inside space-y-0.5 text-[8.5px] text-slate-700">
                  {sec.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
