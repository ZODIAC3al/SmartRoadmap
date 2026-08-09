import React from 'react';
import type { CVData } from '../../types';

interface TemplateProps {
  cv: CVData;
}

export const ClassicTemplate: React.FC<TemplateProps> = ({ cv }) => {
  const { personal, experience, education, skills, projects, certifications, courses, languages, volunteerExperience, publications, awards, references, hobbies, customSections, sectionOrder } = cv;

  const defaultOrder = ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'courses', 'languages', 'volunteerExperience', 'publications', 'awards', 'references', 'hobbies'];
  const activeOrder = sectionOrder && sectionOrder.length > 0 ? sectionOrder : defaultOrder;

  const renderSection = (sectionKey: string) => {
    switch (sectionKey) {
      case 'summary':
        return personal?.summary ? (
          <div key="summary" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2 font-serif">
              Professional Summary
            </h2>
            <p className="text-[10px] text-gray-700 leading-relaxed font-serif">{personal.summary}</p>
          </div>
        ) : null;

      case 'experience':
        return experience && experience.length > 0 ? (
          <div key="experience" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-3 font-serif">
              Work Experience
            </h2>
            <div className="space-y-3 font-serif">
              {experience.map((exp, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-xs text-gray-900">{exp.role}</span>
                    <span className="text-[9px] text-gray-500 font-mono">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <div className="text-[10px] text-gray-700 italic font-semibold">{exp.company} {exp.location ? `| ${exp.location}` : ''}</div>
                  <p className="text-[9.5px] text-gray-600 leading-relaxed pl-2 border-l border-gray-200">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'projects':
        return projects && projects.length > 0 ? (
          <div key="projects" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-3 font-serif">
              Key Projects
            </h2>
            <div className="space-y-3 font-serif">
              {projects.map((proj, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-xs text-gray-900">{proj.name}</span>
                    {(proj.url || proj.githubUrl) && (
                      <span className="text-[8.5px] text-gray-600 font-mono">{proj.url || proj.githubUrl}</span>
                    )}
                  </div>
                  <p className="text-[9.5px] text-gray-600 leading-relaxed">{proj.description}</p>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <p className="text-[8.5px] text-gray-500 font-mono">Technologies: {proj.technologies.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'skills':
        return skills && skills.length > 0 ? (
          <div key="skills" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2 font-serif">
              Technical & Professional Skills
            </h2>
            <p className="text-[10px] text-gray-700 leading-relaxed font-serif">
              {skills.join(' • ')}
            </p>
          </div>
        ) : null;

      case 'education':
        return education && education.length > 0 ? (
          <div key="education" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2 font-serif">
              Education
            </h2>
            <div className="space-y-2 font-serif">
              {education.map((edu, idx) => (
                <div key={idx} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-[10.5px] text-gray-900">{edu.degree} in {edu.fieldOfStudy}</span>
                    <p className="text-[9.5px] text-gray-700 italic">{edu.school}</p>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono">{edu.graduateDate}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'certifications':
        return certifications && certifications.length > 0 ? (
          <div key="certifications" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2 font-serif">
              Certifications
            </h2>
            <div className="space-y-1 font-serif text-[9.5px]">
              {certifications.map((c, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="font-bold text-gray-900">{c.name} — <span className="font-normal text-gray-700">{c.organization}</span></span>
                  {c.issueDate && <span className="text-gray-500 font-mono">{c.issueDate}</span>}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white text-gray-900 p-8 font-serif leading-normal select-text">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-900 pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900">{personal?.name || 'Harry Wells'}</h1>
        <p className="text-xs font-semibold tracking-widest text-gray-700 uppercase mt-1">{personal?.title || 'Software Engineer'}</p>
        
        <div className="flex flex-wrap justify-center items-center gap-3 text-[9px] text-gray-600 font-sans mt-3">
          {personal?.email && <span>📧 {personal.email}</span>}
          {personal?.phone && <span>📞 {personal.phone}</span>}
          {personal?.address && <span>📍 {personal.address}</span>}
          {personal?.linkedIn && <span>🔗 LinkedIn: {personal.linkedIn}</span>}
          {personal?.gitHub && <span>💻 GitHub: {personal.gitHub}</span>}
          {personal?.website && <span>🌐 {personal.website}</span>}
        </div>
      </div>

      {/* Dynamic Render Sections */}
      {activeOrder.map((sectionKey) => renderSection(sectionKey))}

      {/* Custom Sections */}
      {customSections && customSections.length > 0 && (
        <div className="space-y-5">
          {customSections.map((sec) => (
            <div key={sec.id} className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2 font-serif">
                {sec.title}
              </h2>
              <ul className="list-disc list-inside space-y-1 text-[9.5px] text-gray-700 font-serif">
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
