import React from 'react';
import type { CVData } from '../../types';

interface TemplateProps {
  cv: CVData;
}

export const ModernTemplate: React.FC<TemplateProps> = ({ cv }) => {
  const { personal, experience, education, skills, projects, certifications, courses, languages, hobbies, customSections } = cv;

  return (
    <div className="w-full bg-white text-gray-800 flex flex-col font-sans select-text">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-[#8E1616]/20 p-6 bg-white flex-wrap gap-4">
        <div className="flex gap-4 items-center">
          {personal?.photoUrl && (
            <img
              src={personal.photoUrl}
              alt="Photo"
              className="w-16 h-16 rounded-lg object-cover border border-gray-300 shadow-sm shrink-0"
            />
          )}
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
              {personal?.name || 'Harry Wells'}
            </h1>
            <p className="text-xs text-[#8E1616] font-bold uppercase font-mono tracking-wider mt-0.5">
              {personal?.title || 'Software Engineer'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[8.5px] text-gray-500 mt-2 font-mono">
              {personal?.email && <div>✉️ {personal.email}</div>}
              {personal?.phone && <div>📞 {personal.phone}</div>}
              {personal?.linkedIn && <div className="truncate">🔗 {personal.linkedIn}</div>}
              {personal?.gitHub && <div className="truncate">💻 {personal.gitHub}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Two column split */}
      <div className="grid grid-cols-12 flex-grow">
        {/* Left Sidebar */}
        <div className="col-span-4 bg-slate-50 p-5 border-r border-gray-100 flex flex-col gap-5 text-xs text-gray-700">
          {personal?.summary && (
            <div>
              <h3 className="text-[9.5px] font-extrabold text-[#8E1616] uppercase tracking-widest border-b border-gray-200 pb-1 mb-1.5">
                Profile
              </h3>
              <p className="text-[8.5px] leading-relaxed text-gray-600">{personal.summary}</p>
            </div>
          )}

          {education && education.length > 0 && (
            <div>
              <h3 className="text-[9.5px] font-extrabold text-[#8E1616] uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">
                Education
              </h3>
              <div className="space-y-2">
                {education.map((edu, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="font-extrabold text-[8.5px] text-gray-900 leading-tight">{edu.degree}</p>
                    <p className="text-[8px] text-[#8E1616] font-semibold">{edu.school}</p>
                    <p className="text-[7.5px] text-gray-400 font-mono">{edu.graduateDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skills && skills.length > 0 && (
            <div>
              <h3 className="text-[9.5px] font-extrabold text-[#8E1616] uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">
                Skills
              </h3>
              <div className="flex flex-wrap gap-1">
                {skills.map((skill, idx) => (
                  <span key={idx} className="bg-[#8E1616]/10 text-[#8E1616] border border-[#8E1616]/20 text-[8px] font-bold px-1.5 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {certifications && certifications.length > 0 && (
            <div>
              <h3 className="text-[9.5px] font-extrabold text-[#8E1616] uppercase tracking-widest border-b border-gray-200 pb-1 mb-1.5">
                Certifications
              </h3>
              <div className="space-y-1.5">
                {certifications.map((c, idx) => (
                  <div key={idx} className="text-[8px]">
                    <p className="font-bold text-gray-900">{c.name}</p>
                    <p className="text-[#8E1616] font-semibold">{c.organization}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Main Column */}
        <div className="col-span-8 p-5 flex flex-col gap-5 text-xs text-gray-700">
          {experience && experience.length > 0 && (
            <div>
              <h3 className="text-[9.5px] font-extrabold text-[#8E1616] uppercase tracking-widest border-b border-gray-200 pb-1 mb-2.5">
                Work Experience
              </h3>
              <div className="space-y-3">
                {experience.map((exp, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-baseline font-mono">
                      <span className="font-extrabold text-[9px] text-gray-900 font-sans">{exp.role}</span>
                      <span className="text-[7.5px] text-gray-400">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    <p className="text-[8px] text-[#8E1616] font-bold">{exp.company}</p>
                    <p className="text-[8.5px] leading-relaxed text-gray-600 pl-1.5 border-l-2 border-[#8E1616]/20">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects && projects.length > 0 && (
            <div>
              <h3 className="text-[9.5px] font-extrabold text-[#8E1616] uppercase tracking-widest border-b border-gray-200 pb-1 mb-2.5">
                Featured Projects
              </h3>
              <div className="space-y-2.5">
                {projects.map((proj, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-[8.5px] text-gray-900">{proj.name}</span>
                      {(proj.url || proj.githubUrl) && (
                        <span className="text-[7.5px] text-[#8E1616] font-mono">{proj.url || proj.githubUrl}</span>
                      )}
                    </div>
                    <p className="text-[8px] leading-relaxed text-gray-600">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customSections && customSections.length > 0 && (
            <div className="space-y-3">
              {customSections.map((sec) => (
                <div key={sec.id}>
                  <h3 className="text-[9.5px] font-extrabold text-[#8E1616] uppercase tracking-widest border-b border-gray-200 pb-1 mb-1.5">
                    {sec.title}
                  </h3>
                  <ul className="list-disc list-inside space-y-0.5 text-[8px] text-gray-600">
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
    </div>
  );
};
