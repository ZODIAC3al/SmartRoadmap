import { z } from 'zod';

/**
 * Fail-fast environment validation.
 * The app must NEVER boot in production with missing secrets or silently
 * degrade into "mock mode" — mock mode is now an explicit, opt-in decision.
 */
export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().default(3000),

    // Comma separated list of allowed origins for CORS
    FRONTEND_URL: z.string().default('http://localhost:3001'),

    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    // Auth — no fallback secrets allowed, ever.
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_REFRESH_EXPIRY: z.string().default('30d'),
    BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),

    GOOGLE_CLIENT_ID: z.string().optional(),

    // Explicit mock mode (integrations run offline). Blocked in production.
    MOCK_MODE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),

    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL_SMART: z.string().default('gpt-4o'),
    OPENAI_MODEL_FAST: z.string().default('gpt-4o-mini'),
    OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),

    QDRANT_URL: z.string().optional(),
    QDRANT_API_KEY: z.string().optional(),

    PAYPAL_CLIENT_ID: z.string().optional(),
    PAYPAL_CLIENT_SECRET: z.string().optional(),
    PAYPAL_WEBHOOK_ID: z.string().optional(),
    PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),

    // Transactional email (password reset / verification)
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default('noreply@smartroadmap.io'),

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    THROTTLE_TTL: z.coerce.number().default(60000),
    // Credential endpoints (login/register/google) — keep this low in production.
    AUTH_THROTTLE_LIMIT: z.coerce.number().default(5),
    THROTTLE_LIMIT: z.coerce.number().default(100),

    MAX_UPLOAD_BYTES: z.coerce.number().default(5 * 1024 * 1024),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;

    if (env.MOCK_MODE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MOCK_MODE cannot be enabled in production.',
      });
    }
    const requiredInProd: Array<[string, unknown]> = [
      ['OPENAI_API_KEY', env.OPENAI_API_KEY],
      ['PAYPAL_CLIENT_ID', env.PAYPAL_CLIENT_ID],
      ['PAYPAL_CLIENT_SECRET', env.PAYPAL_CLIENT_SECRET],
      ['PAYPAL_WEBHOOK_ID', env.PAYPAL_WEBHOOK_ID],
      ['GOOGLE_CLIENT_ID', env.GOOGLE_CLIENT_ID],
      // Without this, password-reset emails would silently vanish in production.
      ['RESEND_API_KEY', env.RESEND_API_KEY],
    ];
    for (const [key, value] of requiredInProd) {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} is required when NODE_ENV=production.`,
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || 'env'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return parsed.data;
}
