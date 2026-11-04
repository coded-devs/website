import { z } from 'zod';

const LOCAL_ADMIN_ORIGIN = 'http://localhost:3001';

const adminOriginSchema = z.string().transform((value, context) => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    context.addIssue({
      code: 'custom',
      message: 'Must be a valid URL origin.',
    });
    return z.NEVER;
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username !== '' ||
    url.password !== '' ||
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Must be an exact HTTP or HTTPS origin.',
    });
    return z.NEVER;
  }

  return url.origin;
});

const webInternalOriginSchema = adminOriginSchema;

const r2PublicBaseSchema = z.string().transform((value, context) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    context.addIssue({ code: 'custom', message: 'Must be a valid media URL.' });
    return z.NEVER;
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Must be a safe HTTP or HTTPS media URL.',
    });
    return z.NEVER;
  }
  return `${url.origin}${url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '')}`;
});

const proxyHopCountSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)$/)
  .transform(Number)
  .pipe(z.number().int().min(0).max(10));

const apiEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    ADMIN_ORIGIN: adminOriginSchema.optional(),
    WEB_INTERNAL_ORIGIN: webInternalOriginSchema.optional(),
    CONTENT_REVALIDATION_SECRET: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/, 'Must be 32 bytes encoded as hexadecimal.')
      .optional(),
    R2_ACCOUNT_ID: z
      .string()
      .regex(/^[0-9a-fA-F]{32}$/)
      .optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).max(256).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).max(256).optional(),
    R2_BUCKET: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/)
      .optional(),
    R2_PUBLIC_BASE_URL: r2PublicBaseSchema.optional(),
    API_TRUST_PROXY_HOPS: proxyHopCountSchema.optional(),
    AUTH_THROTTLE_HMAC_SECRET: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/, 'Must be 32 bytes encoded as hexadecimal.')
      .optional(),
  })
  .passthrough()
  .superRefine((environment, context) => {
    const r2Names = [
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET',
      'R2_PUBLIC_BASE_URL',
    ] as const;
    if (
      environment.NODE_ENV === 'production' ||
      r2Names.some((name) => environment[name] !== undefined)
    ) {
      for (const name of r2Names) {
        if (environment[name] === undefined) {
          context.addIssue({
            code: 'custom',
            path: [name],
            message: `${name} is required for media storage.`,
          });
        }
      }
      if (
        environment.NODE_ENV === 'production' &&
        environment.R2_PUBLIC_BASE_URL?.startsWith('http:')
      ) {
        context.addIssue({
          code: 'custom',
          path: ['R2_PUBLIC_BASE_URL'],
          message: 'R2_PUBLIC_BASE_URL must use HTTPS in production.',
        });
      }
    }
    if (environment.NODE_ENV !== 'production') return;

    if (!environment.AUTH_THROTTLE_HMAC_SECRET) {
      context.addIssue({
        code: 'custom',
        path: ['AUTH_THROTTLE_HMAC_SECRET'],
        message: 'AUTH_THROTTLE_HMAC_SECRET is required in production.',
      });
    }

    if (!environment.ADMIN_ORIGIN) {
      context.addIssue({
        code: 'custom',
        path: ['ADMIN_ORIGIN'],
        message: 'ADMIN_ORIGIN is required in production.',
      });
    } else if (new URL(environment.ADMIN_ORIGIN).protocol !== 'https:') {
      context.addIssue({
        code: 'custom',
        path: ['ADMIN_ORIGIN'],
        message: 'ADMIN_ORIGIN must use HTTPS in production.',
      });
    }

    if (!environment.WEB_INTERNAL_ORIGIN) {
      context.addIssue({
        code: 'custom',
        path: ['WEB_INTERNAL_ORIGIN'],
        message: 'WEB_INTERNAL_ORIGIN is required in production.',
      });
    } else if (new URL(environment.WEB_INTERNAL_ORIGIN).protocol !== 'https:') {
      context.addIssue({
        code: 'custom',
        path: ['WEB_INTERNAL_ORIGIN'],
        message: 'WEB_INTERNAL_ORIGIN must use HTTPS in production.',
      });
    }

    if (!environment.CONTENT_REVALIDATION_SECRET) {
      context.addIssue({
        code: 'custom',
        path: ['CONTENT_REVALIDATION_SECRET'],
        message: 'CONTENT_REVALIDATION_SECRET is required in production.',
      });
    }

    if (
      environment.API_TRUST_PROXY_HOPS === undefined ||
      environment.API_TRUST_PROXY_HOPS === 0
    ) {
      context.addIssue({
        code: 'custom',
        path: ['API_TRUST_PROXY_HOPS'],
        message: 'A positive proxy hop count is required in production.',
      });
    }
  });

export function parseApiEnvironment(
  environment: Record<string, string | undefined>,
) {
  const parsed = apiEnvironmentSchema.parse(environment);
  const proxyHops = parsed.API_TRUST_PROXY_HOPS ?? 0;
  const r2 =
    parsed.R2_ACCOUNT_ID &&
    parsed.R2_ACCESS_KEY_ID &&
    parsed.R2_SECRET_ACCESS_KEY &&
    parsed.R2_BUCKET &&
    parsed.R2_PUBLIC_BASE_URL
      ? {
          accountId: parsed.R2_ACCOUNT_ID,
          accessKeyId: parsed.R2_ACCESS_KEY_ID,
          secretAccessKey: parsed.R2_SECRET_ACCESS_KEY,
          bucket: parsed.R2_BUCKET,
          publicBaseUrl: parsed.R2_PUBLIC_BASE_URL,
        }
      : undefined;

  return {
    nodeEnvironment: parsed.NODE_ENV,
    adminOrigin: parsed.ADMIN_ORIGIN ?? LOCAL_ADMIN_ORIGIN,
    trustProxy: proxyHops === 0 ? (false as const) : proxyHops,
    ...(parsed.AUTH_THROTTLE_HMAC_SECRET
      ? { throttleHmacSecret: parsed.AUTH_THROTTLE_HMAC_SECRET }
      : {}),
    ...(parsed.WEB_INTERNAL_ORIGIN
      ? { webInternalOrigin: parsed.WEB_INTERNAL_ORIGIN }
      : {}),
    ...(parsed.CONTENT_REVALIDATION_SECRET
      ? { contentRevalidationSecret: parsed.CONTENT_REVALIDATION_SECRET }
      : {}),
    ...(r2 ? { r2PublicBaseUrl: r2.publicBaseUrl, r2 } : {}),
  };
}

export type ApiEnvironment = ReturnType<typeof parseApiEnvironment>;

export function parseApiRuntimeConfiguration(
  input: Record<string, string | undefined>,
) {
  const environment = parseApiEnvironment(input);
  const portText = input.PORT ?? '4000';
  const port = Number(portText);
  if (
    (!/^[1-9]\d{0,4}$/.test(portText) &&
      !(environment.nodeEnvironment === 'test' && portText === '0')) ||
    port > 65_535
  ) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const databaseUrl = input.DATABASE_URL;
  if (!databaseUrl && environment.nodeEnvironment === 'production') {
    throw new Error('DATABASE_URL is required in production.');
  }
  if (databaseUrl) {
    let parsed: URL;
    try {
      parsed = new URL(databaseUrl);
    } catch {
      throw new Error('DATABASE_URL must be a PostgreSQL database URL.');
    }
    if (
      !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
      !parsed.hostname ||
      parsed.pathname.length <= 1 ||
      parsed.hash
    ) {
      throw new Error('DATABASE_URL must be a PostgreSQL database URL.');
    }
  }

  return { port, databaseUrl, environment };
}
