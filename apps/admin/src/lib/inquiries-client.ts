import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import type {
  Inquiry,
  InquiryStatus,
  InquirySummary,
  InquiriesFilter,
  PaginatedInquiries,
} from '../types/inquiries';

export class InquiryApiError extends Error {
  statusCode?: number;
  code?: string;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'InquiryApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const csrfHeaders = { [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE };
const inquiryStatuses: readonly InquiryStatus[] = [
  'new',
  'in_progress',
  'resolved',
  'closed',
];

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isInquirySummary(value: unknown): value is InquirySummary {
  const inquiry = record(value);
  return (
    inquiry !== null &&
    typeof inquiry.id === 'string' &&
    typeof inquiry.name === 'string' &&
    typeof inquiry.email === 'string' &&
    (typeof inquiry.company === 'string' || inquiry.company === null) &&
    inquiryStatuses.includes(inquiry.status as InquiryStatus) &&
    typeof inquiry.createdAt === 'string' &&
    typeof inquiry.updatedAt === 'string'
  );
}

function isInquiry(value: unknown): value is Inquiry {
  const inquiry = record(value);
  return isInquirySummary(value) && typeof inquiry?.message === 'string';
}

async function requireOk(response: Response, action: string): Promise<void> {
  if (response.ok) return;
  const errorBody = record(await response.json().catch(() => null));
  const message =
    typeof errorBody?.error === 'string'
      ? errorBody.error
      : `${action} (status ${response.status})`;
  const code = typeof errorBody?.code === 'string' ? errorBody.code : undefined;
  throw new InquiryApiError(message, response.status, code);
}

function paginatedInquiries(value: unknown): PaginatedInquiries {
  const result = record(value);
  if (
    !result ||
    !Array.isArray(result.items) ||
    !result.items.every(isInquirySummary) ||
    typeof result.total !== 'number' ||
    typeof result.page !== 'number' ||
    typeof result.limit !== 'number' ||
    typeof result.totalPages !== 'number'
  ) {
    throw new InquiryApiError('Invalid inquiries response', 502);
  }
  return result as unknown as PaginatedInquiries;
}

function inquiryEnvelope(value: unknown): Inquiry {
  const result = record(value);
  if (!result || !isInquiry(result.inquiry)) {
    throw new InquiryApiError('Invalid inquiry response', 502);
  }
  return result.inquiry;
}

export async function fetchInquiries(
  filter?: InquiriesFilter,
): Promise<PaginatedInquiries> {
  const params = new URLSearchParams();
  if (filter?.status && filter.status !== 'all')
    params.set('status', filter.status);
  if (filter?.search) params.set('search', filter.search);
  if (filter?.page !== undefined) params.set('page', String(filter.page));
  if (filter?.limit !== undefined) params.set('limit', String(filter.limit));

  const query = params.toString();
  const url = `/api/v1/admin/inquiries${query ? `?${query}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  await requireOk(response, 'Failed to fetch inquiries');
  return paginatedInquiries(await response.json());
}

export async function fetchInquiryById(id: string): Promise<Inquiry> {
  if (!id.trim()) throw new InquiryApiError('Inquiry ID is required', 400);

  const response = await fetch(
    `/api/v1/admin/inquiries/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );

  await requireOk(response, 'Failed to fetch inquiry');
  return inquiryEnvelope(await response.json());
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<Inquiry> {
  if (!id.trim()) throw new InquiryApiError('Inquiry ID is required', 400);

  const response = await fetch(
    `/api/v1/admin/inquiries/${encodeURIComponent(id)}/status`,
    {
      method: 'PUT',
      headers: {
        ...csrfHeaders,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ status }),
    },
  );

  await requireOk(response, 'Failed to update inquiry status');
  return inquiryEnvelope(await response.json());
}
