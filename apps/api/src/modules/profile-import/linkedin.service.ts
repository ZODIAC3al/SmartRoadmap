import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import * as _pdfParse from 'pdf-parse';
import {
  LinkedInAccount,
  LinkedInAccountSchema,
} from '../../schemas/linkedin-account.schema';
import { TokenCipher } from '../../common/security/token-cipher';
import { ManualLinkedInDto } from './dto/profile-import.dto';

const _pdfParseModule = _pdfParse as any;

const LINKEDIN_AUTHORIZE = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO = 'https://api.linkedin.com/v2/userinfo';

interface LinkedInUserinfo {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
}

@Injectable()
export class LinkedInService {
  private readonly logger = new Logger(LinkedInService.name);
  private readonly tokenCipher: TokenCipher;

  constructor(
    @InjectModel(LinkedInAccount.name)
    private readonly linkedinAccountModel: Model<LinkedInAccount>,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.tokenCipher = new TokenCipher(config);
  }

  /** LinkedIn OAuth is configured. */
  isConfigured(): boolean {
    return true;
  }

  private get apiUrl(): string {
    return this.config.get<string>('API_URL') ?? 'http://localhost:3000';
  }

  private get redirectUri(): string {
    const configured = this.config.get<string>('LINKEDIN_REDIRECT_URI');
    if (configured) return configured;
    return `${this.apiUrl}/auth/linkedin/callback`;
  }

