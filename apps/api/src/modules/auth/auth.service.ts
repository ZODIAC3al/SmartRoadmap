import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;

  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {
    this.jwtSecret = process.env.JWT_SECRET || 'smartroadmap_ultra_secret_key_2026_xyz';
  }

  // Pure cryptographic PBKDF2 hashing
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, passwordHash: string): boolean {
    const parts = passwordHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  // Pure token signing in Base64Url JSON
  private generateToken(user: User): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    };

    const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${headerBase64}.${payloadBase64}`)
      .digest('base64url');

    return `${headerBase64}.${payloadBase64}.${signature}`;
  }

  // Parse and verify standard Base64Url JWT signature
  verifyToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;

      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Expired
      }
      return decodedPayload;
    } catch (e) {
      return null;
    }
  }

  async register(email: string, name: string, password: string, role: 'learner' | 'company' = 'learner'): Promise<any> {
    const existing = await this.userModel.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      throw new BadRequestException('User with this email already exists.');
    }

    const passwordHash = this.hashPassword(password);
    const user = new this.userModel({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash,
      role,
      isVerified: true,
    });

    const saved = await user.save();
    const token = this.generateToken(saved);

    return {
      token,
      user: {
        id: saved._id.toString(),
        email: saved.email,
        name: saved.name,
        role: saved.role,
      },
    };
  }

  async login(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const valid = this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async googleLogin(email: string, name: string, avatarUrl?: string): Promise<any> {
    this.logger.log(`Google auth login payload received: ${email}`);

    // If user already exists, authenticate them. Otherwise, register them dynamically.
    let user = await this.userModel.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      this.logger.log(`User does not exist, creating new social login user profile for: ${email}`);
      const mockPasswordHash = this.hashPassword(crypto.randomBytes(32).toString('hex'));
      user = new this.userModel({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash: mockPasswordHash,
        role: 'learner', // Default social signup is a learner
        avatarUrl: avatarUrl || '',
        isVerified: true,
      });
      await user.save();
    }

    const token = this.generateToken(user);
    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }
}
