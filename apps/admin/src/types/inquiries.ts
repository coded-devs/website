export type InquiryStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface InquirySummary {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: InquiryStatus;
  statusUpdatedByAdminUserId: string | null;
  statusUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry extends InquirySummary {
  message: string;
}

export interface InquiriesFilter {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedInquiries {
  items: InquirySummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
