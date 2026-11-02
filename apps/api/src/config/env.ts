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
    API_TRUST_PROXY_HOPS: proxyHopCountSchema.optional(),
    AUTH_THROTTLE_HMAC_SECRET: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/, 'Must be 32 bytes encoded as hexadecimal.')
      .optional(),
  })
  .passthrough()
  .superRefine((environment, context) => {
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
  };
}

export type ApiEnvironment = ReturnType<typeof parseApiEnvironment>;
