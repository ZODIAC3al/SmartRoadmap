import React from 'react';
import type { CVData } from '../types';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { MinimalAtsTemplate } from './templates/MinimalAtsTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';

interface CvRendererProps {
  cv: CVData;
}

export const CvRenderer: React.FC<CvRendererProps> = ({ cv }) => {
  const templateName = cv.template || 'modern';

  switch (templateName) {
    case 'classic':
      return <ClassicTemplate cv={cv} />;
    case 'minimal':
      return <MinimalAtsTemplate cv={cv} />;
    case 'creative':
      return <CreativeTemplate cv={cv} />;
    case 'modern':
    default:
      return <ModernTemplate cv={cv} />;
  }
};
