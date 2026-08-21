import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

/**
 * AES-256-GCM envelope encryption for OAuth access tokens.
 *
 * OAuth access tokens are secret and must be *recoverable* (we call the
 * provider's API on the user's behalf), so we cannot hash them like passwords.
 * Instead we encrypt them at rest with a 256-bit key derived from
 * TOKEN_ENCRYPTION_SECRET (falling back to JWT_SECRET) and never log them.
 */
const ALGORITHM = 'aes-256-gcm';

export class TokenCipher {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const secret =
      config.get<string>('TOKEN_ENCRYPTION_SECRET') ??
      config.getOrThrow<string>('JWT_SECRET');
    this.key = Buffer.from(secret, 'utf8').subarray(0, 32);
    if (this.key.length < 32) {
      // Pad short secrets up to 32 bytes so createCipheriv never throws.
      this.key = Buffer.concat([
        this.key,
        Buffer.alloc(32 - this.key.length, 0),
      ]);
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    // Format: base64(iv).base64(tag).base64(ciphertext)
    return [
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join('.');
  }

  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    if (!ivB64 || !tagB64 || !dataB64)
      throw new Error('Malformed encrypted token');
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}
