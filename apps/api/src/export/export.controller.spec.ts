import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ExportController } from './export.controller';
import { CertificationExportService } from './certification-export.service';
import { User } from '../schemas/user.schema';
import { Roadmap } from '../schemas/roadmap.schema';
import { Streak } from '../schemas/streak.schema';
import { UserAchievement } from '../schemas/user-achievement.schema';

import { TrackCertification } from '../schemas/track-certification.schema';

describe('ExportController & CertificationExportService', () => {
  let controller: ExportController;
  let service: CertificationExportService;
  let userModel: any;
  let roadmapModel: any;
  let streakModel: any;
  let achievementModel: any;
  let certModel: any;

  const mockUserId = '507f191e810c19729de860ea';

  beforeEach(async () => {
    userModel = {
      findById: jest.fn(),
    };
    roadmapModel = {
      findOne: jest.fn(),
    };
    streakModel = {
      findOne: jest.fn(),
    };
    achievementModel = {
      countDocuments: jest.fn(),
      create: jest.fn(),
    };
    certModel = {
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        CertificationExportService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Roadmap.name), useValue: roadmapModel },
        { provide: getModelToken(Streak.name), useValue: streakModel },
        {
          provide: getModelToken(UserAchievement.name),
          useValue: achievementModel,
        },
        {
          provide: getModelToken(TrackCertification.name),
          useValue: certModel,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ExportController>(ExportController);
    service = module.get<CertificationExportService>(
      CertificationExportService,
    );
  });

  it('should generate valid certification export payload for authenticated user', async () => {
    userModel.findById.mockResolvedValue({
      _id: mockUserId,
      name: 'Alex Johnson',
      email: 'alex@example.com',
    });

    roadmapModel.findOne.mockResolvedValue({
      title: 'Frontend Engineer Track',
      modules: [
        {
          id: 'm1',
          title: 'HTML Basics',
          status: 'completed',
          topics: ['HTML'],
        },
        {
          id: 'm2',
          title: 'CSS Layout',
          status: 'completed',
          topics: ['CSS', 'Flexbox'],
        },
      ],
    });

    streakModel.findOne.mockResolvedValue({
      longestStreak: 12,
      currentStreak: 5,
    });

    achievementModel.countDocuments.mockResolvedValue(4);

    const jwtUser = {
      sub: mockUserId,
      email: 'alex@example.com',
      role: 'learner' as const,
    };
    const result = await controller.getCertificationExport(
      'track_frontend',
      jwtUser,
    );

    expect(result).toBeDefined();
    expect(result.certificateId).toMatch(/^DEV-CERT-[A-F0-9]{16}$/);
    expect(result.issuedTo.name).toBe('Alex Johnson');
    expect(result.trackInfo.progressPercentage).toBe(100);
    expect(result.verifiedSkills).toEqual(['HTML', 'CSS', 'Flexbox']);
    expect(result.streakInfo.longestStreakDays).toBe(12);
    expect(result.achievementsUnlocked).toBe(4);
  });
});
