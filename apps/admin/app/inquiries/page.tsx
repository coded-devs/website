'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchInquiries,
  fetchInquiryById,
  updateInquiryStatus,
  InquiryApiError,
} from '../../src/lib/inquiries-client';
import { allowedInquiryStatusTransitions } from '../../src/lib/inquiry-status';
import type {
  Inquiry,
  InquiryStatus,
  InquirySummary,
} from '../../src/types/inquiries';
import { useDialogFocus } from '../../src/hooks/use-dialog-focus';
import {
  Button,
  DataTable,
  Dialog,
  Feedback,
} from '../../src/components/admin-ui';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<InquirySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>(
    'all',
  );
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedInquiry, setSelectedInquiry] = useState<InquirySummary | null>(
    null,
  );
  const [selectedInquiryDetail, setSelectedInquiryDetail] =
    useState<Inquiry | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const detailRequest = useRef<AbortController | null>(null);
  const listRequest = useRef<AbortController | null>(null);
  const inquiryDialog = useDialogFocus(selectedInquiry !== null, closeInquiry);

  const loadInquiries = useCallback(
    async (request: AbortController) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetchInquiries(
          {
            status: statusFilter,
            search: searchQuery.trim() || undefined,
            page,
            limit: 15,
          },
          request.signal,
        );
        if (listRequest.current !== request) return;
        setInquiries(response.items);
        setPage(response.page);
        setTotal(response.total);
        setTotalPages(response.totalPages);
      } catch (err) {
        if (request.signal.aborted || listRequest.current !== request) return;
        if (err instanceof InquiryApiError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Failed to load contact inquiries.');
        }
      } finally {
        if (listRequest.current === request) {
          listRequest.current = null;
          setIsLoading(false);
        }
      }
    },
    [statusFilter, searchQuery, page],
  );

  useEffect(() => {
    const request = new AbortController();
    listRequest.current = request;
    void loadInquiries(request);

    return () => {
      if (listRequest.current === request) listRequest.current = null;
      request.abort();
    };
  }, [loadInquiries]);

  useEffect(
    () => () => {
      const request = detailRequest.current;
      detailRequest.current = null;
      request?.abort();
    },
    [],
  );

  async function handleStatusChange(
    inquiry: Inquiry,
    newStatus: InquiryStatus,
  ) {
    setIsUpdating(true);
    try {
      const updated = await updateInquiryStatus(inquiry.id, newStatus);
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === inquiry.id
            ? {
                ...item,
                status: updated.status,
                statusUpdatedByAdminUserId: updated.statusUpdatedByAdminUserId,
                statusUpdatedAt: updated.statusUpdatedAt,
                updatedAt: updated.updatedAt,
              }
            : item,
        ),
      );
      if (selectedInquiry?.id === inquiry.id) {
        setSelectedInquiryDetail(updated);
      }
      setSuccessMessage(`Status updated to "${newStatus.replace('_', ' ')}".`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update status.',
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function openInquiry(inquiry: InquirySummary) {
    detailRequest.current?.abort();
    const request = new AbortController();
    detailRequest.current = request;
    setSelectedInquiry(inquiry);
    setSelectedInquiryDetail(null);
    setDetailError(null);
    setIsLoadingDetail(true);
    try {
      const detail = await fetchInquiryById(inquiry.id, request.signal);
      if (detailRequest.current === request) setSelectedInquiryDetail(detail);
    } catch (err) {
      if (request.signal.aborted || detailRequest.current !== request) return;
      setDetailError(
        err instanceof Error ? err.message : 'Failed to load inquiry details.',
      );
    } finally {
      if (detailRequest.current === request) {
        detailRequest.current = null;
        setIsLoadingDetail(false);
      }
    }
  }

  function closeInquiry() {
    const request = detailRequest.current;
    detailRequest.current = null;
    request?.abort();
    setSelectedInquiry(null);
    setSelectedInquiryDetail(null);
    setDetailError(null);
  }

  function getStatusBadgeStyle(status: InquiryStatus) {
    switch (status) {
      case 'new':
        return {
          className: 'bg-[color:#dbeafe] text-[color:#1e40af]',
          label: 'New',
        };
      case 'in_progress':
        return {
          className: 'bg-[color:#fef3c7] text-[color:#92400e]',
          label: 'In Progress',
        };
      case 'resolved':
        return {
          className: 'bg-[color:#ecfdf5] text-[color:#065f46]',
          label: 'Resolved',
        };
      case 'closed':
        return {
          className: 'bg-[color:#f3f4f6] text-[color:#4b5563]',
          label: 'Closed',
        };
    }
  }

  return (
    <div className="admin-page inquiries-page">
      {/* Header */}
      <header className="ui-page-header">
        <div>
          <h1>Contact Inquiries</h1>
          <p>
            Review and manage prospective client submissions from the public
            website contact form.
          </p>
        </div>
      </header>

      {/* Notifications */}
      {successMessage && (
        <Feedback tone="success" key={successMessage}>
          <span>{successMessage}</span>
          <Button
            type="button"
            variant="quiet"
            aria-label="Dismiss success message"
            onClick={() => setSuccessMessage(null)}
          >
            &times;
          </Button>
        </Feedback>
      )}

      {errorMessage && (
        <Feedback tone="error" key={errorMessage}>
          <span>{errorMessage}</span>
          <Button
            type="button"
            variant="quiet"
            aria-label="Dismiss error message"
            onClick={() => setErrorMessage(null)}
          >
            &times;
          </Button>
        </Feedback>
      )}

      {/* Filters Toolbar */}
      <div className="inquiries-toolbar flex justify-between items-center mb-[1.5rem] flex-wrap gap-[1rem] bg-white p-[1rem] rounded-[8px] [border:1px_solid_#e5e7eb]">
        <div className="flex gap-[0.5rem] flex-wrap">
          {(
            [
              { key: 'all' as const, label: 'All' },
              { key: 'new' as const, label: 'New' },
              {
                key: 'in_progress' as const,
                label: 'In Progress',
              },
              {
                key: 'resolved' as const,
                label: 'Resolved',
              },
              { key: 'closed' as const, label: 'Closed' },
            ] as const
          ).map((tab) => {
            const isSelected = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setPage(1);
                  setStatusFilter(tab.key);
                }}
                className={
                  '[padding:0.4rem_0.85rem] rounded-[6px] text-[length:0.85rem] font-semibold cursor-pointer [transition:all_0.15s_ease]' +
                  ' ' +
                  (isSelected
                    ? '[border:1px_solid_#4f46e5] bg-[color:#eef2ff] text-[color:#4f46e5]'
                    : '[border:1px_solid_#e5e7eb] bg-white text-[color:#4b5563]')
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setPage(1);
              setSearchQuery(e.target.value);
            }}
            placeholder="Search inquiries..."
            aria-label="Search inquiries"
            className="[padding:0.45rem_0.75rem] rounded-[6px] [border:1px_solid_#d1d5db] text-[length:0.85rem] w-[240px]"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div
          className="inquiries-loading p-[3rem] text-center bg-white rounded-[8px] [border:1px_solid_#e5e7eb] text-[color:#6b7280]"
          role="status"
        >
          <p className="m-0">Loading inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="admin-empty-state inquiries-empty [padding:4rem_2rem] text-center bg-white rounded-[8px] [border:1px_dashed_#d1d5db]">
          <h2 className="text-[length:1.25rem] font-semibold text-[color:#111827] [margin:0_0_0.5rem_0]">
            {searchQuery
              ? 'No matching inquiries'
              : 'No inquiries received yet'}
          </h2>
          <p className="text-[color:#6b7280] text-[length:0.9rem] m-0">
            {searchQuery
              ? 'Try modifying your search keywords.'
              : 'New contact form submissions from website visitors will appear here.'}
          </p>
        </div>
      ) : (
        <DataTable label="Contact inquiries">
          <table
            aria-label="Contact inquiries"
            className="w-full border-collapse text-left text-[length:0.9rem]"
          >
            <thead>
              <tr className="[border-bottom:1px_solid_#e5e7eb] bg-[color:#f9fafb] text-[color:#4b5563] text-[length:0.8rem] uppercase tracking-[0.05em]">
                <th scope="col" className="[padding:0.75rem_1.25rem]">
                  Sender
                </th>
                <th scope="col" className="[padding:0.75rem_1rem]">
                  Company
                </th>
                <th scope="col" className="[padding:0.75rem_1rem]">
                  Message Excerpt
                </th>
                <th scope="col" className="[padding:0.75rem_1rem]">
                  Status
                </th>
                <th scope="col" className="[padding:0.75rem_1rem]">
                  Date Received
                </th>
                <th
                  scope="col"
                  className="[padding:0.75rem_1.25rem] text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => {
                const badge = getStatusBadgeStyle(inq.status);
                const formattedDate = inq.createdAt
                  ? new Date(inq.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—';

                return (
                  <tr
                    key={inq.id}
                    className={
                      '[border-bottom:1px_solid_#f3f4f6]' +
                      ' ' +
                      (inq.status === 'new' ? 'bg-[color:#fbfcfe]' : 'bg-white')
                    }
                  >
                    <td className="[padding:1rem_1.25rem]">
                      <div className="font-semibold text-[color:#111827]">
                        {inq.name}
                      </div>
                      <div className="text-[length:0.8rem] text-[color:#6b7280]">
                        {inq.email}
                      </div>
                    </td>

                    <td className="p-[1rem] text-[color:#4b5563]">
                      {inq.company || '—'}
                    </td>

                    <td className="p-[1rem] text-[color:#4b5563] max-w-[280px]">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[length:0.85rem]">
                        Open to view
                      </div>
                    </td>

                    <td className="p-[1rem]">
                      <span
                        className={
                          'inline-block [padding:0.2rem_0.55rem] rounded-[9999px] text-[length:0.75rem] font-semibold' +
                          ' ' +
                          badge.className
                        }
                      >
                        {badge.label}
                      </span>
                    </td>

                    <td className="p-[1rem] text-[color:#6b7280] text-[length:0.85rem]">
                      {formattedDate}
                    </td>

                    <td className="[padding:1rem_1.25rem] text-right">
                      <div className="inline-flex gap-[0.5rem] items-center">
                        <button
                          type="button"
                          onClick={() => void openInquiry(inq)}
                          className="[padding:0.35rem_0.75rem] rounded-[5px] [border:1px_solid_#d1d5db] bg-white text-[color:#374151] text-[length:0.8rem] font-medium cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DataTable>
      )}

      <div className="flex justify-between items-center gap-[1rem] [padding:1rem_0] text-[color:#6b7280] text-[length:0.85rem]">
        <span>
          {total} {total === 1 ? 'inquiry' : 'inquiries'} · Page {page} of{' '}
          {totalPages}
        </span>
        <div className="flex gap-[0.5rem]">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={isLoading || page <= 1}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={isLoading || totalPages === 0 || page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Inquiry Detail Drawer / Modal */}
      {selectedInquiry && (
        <Dialog
          labelledBy="inquiry-dialog-title"
          ref={inquiryDialog.dialogRef}
          onKeyDown={inquiryDialog.onDialogKeyDown}
        >
          <div className="bg-white rounded-[8px] max-w-[600px] w-full p-[1.75rem] [box-shadow:0_20px_25px_-5px_rgba(0,_0,_0,_0.1)]">
            <div className="flex justify-between items-start mb-[1.25rem]">
              <div>
                <h3
                  id="inquiry-dialog-title"
                  className="text-[length:1.25rem] font-bold [margin:0_0_0.25rem_0] text-[color:#111827]"
                >
                  {selectedInquiry.name}
                </h3>
                <div className="text-[length:0.85rem] text-[color:#6b7280]">
                  Submitted on{' '}
                  {new Date(selectedInquiry.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close inquiry details"
                onClick={closeInquiry}
                className="[background:none] [border:none] text-[length:1.5rem] cursor-pointer text-[color:#6b7280]"
              >
                &times;
              </button>
            </div>

            {isLoadingDetail ? (
              <p role="status">Loading inquiry details...</p>
            ) : detailError ? (
              <div role="alert">
                <p>{detailError}</p>
                <button
                  type="button"
                  onClick={() => void openInquiry(selectedInquiry)}
                >
                  Retry
                </button>
              </div>
            ) : selectedInquiryDetail ? (
              <>
                <div className="grid grid-cols-[1fr_1fr] gap-[1rem] mb-[1.25rem] bg-[color:#f9fafb] p-[1rem] rounded-[6px]">
                  <div>
                    <div className="text-[length:0.75rem] text-[color:#6b7280] uppercase font-semibold">
                      Email Address
                    </div>
                    <div className="text-[length:0.9rem] text-[color:#111827] mt-[0.2rem]">
                      <a
                        href={`mailto:${selectedInquiryDetail.email}`}
                        className="text-[color:#4f46e5]"
                      >
                        {selectedInquiryDetail.email}
                      </a>
                    </div>
                  </div>
                  <div>
                    <div className="text-[length:0.75rem] text-[color:#6b7280] uppercase font-semibold">
                      Company
                    </div>
                    <div className="text-[length:0.9rem] text-[color:#111827] mt-[0.2rem]">
                      {selectedInquiryDetail.company || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div className="mb-[1.5rem]">
                  <div className="text-[length:0.75rem] text-[color:#6b7280] uppercase font-semibold mb-[0.5rem]">
                    Message
                  </div>
                  <div className="text-[length:0.925rem] leading-[1.6] text-[color:#1f2937] bg-white [border:1px_solid_#e5e7eb] rounded-[6px] p-[1rem] whitespace-pre-wrap">
                    {selectedInquiryDetail.message}
                  </div>
                </div>

                {/* Status Follow-up Selector */}
                <div className="flex justify-between items-center [border-top:1px_solid_#e5e7eb] pt-[1.25rem]">
                  <div className="flex items-center gap-[0.5rem]">
                    <label
                      htmlFor="inquiry-status"
                      className="text-[length:0.85rem] font-semibold text-[color:#374151]"
                    >
                      Status:
                    </label>
                    <select
                      id="inquiry-status"
                      value={selectedInquiryDetail.status}
                      onChange={(e) =>
                        handleStatusChange(
                          selectedInquiryDetail,
                          e.target.value as InquiryStatus,
                        )
                      }
                      disabled={
                        isUpdating ||
                        allowedInquiryStatusTransitions(
                          selectedInquiryDetail.status,
                        ).length === 0
                      }
                      className="[padding:0.35rem_0.65rem] rounded-[6px] [border:1px_solid_#d1d5db] text-[length:0.85rem] font-medium"
                    >
                      <option value={selectedInquiryDetail.status}>
                        {
                          getStatusBadgeStyle(selectedInquiryDetail.status)
                            .label
                        }
                      </option>
                      {allowedInquiryStatusTransitions(
                        selectedInquiryDetail.status,
                      ).map((status) => (
                        <option key={status} value={status}>
                          {getStatusBadgeStyle(status).label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-[0.75rem]">
                    <a
                      href={`mailto:${selectedInquiryDetail.email}?subject=Re: Inquiry with CodedDevs`}
                      className="[padding:0.45rem_1rem] rounded-[6px] bg-[color:#4f46e5] text-white no-underline font-semibold text-[length:0.85rem]"
                    >
                      Reply via Email &rarr;
                    </a>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </Dialog>
      )}
    </div>
  );
}
