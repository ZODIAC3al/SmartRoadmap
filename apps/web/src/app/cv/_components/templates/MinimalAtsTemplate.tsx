import React from 'react';
import type { CVData } from '../../types';

interface TemplateProps {
  cv: CVData;
}

export const MinimalAtsTemplate: React.FC<TemplateProps> = ({ cv }) => {
  const { personal, experience, education, skills, projects, certifications, customSections } = cv;

  return (
    <div className="w-full bg-base-100 text-black p-8 font-sans leading-snug select-text">
      {/* Header */}
      <div className="border-b border-black pb-3 mb-4">
        <h1 className="text-xl font-bold uppercase tracking-tight text-black">{personal?.name || 'Harry Wells'}</h1>
        <p className="text-xs font-semibold text-base-content uppercase mt-0.5">{personal?.title || 'Software Engineer'}</p>
        
        <div className="flex flex-wrap gap-2 text-[9px] text-base-content font-mono mt-2">
          {personal?.email && <span>Email: {personal.email}</span>}
          {personal?.phone && <span>| Phone: {personal.phone}</span>}
          {personal?.address && <span>| Location: {personal.address}</span>}
          {personal?.linkedIn && <span>| LinkedIn: {personal.linkedIn}</span>}
          {personal?.gitHub && <span>| GitHub: {personal.gitHub}</span>}
        </div>
      </div>

      {/* Summary */}
      {personal?.summary && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1">
            Professional Summary
          </h2>
          <p className="text-[9.5px] text-base-content leading-normal">{personal.summary}</p>
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1">
            Technical Skills
          </h2>
          <p className="text-[9.5px] text-base-content leading-normal font-mono">
            {skills.join(', ')}
          </p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2">
            Work Experience
          </h2>
          <div className="space-y-3">
            {experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline font-bold text-[10px]">
                  <span>{exp.role} — {exp.company}</span>
                  <span className="font-mono text-[8.5px] font-normal">{exp.startDate} - {exp.endDate}</span>
                </div>
                <p className="text-[9px] text-base-content mt-0.5 leading-normal">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2">
            Projects
          </h2>
          <div className="space-y-2">
            {projects.map((proj, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline font-bold text-[9.5px]">
                  <span>{proj.name}</span>
                  {(proj.url || proj.githubUrl) && (
                    <span className="font-mono text-[8.5px] font-normal">{proj.url || proj.githubUrl}</span>
                  )}
                </div>
                <p className="text-[9px] text-base-content leading-normal">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
            Education
          </h2>
          <div className="space-y-1.5">
            {education.map((edu, idx) => (
              <div key={idx} className="flex justify-between items-baseline text-[9.5px]">
                <div>
                  <span className="font-bold">{edu.degree} in {edu.fieldOfStudy}</span> — <span>{edu.school}</span>
                </div>
                <span className="font-mono text-[8.5px]">{edu.graduateDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5">
            Certifications
          </h2>
          <div className="space-y-1 text-[9px]">
            {certifications.map((c, idx) => (
              <div key={idx} className="flex justify-between">
                <span><strong className="font-semibold">{c.name}</strong> — {c.organization}</span>
                {c.issueDate && <span className="font-mono text-[8.5px]">{c.issueDate}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Sections */}
      {customSections && customSections.length > 0 && (
        <div className="space-y-4">
          {customSections.map((sec) => (
            <div key={sec.id}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1">
                {sec.title}
              </h2>
              <ul className="list-disc list-inside space-y-0.5 text-[9px] text-base-content">
                {sec.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
