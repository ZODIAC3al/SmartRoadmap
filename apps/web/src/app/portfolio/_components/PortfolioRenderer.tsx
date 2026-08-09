import React from 'react';
import type { PortfolioData } from '@/lib/portfolio';
import { DeveloperPortfolio } from './templates/DeveloperPortfolio';
import { ModernPortfolio } from './templates/ModernPortfolio';
import { MinimalPortfolio } from './templates/MinimalPortfolio';

interface Props {
  portfolio: PortfolioData;
}

export const PortfolioRenderer: React.FC<Props> = ({ portfolio }) => {
  const tpl = portfolio.template || 'developer';

  switch (tpl) {
    case 'modern':
      return <ModernPortfolio portfolio={portfolio} />;
    case 'minimal':
      return <MinimalPortfolio portfolio={portfolio} />;
    case 'developer':
    default:
      return <DeveloperPortfolio portfolio={portfolio} />;
  }
};
