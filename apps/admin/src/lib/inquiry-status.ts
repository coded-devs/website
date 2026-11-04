import type { InquiryStatus } from '../types/inquiries';

const transitions = {
  new: ['in_progress', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: ['in_progress', 'closed'],
  closed: [],
} as const satisfies Record<InquiryStatus, readonly InquiryStatus[]>;

export function allowedInquiryStatusTransitions(
  status: InquiryStatus,
): readonly InquiryStatus[] {
  return transitions[status];
}
