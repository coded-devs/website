import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import {
  fetchInquiries,
  fetchInquiryById,
  updateInquiryStatus,
  InquiryApiError,
} from './inquiries-client.ts';
import type { Inquiry, InquirySummary } from '../types/inquiries.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const summary: InquirySummary = {
  id: 'inq-1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  company: 'Example Co',
  status: 'new',
  statusUpdatedByAdminUserId: null,
  statusUpdatedAt: null,
  createdAt: '2026-10-30T10:00:00Z',
  updatedAt: '2026-10-30T10:00:00Z',
};

const detail: Inquiry = {
  ...summary,
  message: 'Interested in enterprise cloud migration.',
  updatedAt: '2026-10-30T10:00:00Z',
};

describe('Inquiries API client', () => {
  test('returns canonical summary pagination without requiring message', async () => {
    let capturedUrl = '';
    const envelope = {
      items: [summary],
      total: 37,
      page: 2,
      limit: 15,
      totalPages: 3,
    };
    globalThis.fetch = async (input) => {
      capturedUrl = input.toString();
      return new Response(JSON.stringify(envelope));
    };

    assert.deepEqual(await fetchInquiries({ page: 2, limit: 15 }), envelope);
    assert.ok(capturedUrl.includes('page=2'));
    assert.ok(capturedUrl.includes('limit=15'));
  });

  test('forwards an AbortSignal so list requests can be cancelled', async () => {
    const controller = new AbortController();
    let capturedSignal: AbortSignal | null | undefined;
    globalThis.fetch = async (_input, init) => {
      capturedSignal = init?.signal;
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    };

    const request = fetchInquiries(undefined, controller.signal);
    controller.abort();

    assert.equal(capturedSignal, controller.signal);
    await assert.rejects(
      request,
      (error: unknown) =>
        error instanceof DOMException && error.name === 'AbortError',
    );
  });

  test('does not accept legacy listing shapes or invent pagination metadata', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ inquiries: [detail] }));
    await assert.rejects(fetchInquiries(), InquiryApiError);
  });

  test('rejects summaries missing required status audit fields', async () => {
    const withoutActor = { ...summary, statusUpdatedByAdminUserId: undefined };
    const withoutStatusDate = { ...summary, statusUpdatedAt: undefined };
    for (const invalidSummary of [withoutActor, withoutStatusDate]) {
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            items: [invalidSummary],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          }),
        );
      await assert.rejects(fetchInquiries(), InquiryApiError);
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            inquiry: { ...invalidSummary, message: detail.message },
          }),
        );
      await assert.rejects(fetchInquiryById('inq-1'), InquiryApiError);
    }
  });

  test('uses the canonical error field and ignores noncanonical message fields', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: 'legacy error' }), {
        status: 401,
      });

    await assert.rejects(
      fetchInquiries(),
      (error: unknown) =>
        error instanceof InquiryApiError &&
        error.statusCode === 401 &&
        error.message === 'Failed to fetch inquiries (status 401)',
    );
  });

  test('fetches inquiry detail only from the canonical detail envelope', async () => {
    let capturedUrl = '';
    globalThis.fetch = async (input) => {
      capturedUrl = input.toString();
      return new Response(JSON.stringify({ inquiry: detail }));
    };

    assert.deepEqual(await fetchInquiryById('inq-1'), detail);
    assert.ok(capturedUrl.endsWith('/api/v1/admin/inquiries/inq-1'));

    globalThis.fetch = async () => new Response(JSON.stringify(detail));
    await assert.rejects(fetchInquiryById('inq-1'), InquiryApiError);
  });

  test('forwards an AbortSignal so detail requests can be cancelled', async () => {
    const controller = new AbortController();
    let capturedSignal: AbortSignal | null | undefined;
    globalThis.fetch = async (_input, init) => {
      capturedSignal = init?.signal;
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    };

    const request = fetchInquiryById('inq-1', controller.signal);
    controller.abort();

    assert.equal(capturedSignal, controller.signal);
    await assert.rejects(
      request,
      (error: unknown) =>
        error instanceof DOMException && error.name === 'AbortError',
    );
  });

  test('rejects empty IDs for both detail reads and status updates', async () => {
    await assert.rejects(fetchInquiryById(''), InquiryApiError);
    await assert.rejects(updateInquiryStatus('  ', 'closed'), InquiryApiError);
  });

  test('updates status with PUT, the shared CSRF header, and a full inquiry envelope', async () => {
    const captured: {
      url?: string;
      method?: string;
      headers?: Headers;
      body?: { status?: string };
    } = {};
    globalThis.fetch = async (input, init) => {
      captured.url = input.toString();
      captured.method = init?.method;
      captured.headers = new Headers(init?.headers);
      captured.body = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          inquiry: { ...detail, status: captured.body?.status },
        }),
      );
    };

    const updated = await updateInquiryStatus('inq-1', 'resolved');
    assert.equal(captured.method, 'PUT');
    assert.ok(captured.url?.endsWith('/api/v1/admin/inquiries/inq-1/status'));
    assert.equal(captured.headers?.get(AUTH_CSRF_HEADER), AUTH_CSRF_VALUE);
    assert.equal(captured.body?.status, 'resolved');
    assert.equal(updated.message, detail.message);
    assert.equal(updated.status, 'resolved');
  });

  test('status update consumes canonical errors only', async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ error: 'Invalid transition', code: 'BAD' }),
        {
          status: 400,
        },
      );
    await assert.rejects(
      updateInquiryStatus('inq-1', 'closed'),
      (error: unknown) =>
        error instanceof InquiryApiError &&
        error.statusCode === 400 &&
        error.message === 'Invalid transition' &&
        error.code === 'BAD',
    );
  });
});
