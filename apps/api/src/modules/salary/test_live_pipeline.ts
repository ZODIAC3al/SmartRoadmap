import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { SalaryService } from './salary.service';
import { AdzunaService } from './adzuna.service';
import { SalaryCacheService } from './salary-cache.service';
import { LLMService } from '../../ai/llm.service';
import { LearnerProfile } from '../../schemas/learner-profile.schema';
import { Job } from '../../schemas/job.schema';

async function runLiveDebug() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ['.env', 'apps/api/.env'],
      }),
    ],
    providers: [
      SalaryService,
      SalaryCacheService,
      AdzunaService,
      { provide: LLMService, useValue: { complete: async () => null } },
      { provide: getModelToken(LearnerProfile.name), useValue: { findOne: () => ({ exec: async () => null }), create: async () => ({}) } },
      { provide: getModelToken(Job.name), useValue: { find: () => ({ exec: async () => [] }) } },
    ],
  }).compile();

  const service = moduleRef.get<SalaryService>(SalaryService);
  const adzuna = moduleRef.get<AdzunaService>(AdzunaService);

  console.log('=== SALARY INGESTION PIPELINE DEBUG TEST ===\n');

  const cases = [
    { country: 'gb', title: 'junior backend developer' },
    { country: 'fr', title: 'junior backend developer' },
  ];

  for (const c of cases) {
    console.log(`==================================================`);
    console.log(`[TEST REQUEST] Country: ${c.country.toUpperCase()} | Job: "${c.title}"`);
    console.log(`User Profile Location: Alexandria, Egypt (ignored by market query)\n`);

    const adzunaResult = await adzuna.fetchSalaryData({
      jobTitle: c.title,
      location: 'Alexandria, Egypt',
      countryCode: c.country,
    });

    const finalResult = await service.predictSalaryRange({
      jobTitle: c.title,
      country: c.country,
      location: 'Alexandria, Egypt',
    });

    console.log(`\n--- FINAL SALARY RESULT ---`);
    console.log(`Data Status: ${finalResult.dataStatus}`);
    console.log(`Job Title: "${finalResult.jobTitle}"`);
    console.log(`Currency: ${finalResult.currency}`);
    console.log(`Min Salary: ${finalResult.minSalary}`);
    console.log(`Avg Salary: ${finalResult.avgSalary}`);
    console.log(`Max Salary: ${finalResult.maxSalary}`);
    console.log(`Jobs Analyzed: ${finalResult.jobsAnalyzed}`);
    console.log(`Source Label: "${finalResult.sourceLabel}"\n`);
  }
}

runLiveDebug();
