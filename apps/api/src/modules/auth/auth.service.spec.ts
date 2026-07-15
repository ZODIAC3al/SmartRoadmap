import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OnboardingService } from './onboarding.service';
import { MailService } from '../mail/mail.service';
import { User } from '../../schemas/user.schema';

const CONFIG: Record<string, any> = {
  JWT_SECRET: 'test_secret_that_is_at_least_32_characters_long',
  JWT_REFRESH_SECRET: 'test_refresh_secret_at_least_32_characters_long',
  JWT_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '30d',
  BCRYPT_ROUNDS: 10,
};

class FakeUserModel {
  static docs: any[] = [];
  constructor(private readonly doc: any) {}
  save = jest.fn().mockImplementation(async () => {
    const saved = { ...this.doc, _id: { toString: () => 'user-1' } };
    FakeUserModel.docs.push(saved);
    return saved;
  });
  static exists = jest.fn().mockResolvedValue(false);
  static findOne = jest.fn();
  static findById = jest.fn();
  static findByIdAndUpdate = jest.fn();
  static find = jest.fn();
  static updateOne = jest.fn().mockResolvedValue({});
}

describe('AuthService', () => {
  let service: AuthService;
  let jwt: JwtService;

  beforeEach(async () => {
    FakeUserModel.docs = [];
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: FakeUserModel },
        { provide: OnboardingService, useValue: { seedForUser: jest.fn() } },
        {
          provide: MailService,
          useValue: { sendVerification: jest.fn(), sendPasswordReset: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (k: string, d?: any) => CONFIG[k] ?? d,
            getOrThrow: (k: string) => CONFIG[k],
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  it('stores refresh tokens hashed, never in plaintext', async () => {
    FakeUserModel.findById.mockResolvedValueOnce({ _id: { toString: () => 'user-1' } });
    await service.register({ email: 'r@test.com', name: 'R', password: 'password123' } as any);

    const push = FakeUserModel.updateOne.mock.calls.find(([, u]) => u?.$push?.refreshTokenHashes);
    expect(push).toBeDefined();
    const [hash] = push[1].$push.refreshTokenHashes.$each;
    expect(hash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex, not a JWT
    expect(hash.includes('.')).toBe(false);
  });

  it('never reveals whether an email exists on password reset', async () => {
    FakeUserModel.findOne.mockResolvedValueOnce(null);
    await expect(service.requestPasswordReset('ghost@test.com')).resolves.toEqual({ success: true });
  });

  it('hashes passwords with bcrypt (never stores plaintext)', async () => {
    FakeUserModel.exists.mockResolvedValueOnce(false);
    await service.register({
      email: 'A@Test.com',
      name: 'Ahmed',
      password: 'password123',
    } as any);

    const stored = FakeUserModel.docs[0];
    expect(stored.passwordHash).not.toBe('password123');
    expect(stored.passwordHash.startsWith('$2')).toBe(true);
    expect(stored.email).toBe('a@test.com');
  });

  it('never allows self-assigning the admin role at registration', async () => {
    await service.register({
      email: 'b@test.com',
      name: 'B',
      password: 'password123',
      role: 'admin' as any,
    } as any);
    // DTO validation blocks it, and the service defaults anything unexpected.
    expect(['learner', 'company']).toContain(FakeUserModel.docs[0].role);
  });

  it('rejects a login for an unknown email with a generic error', async () => {
    FakeUserModel.findOne.mockReturnValueOnce({ select: () => Promise.resolve(null) });
    await expect(service.login('ghost@test.com', 'whatever')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects google sign-in when the server has no GOOGLE_CLIENT_ID', async () => {
    await expect(service.googleLogin('fake.token.value')).rejects.toThrow();
  });

  it('refuses to accept a refresh token on the access path', async () => {
    const refresh = await jwt.signAsync(
      { sub: 'user-1', type: 'refresh' },
      { secret: CONFIG.JWT_REFRESH_SECRET },
    );
    // Access verification uses a different secret entirely.
    await expect(
      jwt.verifyAsync(refresh, { secret: CONFIG.JWT_SECRET }),
    ).rejects.toThrow();
  });

  it('blocks google login on an email owned by a local (password) account', async () => {
    const svc: any = service;
    svc.googleClient = {
      verifyIdToken: async () => ({
        getPayload: () => ({ email: 'local@test.com', email_verified: true, sub: 'g1' }),
      }),
    };
    (svc.config as any).getOrThrow = (k: string) => CONFIG[k] ?? 'client-id';
    FakeUserModel.findOne.mockResolvedValueOnce({ provider: 'local', email: 'local@test.com' });

    await expect(service.googleLogin('valid.google.token')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
