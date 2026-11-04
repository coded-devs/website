import { z } from 'zod';

const codePointLength = (value: string) => Array.from(value).length;
const boundedTrimmedText = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) => {
        const length = codePointLength(value);
        return (
          length >= minimum && length <= maximum && !value.includes('\u0000')
        );
      },
      { message: `Must contain between ${minimum} and ${maximum} characters.` },
    );

export const inquiryStatusSchema = z.enum([
  'new',
  'in_progress',
  'resolved',
  'closed',
]);

const companySchema = z
  .string()
  .trim()
  .max(200)
  .refine((value) => !value.includes('\u0000'))
  .transform((value) => value || undefined);

export const inquiryInputSchema = z
  .object({
    name: boundedTrimmedText(2, 200),
    email: z.string().trim().toLowerCase().email().max(320),
    company: companySchema.optional(),
    message: boundedTrimmedText(20, 5_000),
  })
  .strict()
  .transform(({ company, ...input }) =>
    company === undefined ? input : { ...input, company },
  );

export const inquiryAdminQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: inquiryStatusSchema.optional(),
    search: z.string().trim().max(200).optional(),
  })
  .strict();

export const inquiryIdSchema = z.string().uuid();
export const inquiryStatusUpdateSchema = z
  .object({ status: inquiryStatusSchema })
  .strict();

export const INQUIRY_JSON_BODY_LIMIT_BYTES = 16 * 1024;
export const INQUIRY_IP_RATE_LIMIT = {
  attempts: 60,
  windowSeconds: 900,
} as const;
export const INQUIRY_EMAIL_RATE_LIMIT = {
  attempts: 3,
  windowSeconds: 3_600,
} as const;

export const inquiryStatusTransitions = {
  new: ['in_progress', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: ['in_progress', 'closed'],
  closed: [],
} as const satisfies Record<
  z.infer<typeof inquiryStatusSchema>,
  readonly z.infer<typeof inquiryStatusSchema>[]
>;

export type InquiryErrorKind =
  | 'invalid'
  | 'not_found'
  | 'invalid_transition'
  | 'rate_limited'
  | 'unavailable';

const inquiryErrorMap = {
  invalid: {
    status: 400,
    body: { error: 'Invalid inquiry request', code: 'INQUIRY_INVALID_REQUEST' },
  },
  not_found: {
    status: 404,
    body: { error: 'Inquiry not found', code: 'INQUIRY_NOT_FOUND' },
  },
  invalid_transition: {
    status: 409,
    body: {
      error: 'Invalid inquiry status transition',
      code: 'INQUIRY_INVALID_TRANSITION',
    },
  },
  rate_limited: {
    status: 429,
    body: {
      error: 'Too many inquiry submissions',
      code: 'INQUIRY_RATE_LIMITED',
    },
  },
  unavailable: {
    status: 503,
    body: { error: 'Service unavailable', code: 'INQUIRY_UNAVAILABLE' },
  },
} as const;

export function inquiryErrorResponse(kind: InquiryErrorKind) {
  return inquiryErrorMap[kind];
}

type InquiryRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: z.infer<typeof inquiryStatusSchema>;
  statusUpdatedByAdminUserId?: string | null;
  statusUpdatedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const iso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export function serializePublicInquirySuccess() {
  return { received: true as const };
}

export function serializeInquiryListItem(row: InquiryRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    status: row.status,
    statusUpdatedByAdminUserId: row.statusUpdatedByAdminUserId ?? null,
    statusUpdatedAt: row.statusUpdatedAt ? iso(row.statusUpdatedAt) : null,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function serializeInquiryDetail(row: InquiryRow) {
  return { ...serializeInquiryListItem(row), message: row.message };
}
