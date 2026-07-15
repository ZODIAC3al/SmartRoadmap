// Shared CV document shapes.
export type Experience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type Education = {
  school: string;
  degree: string;
  fieldOfStudy: string;
  graduateDate: string;
};

export type Project = {
  name: string;
  description: string;
  url: string;
};

export type Reference = {
  name: string;
  relationship: string;
  phone: string;
  email: string;
};

export type CVData = {
  personal: {
    name: string;
    email: string;
    phone: string;
    summary: string;
    photoUrl?: string;
    address?: string;
    website?: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  references?: Reference[];
  hobbies?: string[];
};
