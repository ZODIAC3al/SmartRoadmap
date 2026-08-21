import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SalaryService } from './salary.service';
import { AdzunaService } from './adzuna.service';
import { SalaryCacheService } from './salary-cache.service';
import { LLMService } from '../../ai/llm.service';
import { LearnerProfile } from '../../schemas/learner-profile.schema';
import { Job } from '../../schemas/job.schema';

describe('SalaryService Pipeline Tests', () => {
  let service: SalaryService;

  const mockProfileModel = {
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        userId: '507f1f77bcf86cd799439011',
        currentRole: 'Junior Backend Developer',
        location: 'Alexandria, Egypt',
        skills: ['Node.js', 'TypeScript'],
        experienceYears: 1,
      }),
    }),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockJobModel = {
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockLLMService = {
    complete: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalaryService,
        SalaryCacheService,
        {
          provide: AdzunaService,
          useValue: {
            fetchSalaryData: jest.fn().mockImplementation(async (params) => {
              if (params.countryCode === 'gb') {
                return {
                  minSalary: 32000,
                  avgSalary: 42000,
                  maxSalary: 55000,
                  currency: 'GBP',
                  jobsAnalyzed: 35,
                  confidenceScore: 70,
                  marketDemand: 'High',
                  trendingSkills: ['Node.js', 'TypeScript', 'AWS'],
                  salaryGrowthTrends: [],
                  country: 'gb',
                };
              }
              if (params.countryCode === 'us') {
                return {
                  minSalary: 75000,
                  avgSalary: 95000,
                  maxSalary: 120000,
                  currency: 'USD',
                  jobsAnalyzed: 50,
                  confidenceScore: 80,
                  marketDemand: 'High',
                  trendingSkills: ['Node.js', 'TypeScript', 'AWS'],
                  salaryGrowthTrends: [],
                  country: 'us',
                };
              }
              if (params.countryCode === 'fr') {
                return {
                  minSalary: 35000,
                  avgSalary: 44000,
                  maxSalary: 56000,
                  currency: 'EUR',
                  jobsAnalyzed: 20,
                  confidenceScore: 60,
                  marketDemand: 'Moderate',
                  trendingSkills: ['Node.js', 'Docker', 'Express'],
                  salaryGrowthTrends: [],
                  country: 'fr',
                };
              }
              if (params.countryCode === 'de') {
                return {
                  minSalary: 42000,
                  avgSalary: 52000,
                  maxSalary: 68000,
                  currency: 'EUR',
                  jobsAnalyzed: 28,
                  confidenceScore: 65,
                  marketDemand: 'High',
                  trendingSkills: ['Node.js', 'Go', 'Kubernetes'],
                  salaryGrowthTrends: [],
                  country: 'de',
                };
              }
              return null; // non-adzuna country e.g. Egypt
            }),
            resolveCountryFromLocation: jest.fn().mockReturnValue({
              code: 'eg',
              label: 'Egypt',
              currency: 'EGP',
              adzunaCode: null,
            }),
          },
        },
        { provide: LLMService, useValue: mockLLMService },
        {
          provide: getModelToken(LearnerProfile.name),
          useValue: mockProfileModel,
        },
        { provide: getModelToken(Job.name), useValue: mockJobModel },
      ],
    }).compile();

    service = module.get<SalaryService>(SalaryService);
  });

  it('1. UK + junior backend developer → GBP', async () => {
    const res = await service.predictSalaryRange({
      jobTitle: 'junior backend developer',
      country: 'gb',
      location: 'Alexandria, Egypt',
    });
    expect(res.currency).toBe('GBP');
    expect(res.minSalary).toBe(32000);
    expect(res.avgSalary).toBe(42000);
    expect(res.maxSalary).toBe(55000);
    expect(res.dataStatus).not.toBe('NO_DATA');
  });

  it('2. USA + junior backend developer → USD', async () => {
    const res = await service.predictSalaryRange({
      jobTitle: 'junior backend developer',
      country: 'us',
      location: 'Alexandria, Egypt',
    });
    expect(res.currency).toBe('USD');
    expect(res.minSalary).toBe(75000);
    expect(res.avgSalary).toBe(95000);
    expect(res.maxSalary).toBe(120000);
    expect(res.dataStatus).not.toBe('NO_DATA');
  });

  it('3. France + junior backend developer → EUR', async () => {
    const res = await service.predictSalaryRange({
      jobTitle: 'junior backend developer',
      country: 'fr',
      location: 'Alexandria, Egypt',
    });
    expect(res.currency).toBe('EUR');
    expect(res.minSalary).toBe(35000);
    expect(res.avgSalary).toBe(44000);
    expect(res.maxSalary).toBe(56000);
    expect(res.dataStatus).not.toBe('NO_DATA');
  });

  it('4. Germany + junior backend developer → EUR', async () => {
    const res = await service.predictSalaryRange({
      jobTitle: 'junior backend developer',
      country: 'de',
      location: 'Alexandria, Egypt',
    });
    expect(res.currency).toBe('EUR');
    expect(res.minSalary).toBe(42000);
    expect(res.avgSalary).toBe(52000);
    expect(res.maxSalary).toBe(68000);
    expect(res.dataStatus).not.toBe('NO_DATA');
  });

  it('5. Egypt + junior backend developer → EGP', async () => {
    const res = await service.predictSalaryRange({
      jobTitle: 'junior backend developer',
      country: 'eg',
      location: 'Alexandria, Egypt',
    });
    expect(res.currency).toBe('EGP');
    expect(res.minSalary).toBeGreaterThan(0);
    expect(res.avgSalary).toBeGreaterThan(0);
    expect(res.maxSalary).toBeGreaterThan(0);
    expect(res.dataStatus).toBe('AI_ESTIMATE');
  });
});
