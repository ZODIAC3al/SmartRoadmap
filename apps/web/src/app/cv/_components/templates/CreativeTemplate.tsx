import React from 'react';
import type { CVData } from '../../types';

interface TemplateProps {
  cv: CVData;
}

export const CreativeTemplate: React.FC<TemplateProps> = ({ cv }) => {
  const { personal, experience, education, skills, projects, certifications, languages, achievements, customSections } = cv;

  // Filter internships from experience
  const workExperience = experience?.filter(e => !e.role.toLowerCase().includes('intern')) || [];
  const internships = experience?.filter(e => e.role.toLowerCase().includes('intern')) || [];

  return (
    <div className="w-full bg-white text-black p-8 font-sans leading-relaxed select-text space-y-6">
      {/* 1. Personal Information */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start border-b-4 border-primary pb-6">
        {personal?.photoUrl && (
          <img src={personal.photoUrl} alt="Photo" className="w-24 h-24 rounded-2xl object-cover border-2 border-primary/20 shadow-md shrink-0" />
        )}
        <div className="text-center md:text-left flex-grow">
          <h1 className="text-4xl font-extrabold uppercase tracking-tight text-primary">{personal?.name}</h1>
          {personal?.title && <p className="text-sm font-bold text-gray-800 uppercase tracking-widest mt-1">{personal.title}</p>}
          
          <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-gray-700 mt-4 font-medium">
            {personal?.email && <span>📧 <a href={`mailto:${personal.email}`} className="hover:text-primary">{personal.email}</a></span>}
            {personal?.phone && <span>📞 {personal.phone}</span>}
            {personal?.address && <span>📍 {personal.address}</span>}
            {personal?.linkedIn && <span>🔗 <a href={personal.linkedIn.startsWith('http') ? personal.linkedIn : `https://${personal.linkedIn}`} target="_blank" rel="noreferrer" className="hover:text-primary">{personal.linkedIn}</a></span>}
            {personal?.gitHub && <span>💻 <a href={personal.gitHub.startsWith('http') ? personal.gitHub : `https://${personal.gitHub}`} target="_blank" rel="noreferrer" className="hover:text-primary">{personal.gitHub}</a></span>}
            {personal?.website && <span>🌐 <a href={personal.website.startsWith('http') ? personal.website : `https://${personal.website}`} target="_blank" rel="noreferrer" className="hover:text-primary">{personal.website}</a></span>}
          </div>
        </div>
      </div>

      {/* 2. Professional Summary */}
      {personal?.summary && (
        <section>
          <h2 className="text-sm font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-1 mb-3">Professional Summary</h2>
          <p className="text-xs text-gray-800 leading-relaxed font-medium">{personal.summary}</p>
        </section>
      )}

      {/* 3. Education */}
      {education && education.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-1 mb-3">Education</h2>
          <div className="space-y-4">
            {education.map((edu, idx) => (
              <div key={idx} className="text-xs bg-gray-50/50 rounded-lg p-3 border-l-2 border-primary/40">
                <div className="flex justify-between items-baseline font-bold text-black">
                  <span className="text-[13px]">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</span>
                  <span className="font-mono text-[10px] font-normal text-gray-500 bg-gray-100 px-1.5 rounded">{edu.startDate ? `${edu.startDate} - ` : ''}{edu.graduateDate}</span>
                </div>
                <p className="text-primary font-bold mt-1">{edu.school}</p>
                {edu.description && <p className="text-gray-700 mt-2">{edu.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Work Experience */}
      {workExperience.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-1 mb-3">Work Experience</h2>
          <div className="space-y-4">
            {workExperience.map((exp, idx) => (
              <div key={idx} className="text-xs bg-gray-50/50 rounded-lg p-3 border-l-2 border-primary/40">
                <div className="flex justify-between items-baseline font-bold text-black">
                  <span className="text-[13px]">{exp.role}</span>
                  <span className="font-mono text-[10px] font-normal text-gray-500 bg-gray-100 px-1.5 rounded">{exp.startDate} – {exp.endDate}</span>
                </div>
                <p className="text-primary font-bold mt-1">{exp.company} {exp.location ? `| ${exp.location}` : ''}</p>
                <p className="text-gray-800 mt-2 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Internships */}
      {internships.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-1 mb-3">Internships</h2>
          <div className="space-y-4">
            {internships.map((exp, idx) => (
              <div key={idx} className="text-xs bg-gray-50/50 rounded-lg p-3 border-l-2 border-primary/40">
                <div className="flex justify-between items-baseline font-bold text-black">
                  <span className="text-[13px]">{exp.role}</span>
                  <span className="font-mono text-[10px] font-normal text-gray-500 bg-gray-100 px-1.5 rounded">{exp.startDate} – {exp.endDate}</span>
                </div>
                <p className="text-primary font-bold mt-1">{exp.company} {exp.location ? `| ${exp.location}` : ''}</p>
                <p className="text-gray-800 mt-2 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Skills */}
      {skills && skills.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-1 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span key={idx} className="bg-primary text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 7. Projects */}
      {projects && projects.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-1 mb-3">Projects</h2>
          <div className="space-y-4">
            {projects.map((proj, idx) => (
              <div key={idx} className="text-xs bg-gray-50/50 rounded-lg p-3 border-l-2 border-primary/40">
                <div className="flex justify-between items-baseline font-bold text-black">
                  <span className="text-[13px]">{proj.name}</span>
                  {(proj.url || proj.githubUrl) && (
                    <a href={(proj.url || proj.githubUrl || '').startsWith('http') ? (proj.url || proj.githubUrl) : `https://${proj.url || proj.githubUrl}`} target="_blank" rel="noreferrer" className="font-mono text-[10px] font-normal text-primary hover:underline bg-primary/5 px-1.5 rounded">
                      {proj.url || proj.githubUrl}
                    </a>
                  )}
                </div>
                <p className="text-gray-800 mt-2 leading-relaxed">{proj.description}</p>
                {proj.technologies && proj.technologies.length > 0 && (
                  <p className="text-[10px] text-gray-500 mt-2 font-mono">Tech: {proj.technologies.join(' • ')}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Certifications */}
      {certifications && certifications.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-1 mb-3">Certifications</h2>
          <div className="space-y-3">
            {certifications.map((c, idx) => (
              <div key={idx} className="text-xs flex justify-between bg-gray-50/50 rounded-lg p-3 border-l-2 border-primary/40">
                <div>
                  <span className="font-bold text-black text-[13px]">{c.name}</span>
                  <span className="text-gray-600 block mt-0.5">{c.organization}</span>
                  {c.credentialUrl && (
                    <div className="mt-1.5">
                      <a href={c.credentialUrl.startsWith('http') ? c.credentialUrl : `https://${c.credentialUrl}`} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline font-bold bg-primary/5 px-1.5 py-0.5 rounded">
                        Verify Credential
                      </a>
                    </div>
                  )}
                </div>
                {c.issueDate && <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded h-fit">{c.issueDate}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. Achievements */}
      {achievements && achievements.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-1 mb-3">Achievements</h2>
          <ul className="list-disc list-outside ml-4 space-y-2 text-xs text-gray-800">
            {achievements.map((ach, idx) => (
              <li key={idx} className="leading-relaxed font-medium">{ach}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 10. Languages */}
      {languages && languages.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-1 mb-3">Languages</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {languages.map((lang, idx) => (
              <div key={idx} className="text-xs bg-gray-50/50 p-2 rounded-lg border border-primary/10">
                <span className="font-bold text-black block">{lang.language}</span>
                <span className="text-gray-600 text-[10px]">{lang.proficiency}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Custom Sections */}
      {customSections && customSections.length > 0 && customSections.map((sec) => (
        <section key={sec.id}>
          <h2 className="text-sm font-black text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-1 mb-3">{sec.title}</h2>
          <ul className="list-disc list-outside ml-4 space-y-2 text-xs text-gray-800">
            {sec.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed font-medium">{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
