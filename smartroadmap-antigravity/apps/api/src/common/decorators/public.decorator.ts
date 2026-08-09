import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Opt an endpoint OUT of the global JwtAuthGuard. Use sparingly. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
