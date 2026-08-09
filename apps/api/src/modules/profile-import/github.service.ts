import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import axios from 'axios';
import {
  GitHubAccount,
  GitHubAccountSchema,
} from '../../schemas/github-account.schema';
import { Project, ProjectSchema } from '../../schemas/project.schema';
import { TokenCipher } from '../../common/security/token-cipher';
import { GitHubRepoItemDto } from './dto/profile-import.dto';

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token';
const GITHUB_API = 'https://api.github.com';

export interface GitHubUserResponse {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string;
  bio?: string | null;
  location?: string | null;
  blog?: string | null;
  email?: string | null;
  followers?: number;
  following?: number;
}

export interface GitHubRepoResponse {
  id: number;
  name: string;
  description?: string | null;
  html_url?: string;
  homepage?: string | null;
  language?: string | null;
  topics?: string[];
  stargazers_count?: number;
  forks_count?: number;
  updated_at?: string;
  languages?: Record<string, number>;
  readmeSnippet?: string;
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly tokenCipher: TokenCipher;

  constructor(
    @InjectModel(GitHubAccount.name)
    private readonly githubAccountModel: Model<GitHubAccount>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.tokenCipher = new TokenCipher(config);
  }

  /** GitHub OAuth is only usable when client credentials are configured. */
  isConfigured(): boolean {
    if (
      this.config.get<boolean>('MOCK_MODE') ||
      process.env.MOCK_MODE === 'true'
    ) {
      return true;
    }
    return Boolean(
      this.config.get<string>('GITHUB_CLIENT_ID') &&
      this.config.get<string>('GITHUB_CLIENT_SECRET'),
    );
  }

  private get apiUrl(): string {
    return this.config.get<string>('API_URL') ?? 'http://localhost:3000';
  }

  private get redirectUri(): string {
    return `${this.apiUrl}/profile/github/callback`;
  }