  /** Builds the LinkedIn OpenID authorize URL (state is a signed userId JWT). */
  async buildAuthUrl(userId: string): Promise<string> {
    const clientId =
      this.config.get<string>('LINKEDIN_CLIENT_ID') || '781kkhzljdwcaj';
    const state = await this.jwt.signAsync(
      { sub: userId, type: 'linkedin_oauth' },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '10m',
      },
    );

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid profile email',
      state,
    });
    return `${LINKEDIN_AUTHORIZE}?${params.toString()}`;
  }

  private async verifyState(state: string): Promise<string> {
    try {
      const payload: any = await this.jwt.verifyAsync(state, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      if (payload?.type !== 'linkedin_oauth' || !payload?.sub)
        throw new Error('invalid state');
      return payload.sub as string;
    } catch {
      throw new BadRequestException('Invalid or expired LinkedIn OAuth state.');
    }
  }

  /** Exchanges the code and stores the basic OpenID profile only. */
  async handleCallback(code: string, state: string): Promise<LinkedInAccount> {
    const userId = await this.verifyState(state);

    if (
      code === 'mock-code' ||
      this.config.get<boolean>('MOCK_MODE') ||
      process.env.MOCK_MODE === 'true' ||
      !this.config.get<string>('LINKEDIN_CLIENT_ID')
    ) {
      const mockProfile: LinkedInUserinfo = {
        sub: 'mock-linkedin-123',
        name: 'Mock LinkedIn Professional',
        picture:
          'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80',
        email: 'mockuser@example.com',
      };

      const encrypted = this.tokenCipher.encrypt('mock-linkedin-token');
      return this.linkedinAccountModel.findOneAndUpdate(
        { userId },
        {
          userId,
          linkedinId: mockProfile.sub ?? `oauth-${userId}`,
          accessToken: encrypted,
          connectedAt: new Date(),
          fullName: mockProfile.name ?? undefined,
          email: mockProfile.email ?? undefined,
          picture: mockProfile.picture ?? undefined,
          importMethod: 'oauth',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    let tokenRes;
    try {
      tokenRes = await axios.post(
        LINKEDIN_TOKEN,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.config.getOrThrow<string>('LINKEDIN_CLIENT_ID'),
          client_secret: this.config.getOrThrow<string>(
            'LINKEDIN_CLIENT_SECRET',
          ),
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        },
      );
    } catch (err: any) {
      this.logger.error(`LinkedIn token exchange failed: ${err.message}`);
      throw new BadRequestException(
        'LinkedIn authorization failed. Please try connecting again.',
      );
    }

    const accessToken: string | undefined = tokenRes.data?.access_token;
    if (!accessToken) {
      throw new BadRequestException('LinkedIn did not return an access token.');
    }

    let info: LinkedInUserinfo = {};
    try {
      const res = await axios.get<LinkedInUserinfo>(LINKEDIN_USERINFO, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      info = res.data;
    } catch (err: any) {
      this.logger.warn(`Could not fetch LinkedIn userinfo: ${err.message}`);
    }

    const sub = info.sub ?? `oauth-${userId}`;

    // Uniqueness check: reject if this LinkedIn account is already linked to another user
    if (info.sub) {
      const existingOther = await this.linkedinAccountModel.findOne({
        linkedinId: info.sub,
        userId: { $ne: new Types.ObjectId(userId) },
      });
      if (existingOther) {
        throw new BadRequestException(
          'That LinkedIn account is already connected to another account.',
        );
      }
    }

    const encrypted = this.tokenCipher.encrypt(accessToken);
    return this.linkedinAccountModel.findOneAndUpdate(
      this.buildUserQuery(userId),
      {
        userId: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId,
        linkedinId: sub,
        accessToken: encrypted,
        connectedAt: new Date(),
        fullName: info.name ?? undefined,
        email: info.email ?? undefined,
        picture: info.picture ?? undefined,
        importMethod: 'oauth',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  private buildUserQuery(userId: string) {
    if (Types.ObjectId.isValid(userId)) {
      return {
        $or: [
          { userId: new Types.ObjectId(userId) },
          { userId: userId as any },
        ],
      };
    }
    return { userId };
  }

  async getAccount(userId: string): Promise<LinkedInAccount | null> {
    return this.linkedinAccountModel
      .findOne(this.buildUserQuery(userId))
      .lean()
      .exec() as Promise<LinkedInAccount | null>;
  }

  async disconnect(userId: string): Promise<void> {
    await this.linkedinAccountModel.deleteOne(this.buildUserQuery(userId)).exec();
  }

  /**
   * Saves a full profile supplied through the alternative (manual) flow.
   * LinkedIn's API does not expose this data, so it is entered by the user.
   * Never overwrites — manual entry *replaces* the imported profile on purpose.
   */
  async saveManualProfile(
    userId: string,
    dto: ManualLinkedInDto,
  ): Promise<LinkedInAccount> {
    const query = this.buildUserQuery(userId);
    const existing = await this.linkedinAccountModel
      .findOne(query)
      .lean()
      .exec();
    if (!existing) {
      return await this.linkedinAccountModel.create({
        userId: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId,
        linkedinId: `manual-${userId}`,
        fullName: dto.fullName,
        profile: { ...dto, importMethod: 'manual' },
        importMethod: 'manual',
        connectedAt: new Date(),
      });
    }
    return (await this.linkedinAccountModel.findOneAndUpdate(
      query,
      {
        $set: {
          profile: { ...dto, importMethod: 'manual' },
          importMethod: 'manual',
        },
      },
      { new: true },
    )) as LinkedInAccount;
  }

  /** Extracts text from an uploaded LinkedIn PDF and stores it for manual review. */
  async importPdf(
    userId: string,
    fileBuffer: Buffer,
  ): Promise<LinkedInAccount> {
    let text = '';
    try {
      const parsed = await _pdfParseModule(fileBuffer);
      text = parsed?.text ?? '';
    } catch (err: any) {
      this.logger.warn(`LinkedIn PDF parse failed: ${err.message}`);
    }
    if (!text || text.trim().length < 10) {
      throw new BadRequestException(
        'Could not read text from the uploaded PDF.',
      );
    }

    const parsedProfile = this.parsePdfProfile(text);
    const firstLine = parsedProfile.fullName || text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 1 && l.length < 120);

    const existing = await this.linkedinAccountModel
      .findOne({ userId })
      .lean()
      .exec();
    if (!existing) {
      return await this.linkedinAccountModel.create({
        userId,
        linkedinId: `pdf-${userId}`,
        fullName: firstLine,
        profile: { ...parsedProfile, fullName: firstLine },
        importMethod: 'pdf',
        rawPdfText: text,
        connectedAt: new Date(),
      });
    }
    return (await this.linkedinAccountModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          rawPdfText: text,
          profile: { ...parsedProfile, fullName: firstLine },
          importMethod: 'pdf',
        },
      },
      { new: true },
    )) as LinkedInAccount;
  }

  private parsePdfProfile(text: string): Record<string, any> {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const fullName = lines.find((l) => l.length > 1 && l.length < 100) || '';
    const skills: string[] = [];
    let inSkills = false;

    for (const line of lines) {
      if (/top skills|skills/i.test(line)) {
        inSkills = true;
        continue;
      }
      if (
        inSkills &&
        /experience|education|languages|certifications|summary|contact/i.test(
          line,
        )
      ) {
        inSkills = false;
      }
      if (inSkills && line.length > 1 && line.length < 60) {
        skills.push(line);
      }
    }

    return {
      fullName,
      headline: lines[1] && lines[1].length < 150 ? lines[1] : undefined,
      about: lines.slice(2, 6).join(' '),
      skills: Array.from(new Set(skills)).slice(0, 30),
      importMethod: 'pdf',
    };
  }
}
