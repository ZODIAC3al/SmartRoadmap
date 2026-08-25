import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { AiUsageService } from './ai-usage.service';
import { Subscription } from '../../schemas/subscription.schema';
import { Company } from '../../schemas/company.schema';
import { AiUsageLedger } from '../../schemas/ai-usage-ledger.schema';
import { AiReservation } from '../../schemas/ai-reservation.schema';
import { JwtUser } from '../../common/decorators/current-user.decorator';

import { User } from '../../schemas/user.schema';

describe('AiUsageService', () => {
  let service: AiUsageService;

  const mockUserModel = {
    findById: jest.fn(),
  };

  const mockSubscription = {
    _id: 'sub_123',
    plan: 'learner_free',
    status: 'active',
    aiCreditsIncluded: 50,
    usage: {
      aiCreditsConsumedThisPeriod: 10,
      aiCreditsReservedThisPeriod: 5,
    },
    save: jest.fn(),
  };

  const mockSubscriptionModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  };

  const mockCompanyModel = {
    findOne: jest.fn(),
  };

  const mockUsageLedgerModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockReservationModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const testUser: JwtUser = {
    sub: '60d5ecb8b3b72c001f8e4a9a',
    email: 'learner@smartroadmap.dev',
    role: 'learner',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiUsageService,
        { provide: getModelToken(Subscription.name), useValue: mockSubscriptionModel },
        { provide: getModelToken(Company.name), useValue: mockCompanyModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(AiUsageLedger.name), useValue: mockUsageLedgerModel },
        { provide: getModelToken(AiReservation.name), useValue: mockReservationModel },
      ],
    }).compile();

    service = module.get<AiUsageService>(AiUsageService);
  });

  describe('Quota Status Evaluation', () => {
    it('should calculate four-metric quota status correctly (allocated: 50, consumed: 10, reserved: 5, remaining: 35)', async () => {
      mockSubscriptionModel.findOne.mockResolvedValue(mockSubscription);

      const status = await service.getQuotaStatus(testUser);

      expect(status.allocatedCredits).toBe(50);
      expect(status.consumedCredits).toBe(10);
      expect(status.reservedCredits).toBe(5);
      expect(status.remainingCredits).toBe(35);
      expect(status.usagePercentage).toBe(30);
      expect(status.thresholdState).toBe('normal');
    });

    it('should set thresholdState to warning_75 when usage reaches 75%', async () => {
      mockSubscriptionModel.findOne.mockResolvedValue({
        ...mockSubscription,
        usage: { aiCreditsConsumedThisPeriod: 38, aiCreditsReservedThisPeriod: 0 },
      });

      const status = await service.getQuotaStatus(testUser);
      expect(status.thresholdState).toBe('warning_75');
    });
  });

  describe('Reserve → Finalize → Release Lifecycle', () => {
    it('should reserve credits atomically when available balance >= cost', async () => {
      mockSubscriptionModel.findOne.mockResolvedValue(mockSubscription);
      mockSubscriptionModel.findOneAndUpdate.mockResolvedValue({ ...mockSubscription });
      mockReservationModel.create.mockResolvedValue({ reservationId: 'res_abc' });

      const res = await service.reserve(testUser, 'AI_ROADMAP');

      expect(res.reservedCredits).toBe(15);
      expect(res.reservationId).toContain('res_');
      expect(mockSubscriptionModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should throw HTTP 402 Payment Required when required credits exceed remaining capacity', async () => {
      mockSubscriptionModel.findOne.mockResolvedValue(mockSubscription);
      mockSubscriptionModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.reserve(testUser, 'AI_ROADMAP')).rejects.toThrow(HttpException);
    });

    it('should finalize reservation on successful AI response and convert reserved to consumed credits', async () => {
      const mockResRecord = {
        reservationId: 'res_123',
        requestId: 'req_123',
        userId: 'user_999',
        featureKey: 'AI_ROADMAP',
        reservedCredits: 15,
        status: 'RESERVED',
        save: jest.fn(),
      };

      mockReservationModel.findOne.mockResolvedValue(mockResRecord);
      mockSubscriptionModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
      mockSubscriptionModel.findOne.mockResolvedValue(mockSubscription);
      mockUsageLedgerModel.create.mockResolvedValue({ _id: 'ledger_1' });

      await service.finalize('res_123', {
        provider: 'gemini',
        model: 'text-embedding-004',
        inputTokens: 500,
        outputTokens: 250,
        totalTokens: 750,
        status: 'success',
      });

      expect(mockSubscriptionModel.updateOne).toHaveBeenCalledWith(
        { userId: mockResRecord.userId },
        { $inc: { 'usage.aiCreditsReservedThisPeriod': -15, 'usage.aiCreditsConsumedThisPeriod': 15 } },
      );
      expect(mockResRecord.status).toBe('FINALIZED');
    });

    it('should release reservation on AI execution failure without charging consumed credits', async () => {
      const mockResRecord = {
        reservationId: 'res_456',
        userId: 'user_999',
        reservedCredits: 15,
        status: 'RESERVED',
        save: jest.fn(),
      };

      mockReservationModel.findOne.mockResolvedValue(mockResRecord);
      mockSubscriptionModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.release('res_456', 'Provider Timeout');

      expect(mockSubscriptionModel.updateOne).toHaveBeenCalledWith(
        { userId: mockResRecord.userId },
        { $inc: { 'usage.aiCreditsReservedThisPeriod': -15 } },
      );
      expect(mockResRecord.status).toBe('RELEASED');
    });
  });
});