  /** Builds the GitHub authorize URL. `state` is a signed JWT carrying the userId. */
  async buildAuthUrl(userId: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'GitHub integration is not configured on this server.',
      );
    }
    const state = await this.jwt.signAsync(
      { sub: userId, type: 'github_oauth' },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '10m',
      },
    );
    if (
      this.config.get<boolean>('MOCK_MODE') ||
      process.env.MOCK_MODE === 'true' ||
      !this.config.get<string>('GITHUB_CLIENT_ID')
    ) {
      return `${this.apiUrl}/profile/github/callback?code=mock-code&state=${state}`;
    }
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('GITHUB_CLIENT_ID'),
      redirect_uri: this.redirectUri,
      scope: 'read:user',
      state,
    });
    return `${GITHUB_AUTHORIZE}?${params.toString()}`;
  }

  /** Verifies the OAuth `state` and returns the originating userId. */
  private async verifyState(state: string): Promise<string> {
    try {
      const payload: any = await this.jwt.verifyAsync(state, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      if (payload?.type !== 'github_oauth' || !payload?.sub) {
        throw new Error('invalid state');
      }
      return payload.sub as string;
    } catch {
      throw new BadRequestException('Invalid or expired GitHub OAuth state.');
    }
  }

  /** Exchanges the code, fetches the profile and persists the connection. */
  async handleCallback(code: string, state: string): Promise<GitHubAccount> {
    const userId = await this.verifyState(state);

    if (
      code === 'mock-code' ||
      this.config.get<boolean>('MOCK_MODE') ||
      process.env.MOCK_MODE === 'true' ||
      !this.config.get<string>('GITHUB_CLIENT_ID')
    ) {
      const mockProfile: GitHubUserResponse = {
        id: 12345678,
        login: 'mockuser',
        name: 'Mock Developer',
        avatar_url:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        bio: 'Passionate full-stack developer working on AI projects.',
        location: 'Cairo, Egypt',
        blog: 'https://mockuser.dev',
        email: 'mockuser@example.com',
        followers: 124,
        following: 58,
      };

      const encrypted = this.tokenCipher.encrypt('mock-access-token');
      const account = await this.githubAccountModel.findOneAndUpdate(
        { userId },
        {
          userId,
          githubId: String(mockProfile.id),
          username: mockProfile.login,
          fullName: mockProfile.name ?? undefined,
          avatar: mockProfile.avatar_url ?? undefined,
          bio: mockProfile.bio ?? undefined,
          location: mockProfile.location ?? undefined,
          website: mockProfile.blog || undefined,
          email: mockProfile.email ?? undefined,
          followers: mockProfile.followers ?? 0,
          following: mockProfile.following ?? 0,
          accessToken: encrypted,
          scope: 'read:user',
          connectedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      this.logger.log(
        `GitHub mock account connected for user ${userId} (${mockProfile.login})`,
      );
      return account;
    }

    let tokenRes;
    try {
      tokenRes = await axios.post(
        GITHUB_TOKEN,
        {
          client_id: this.config.getOrThrow<string>('GITHUB_CLIENT_ID'),
          client_secret: this.config.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
          code,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        },
        { headers: { Accept: 'application/json' } },
      );
    } catch (err: any) {
      this.logger.error(`GitHub token exchange failed: ${err.message}`);
      throw new BadRequestException(
        'GitHub authorization failed. Please try connecting again.',
      );
    }

    const accessToken: string | undefined = tokenRes.data?.access_token;
    if (!accessToken) {
      throw new BadRequestException('GitHub did not return an access token.');
    }

    const profile = await this.fetchGitHubUser(accessToken);

    const encrypted = this.tokenCipher.encrypt(accessToken);
    const account = await this.githubAccountModel.findOneAndUpdate(
      { userId },
      {
        userId,
        githubId: String(profile.id),
        username: profile.login,
        fullName: profile.name ?? undefined,
        avatar: profile.avatar_url ?? undefined,
        bio: profile.bio ?? undefined,
        location: profile.location ?? undefined,
        website: profile.blog || undefined,
        email: profile.email ?? undefined,
        followers: profile.followers ?? 0,
        following: profile.following ?? 0,
        accessToken: encrypted,
        scope: tokenRes.data?.scope,
        connectedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    this.logger.log(
      `GitHub account connected for user ${userId} (${profile.login})`,
    );
    return account;
  }

  private async fetchGitHubUser(
    accessToken: string,
  ): Promise<GitHubUserResponse> {
    try {
      const res = await axios.get<GitHubUserResponse>(`${GITHUB_API}/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'SmartRoadmap',
        },
      });
      return res.data;
    } catch (err: any) {
      throw new BadRequestException(
        'Could not fetch GitHub profile. The token may be invalid.',
      );
    }
  }

  /** Returns the stored connection (token intentionally excluded). */
  async getAccount(userId: string): Promise<GitHubAccount | null> {
    return this.githubAccountModel
      .findOne({ userId })
      .lean()
      .exec() as Promise<GitHubAccount | null>;
  }

  async disconnect(userId: string): Promise<void> {
    await this.githubAccountModel.deleteOne({ userId }).exec();
  }

  /** Fetches the user's repositories live from GitHub using the stored token. */
  async getRepositories(userId: string): Promise<GitHubRepoResponse[]> {
    const account = await this.githubAccountModel
      .findOne({ userId })
      .select('+accessToken')
      .lean()
      .exec();
    if (!account)
      throw new NotFoundException('GitHub account is not connected.');

    let token: string;
    try {
      token = this.tokenCipher.decrypt((account as any).accessToken);
    } catch {
      throw new UnauthorizedException(
        'GitHub token is corrupted. Please reconnect your account.',
      );
    }

    if (
      token === 'mock-access-token' ||
      this.config.get<boolean>('MOCK_MODE') ||
      process.env.MOCK_MODE === 'true'
    ) {
      return [
        {
          id: 101,
          name: 'smart-roadmap-generator',
          description:
            'AI-powered learning path generator for tech career progression.',
          html_url: 'https://github.com/mockuser/smart-roadmap-generator',
          homepage: 'https://smartroadmap.io',
          language: 'TypeScript',
          topics: ['nextjs', 'nest-js', 'mongodb', 'openai-api'],
          stargazers_count: 85,
          forks_count: 14,
          updated_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        },
        {
          id: 102,
          name: 'resumizer-ats-analyzer',
          description:
            'A tool to optimize resumes against applicant tracking systems.',
          html_url: 'https://github.com/mockuser/resumizer-ats-analyzer',
          homepage: 'https://resumizer.com',
          language: 'Python',
          topics: ['nlp', 'spacy', 'resume-parser', 'fastapi'],
          stargazers_count: 142,
          forks_count: 32,
          updated_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
        },
        {
          id: 103,
          name: 'portfolio-builder-react',
          description:
            'Modern, highly customisable portfolio builder for web developers.',
          html_url: 'https://github.com/mockuser/portfolio-builder-react',
          homepage: undefined,
          language: 'CSS',
          topics: ['react', 'tailwind-css', 'daisyui', 'responsive-design'],
          stargazers_count: 24,
          forks_count: 2,
          updated_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
        },
      ];
    }

    try {
      const res = await axios.get<GitHubRepoResponse[]>(
        `${GITHUB_API}/user/repos`,
        {
          params: { per_page: 100, sort: 'updated', affiliation: 'owner' },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'SmartRoadmap',
          },
        },
      );
      return res.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        throw new UnauthorizedException(
          'GitHub access token expired. Please reconnect your account.',
        );
      }
      if (
        status === 403 &&
        err?.response?.headers?.['x-ratelimit-remaining'] === '0'
      ) {
        throw new HttpException(
          'GitHub API rate limit reached. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      this.logger.error(`GitHub repos fetch failed: ${err.message}`);
      throw new BadRequestException(
        'Failed to fetch repositories from GitHub. Please try again.',
      );
    }
  }

  /**
   * Imports the selected repositories as portfolio projects.
   * Re-importing the same repository is idempotent (skipped, not duplicated).
   */
  async importRepositories(
    userId: string,
    items: GitHubRepoItemDto[],
  ): Promise<{ imported: Project[]; skipped: number }> {
    const imported: Project[] = [];
    let skipped = 0;

    for (const item of items) {
      const exists = await this.projectModel.exists({
        userId,
        githubRepoId: item.repoId,
      });
      if (exists) {
        skipped += 1;
        continue;
      }
      const project = await this.projectModel.create({
        userId,
        source: 'github',
        githubRepoId: item.repoId,
        githubUrl: item.url,
        name: item.name,
        description: item.description,
        demoLink: item.homepage || undefined,
        technologies: this.technologiesFor(item),
        readmeSnippet: item.readmeSnippet || undefined,
        languages: item.languages || (item.language ? { [item.language]: 1 } : {}),
        stars: item.stars ?? 0,
        forks: item.forks ?? 0,
        lastUpdated: item.updatedAt ? new Date(item.updatedAt) : undefined,
        importedAt: new Date(),
      });
      imported.push(project);
    }

    return { imported, skipped };
  }

  /**
   * Refreshes stored profile information, language breakdown, and total stars from GitHub.
   */
  async refreshAccount(userId: string): Promise<GitHubAccount> {
    const account = await this.githubAccountModel
      .findOne({ userId })
      .select('+accessToken')
      .exec();
    if (!account)
      throw new NotFoundException('GitHub account is not connected.');

    let token: string;
    try {
      token = this.tokenCipher.decrypt((account as any).accessToken);
    } catch {
      throw new UnauthorizedException(
        'GitHub token is corrupted. Please reconnect your account.',
      );
    }

    if (
      token === 'mock-access-token' ||
      this.config.get<boolean>('MOCK_MODE') ||
      process.env.MOCK_MODE === 'true'
    ) {
      const languagesSummary: Record<string, number> = {
        TypeScript: 145000,
        JavaScript: 98000,
        Python: 64000,
        HTML: 25000,
        CSS: 21000,
      };
      account.languagesSummary = languagesSummary;
      account.totalStars = 251;
      account.lastSyncedAt = new Date();
      return await account.save();
    }

    try {
      const profile = await this.fetchGitHubUser(token);
      const repos = await this.getRepositories(userId);

      const languagesSummary: Record<string, number> = {};
      let totalStars = 0;

      for (const repo of repos) {
        totalStars += repo.stargazers_count ?? 0;
        if (repo.language) {
          languagesSummary[repo.language] =
            (languagesSummary[repo.language] ?? 0) + 1;
        }
      }

      account.username = profile.login;
      account.fullName = profile.name ?? account.fullName;
      account.avatar = profile.avatar_url ?? account.avatar;
      account.bio = profile.bio ?? account.bio;
      account.location = profile.location ?? account.location;
      account.website = profile.blog || account.website;
      account.email = profile.email ?? account.email;
      account.followers = profile.followers ?? account.followers;
      account.following = profile.following ?? account.following;
      account.languagesSummary = languagesSummary;
      account.totalStars = totalStars;
      account.lastSyncedAt = new Date();

      return await account.save();
    } catch (err: any) {
      this.logger.error(`GitHub account refresh failed: ${err.message}`);
      throw new BadRequestException('Failed to refresh GitHub data.');
    }
  }

  /** Derives a technology list from the repo language + topics. */
  private technologiesFor(item: GitHubRepoItemDto): string[] {
    const tech = new Set<string>();
    if (item.language) tech.add(item.language);
    for (const t of item.topics ?? []) tech.add(t);
    return Array.from(tech).slice(0, 30);
  }
}
