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
        return { bg: '#dbeafe', color: '#1e40af', label: 'New' };
      case 'in_progress':
        return { bg: '#fef3c7', color: '#92400e', label: 'In Progress' };
      case 'resolved':
        return { bg: '#ecfdf5', color: '#065f46', label: 'Resolved' };
      case 'closed':
        return { bg: '#f3f4f6', color: '#4b5563', label: 'Closed' };
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
          }}
        >
          Contact Inquiries
        </h1>
        <p style={{ color: '#4b5563', margin: 0, fontSize: '0.95rem' }}>
          Review and manage prospective client submissions from the public
          website contact form.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#065f46',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                onClick={() => {
                  setPage(1);
                  setStatusFilter(tab.key);
                }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected
                    ? '1px solid #4f46e5'
                    : '1px solid #e5e7eb',
                  backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                  color: isSelected ? '#4f46e5' : '#4b5563',
                  transition: 'all 0.15s ease',
                }}
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
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.85rem',
              width: '240px',
            }}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            color: '#6b7280',
          }}
        >
          <p style={{ margin: 0 }}>Loading inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px dashed #d1d5db',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 0.5rem 0',
            }}
          >
            {searchQuery
              ? 'No matching inquiries'
              : 'No inquiries received yet'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
            {searchQuery
              ? 'Try modifying your search keywords.'
              : 'New contact form submissions from website visitors will appear here.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  color: '#4b5563',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '0.75rem 1.25rem' }}>Sender</th>
                <th style={{ padding: '0.75rem 1rem' }}>Company</th>
                <th style={{ padding: '0.75rem 1rem' }}>Message Excerpt</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date Received</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
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
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor:
                        inq.status === 'new' ? '#fbfcfe' : '#ffffff',
                    }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>
                        {inq.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {inq.email}
                      </div>
                    </td>

                    <td style={{ padding: '1rem', color: '#4b5563' }}>
                      {inq.company || '—'}
                    </td>

                    <td
                      style={{
                        padding: '1rem',
                        color: '#4b5563',
                        maxWidth: '280px',
                      }}
                    >
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.85rem',
                        }}
                      >
                        Open to view
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '1rem',
                        color: '#6b7280',
                        fontSize: '0.85rem',
                      }}
                    >
                      {formattedDate}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => void openInquiry(inq)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '5px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
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
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 0',
          color: '#6b7280',
          fontSize: '0.85rem',
        }}
      >
        <span>
          {total} {total === 1 ? 'inquiry' : 'inquiries'} · Page {page} of{' '}
          {totalPages}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        <div
          role="dialog"
          aria-modal="true"
          ref={inquiryDialog.dialogRef}
          onKeyDown={inquiryDialog.onDialogKeyDown}
          tabIndex={-1}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    margin: '0 0 0.25rem 0',
                    color: '#111827',
                  }}
                >
                  {selectedInquiry.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  Submitted on{' '}
                  {new Date(selectedInquiry.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={closeInquiry}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
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
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                    backgroundColor: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '6px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Email Address
                    </div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: '#111827',
                        marginTop: '0.2rem',
                      }}
                    >
                      <a
                        href={`mailto:${selectedInquiryDetail.email}`}
                        style={{ color: '#4f46e5' }}
                      >
                        {selectedInquiryDetail.email}
                      </a>
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Company
                    </div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: '#111827',
                        marginTop: '0.2rem',
                      }}
                    >
                      {selectedInquiryDetail.company || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                    }}
                  >
                    Message
                  </div>
                  <div
                    style={{
                      fontSize: '0.925rem',
                      lineHeight: 1.6,
                      color: '#1f2937',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '1rem',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedInquiryDetail.message}
                  </div>
                </div>

                {/* Status Follow-up Selector */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      Status:
                    </span>
                    <select
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
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
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

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <a
                      href={`mailto:${selectedInquiryDetail.email}?subject=Re: Inquiry with CodedDevs`}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '6px',
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      Reply via Email &rarr;
                    </a>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
