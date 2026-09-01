import React from 'react';
import type { CVData } from '../../types';

interface TemplateProps {
  cv: CVData;
}

export const MinimalAtsTemplate: React.FC<TemplateProps> = ({ cv }) => {
  const { personal, experience, education, skills, projects, certifications, languages, achievements, customSections } = cv;

  // Filter internships from experience
  const workExperience = experience?.filter(e => !e.role.toLowerCase().includes('intern')) || [];
  const internships = experience?.filter(e => e.role.toLowerCase().includes('intern')) || [];

  return (
    <div className="w-full bg-white text-black p-8 font-sans leading-relaxed select-text space-y-6">
      {/* 1. Personal Information */}
      <div className="text-center border-b border-black pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-black">{personal?.name}</h1>
        {personal?.title && <p className="text-xs font-semibold text-gray-800 uppercase tracking-widest mt-1">{personal.title}</p>}
        
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-black mt-2 font-mono">
          {personal?.email && <span>{personal.email}</span>}
          {personal?.phone && <span>| {personal.phone}</span>}
          {personal?.address && <span>| {personal.address}</span>}
          {personal?.linkedIn && <span>| {personal.linkedIn.replace(/^https?:\/\//, '')}</span>}
          {personal?.gitHub && <span>| {personal.gitHub.replace(/^https?:\/\//, '')}</span>}
          {personal?.website && <span>| {personal.website.replace(/^https?:\/\//, '')}</span>}
        </div>
      </div>

      {/* 2. Professional Summary */}
      {personal?.summary && (
        <section>
          <h2 className="text-xs font-bold text-black uppercase tracking-widest border-b border-black pb-0.5 mb-2">Professional Summary</h2>
          <p className="text-xs text-black leading-relaxed">{personal.summary}</p>
        </section>
      )}

      {/* 3. Education */}
      {education && education.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-black uppercase tracking-widest border-b border-black pb-0.5 mb-2">Education</h2>
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-baseline font-bold text-black">
                  <span>{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}, {edu.school}</span>
                  <span className="font-mono text-[10px] font-normal text-black">{edu.startDate ? `${edu.startDate} - ` : ''}{edu.graduateDate}</span>
                </div>
                {edu.description && <p className="text-black mt-0.5">{edu.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Work Experience */}
      {workExperience.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-black uppercase tracking-widest border-b border-black pb-0.5 mb-2">Work Experience</h2>
          <div className="space-y-3">
            {workExperience.map((exp, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-baseline font-bold text-black">
                  <span>{exp.role}, {exp.company} {exp.location ? `(${exp.location})` : ''}</span>
                  <span className="font-mono text-[10px] font-normal text-black">{exp.startDate} – {exp.endDate}</span>
                </div>
                <p className="text-black mt-1 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Internships */}
      {internships.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-black uppercase tracking-widest border-b border-black pb-0.5 mb-2">Internships</h2>
          <div className="space-y-3">
            {internships.map((exp, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-baseline font-bold text-black">
                  <span>{exp.role}, {exp.company} {exp.location ? `(${exp.location})` : ''}</span>
                  <span className="font-mono text-[10px] font-normal text-black">{exp.startDate} – {exp.endDate}</span>
                </div>
                <p className="text-black mt-1 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Skills */}
      {skills && skills.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-black uppercase tracking-widest border-b border-black pb-0.5 mb-2">Skills</h2>
          <p className="text-xs text-black leading-relaxed">{skills.join(', ')}</p>
        </section>
      )}

      {/* 7. Projects */}
      {projects && projects.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-black uppercase tracking-widest border-b border-black pb-0.5 mb-2">Projects</h2>
          <div className="space-y-3">
            {projects.map((proj, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-baseline font-bold text-black">
                  <span>{proj.name}</span>
                  {(proj.url || proj.githubUrl) && (
                    <span className="font-mono text-[10px] font-normal text-black">
                      {proj.url || proj.githubUrl}
                    </span>
                  )}
                </div>
                <p className="text-black mt-0.5 leading-relaxed">{proj.description}</p>
                {proj.technologies && proj.technologies.length > 0 && (
                  <p className="text-[10px] text-black mt-0.5">Technologies: {proj.technologies.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Certifications */}
      {certifications && certifications.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-black uppercase tracking-widest border-b border-black pb-0.5 mb-2">Certifications</h2>
          <div className="space-y-1">
            {certifications.map((c, idx) => (
              <div key={idx} className="text-xs flex justify-between">
                <div>
                  <span className="font-bold text-black">{c.name}</span>
                  <span className="text-black">, {c.organization}</span>
                  {c.credentialUrl && (
                    <span className="text-[10px] text-black font-mono ml-2">
                      ({c.credentialUrl})
                    </span>
                  )}
                </div>
                {c.issueDate && <span className="font-mono text-[10px] text-black">{c.issueDate}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. Achievements */}
      {achievements && achievements.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-black uppercase tracking-widest border-b border-black pb-0.5 mb-2">Achievements</h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-black">
            {achievements.map((ach, idx) => (
              <li key={idx} className="leading-relaxed">{ach}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 10. Languages */}
      {languages && languages.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-black uppercase tracking-widest border-b border-black pb-0.5 mb-2">Languages</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {languages.map((lang, idx) => (
              <div key={idx} className="text-xs text-black">
                <span className="font-bold">{lang.language}</span> - <span>{lang.proficiency}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Custom Sections */}
      {customSections && customSections.length > 0 && customSections.map((sec) => (
        <section key={sec.id}>
          <h2 className="text-xs font-bold text-black uppercase tracking-widest border-b border-black pb-0.5 mb-2">{sec.title}</h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-black">
            {sec.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
