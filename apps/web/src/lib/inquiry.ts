/**
 * Client-side rules for the contact inquiry. They mirror the API contract for
 * POST /api/v1/public/inquiries (docs/inquiries-and-settings.md) so people see
 * the same errors before and after sending.
 */

export interface InquiryInput {
  name: string;
  email: string;
  company: string;
  message: string;
}

export type InquiryField = keyof InquiryInput;
export type InquiryErrors = Partial<Record<InquiryField, string>>;

const length = (value: string) => Array.from(value.trim()).length;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInquiryField(
  field: InquiryField,
  value: string,
): string | undefined {
  switch (field) {
    case 'name': {
      const n = length(value);
      if (n === 0) return 'Enter your name.';
      if (n < 2) return 'Name must be at least 2 characters.';
      if (n > 200) return 'Name must be 200 characters or fewer.';
      return undefined;
    }
    case 'email': {
      const t = value.trim();
      if (t.length === 0) return 'Enter your email address.';
      if (t.length > 320 || !EMAIL.test(t)) {
        return 'Enter an email address like name@company.com.';
      }
      return undefined;
    }
    case 'company':
      return length(value) > 200
        ? 'Company must be 200 characters or fewer.'
        : undefined;
    case 'message': {
      const n = length(value);
      if (n === 0) return 'Enter a message.';
      if (n < 20) return 'Message must be at least 20 characters.';
      if (n > 5000) return 'Message must be 5,000 characters or fewer.';
      return undefined;
    }
  }
}

export function validateInquiry(input: InquiryInput): InquiryErrors {
  const errors: InquiryErrors = {};
  for (const field of ['name', 'email', 'company', 'message'] as const) {
    const message = validateInquiryField(field, input[field]);
    if (message) errors[field] = message;
  }
  return errors;
}

/** Body sent to the API: trimmed, and company omitted when blank. */
export function toInquiryPayload(input: InquiryInput) {
  const company = input.company.trim();
  return {
    name: input.name.trim(),
    email: input.email.trim(),
    ...(company ? { company } : {}),
    message: input.message.trim(),
  };
}

/** Converts a Retry-After header (seconds) into whole minutes, at least 1. */
export function retryAfterMinutes(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number.parseInt(header, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.max(1, Math.ceil(seconds / 60));
}
