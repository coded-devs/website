import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  INQUIRY_EMAIL_RATE_LIMIT,
  INQUIRY_IP_RATE_LIMIT,
  INQUIRY_JSON_BODY_LIMIT_BYTES,
  inquiryAdminQuerySchema,
  inquiryIdSchema,
  inquiryInputSchema,
  inquiryStatusSchema,
  inquiryStatusUpdateSchema,
  inquiryErrorResponse,
  inquiryStatusTransitions,
  serializeInquiryDetail,
  serializeInquiryListItem,
  serializePublicInquirySuccess,
} from './contracts.js';

test('public inquiry input trims, normalizes email, and strictly validates fields', () => {
  assert.deepEqual(
    inquiryInputSchema.parse({
      name: '  Ada Lovelace  ',
      email: '  ADA@Example.COM ',
      company: '  Analytical Engines  ',
      message: `  ${'A'.repeat(20)}  `,
    }),
    {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      company: 'Analytical Engines',
      message: 'A'.repeat(20),
    },
  );
  assert.deepEqual(
    inquiryInputSchema.parse({ name: 'Ada', email: 'a@b.com', company: '  ', message: 'x'.repeat(20) }),
    { name: 'Ada', email: 'a@b.com', message: 'x'.repeat(20) },
  );
  assert.equal(inquiryInputSchema.safeParse({ name: '😀', email: 'a@b.com', message: 'x'.repeat(20) }).success, false);
  assert.equal(inquiryInputSchema.safeParse({ name: '😀'.repeat(2), email: 'a@b.com', message: 'x'.repeat(20) }).success, true);
  assert.equal(inquiryInputSchema.safeParse({ name: 'Ada', email: 'a@b.com', message: 'x'.repeat(20), extra: true }).success, false);
  assert.equal(inquiryInputSchema.safeParse({ name: 'Ada', email: 'a@b.com', company: 'x'.repeat(201), message: 'x'.repeat(20) }).success, false);
  assert.equal(inquiryInputSchema.safeParse({ name: 'Ada', email: 'bad', message: 'x'.repeat(20) }).success, false);
  assert.equal(inquiryInputSchema.safeParse({ name: 'Ada', email: 'a@b.com', message: 'x'.repeat(19) }).success, false);
});

test('Admin inquiry query defaults and bounds are strict', () => {
  assert.deepEqual(inquiryAdminQuerySchema.parse({}), { page: 1, limit: 20 });
  assert.deepEqual(inquiryAdminQuerySchema.parse({ page: '2', limit: '100', status: 'new', search: '  Ada ' }), {
    page: 2, limit: 100, status: 'new', search: 'Ada',
  });
  for (const query of [{ page: '0' }, { limit: '101' }, { status: 'unknown' }, { search: 'x'.repeat(201) }, { extra: true }]) {
    assert.equal(inquiryAdminQuerySchema.safeParse(query).success, false);
  }
});

test('inquiry status schemas validate UUID and strict update body', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  assert.equal(inquiryIdSchema.parse(id), id);
  assert.equal(inquiryIdSchema.safeParse('not-a-uuid').success, false);
  assert.deepEqual(inquiryStatusUpdateSchema.parse({ status: 'in_progress' }), { status: 'in_progress' });
  assert.equal(inquiryStatusUpdateSchema.safeParse({ status: 'new', extra: true }).success, false);
  assert.equal(inquiryStatusSchema.safeParse('unknown').success, false);
});

test('inquiry serializers expose only intended fields and ISO timestamps', () => {
  const row = {
    id: '11111111-1111-4111-8111-111111111111', name: 'Ada', email: 'ada@example.com',
    company: null, message: 'A private inquiry message', status: 'new' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: '2026-01-02T00:00:00.000Z',
  };
  assert.deepEqual(serializePublicInquirySuccess(), { received: true });
  const summary = serializeInquiryListItem(row);
  assert.equal('message' in summary, false);
  assert.equal(summary.createdAt, '2026-01-01T00:00:00.000Z');
  assert.equal(serializeInquiryDetail(row).message, row.message);
});

test('stable inquiry errors, rate limits, body size, and allowed status transitions are explicit', () => {
  assert.equal(inquiryErrorResponse('invalid').status, 400);
  assert.equal(inquiryErrorResponse('not_found').status, 404);
  assert.equal(inquiryErrorResponse('invalid_transition').status, 409);
  assert.equal(inquiryErrorResponse('rate_limited').status, 429);
  assert.equal(inquiryErrorResponse('unavailable').status, 503);
  assert.deepEqual(INQUIRY_JSON_BODY_LIMIT_BYTES, 16 * 1024);
  assert.deepEqual(INQUIRY_IP_RATE_LIMIT, { attempts: 60, windowSeconds: 900 });
  assert.deepEqual(INQUIRY_EMAIL_RATE_LIMIT, { attempts: 3, windowSeconds: 3600 });
  assert.deepEqual(inquiryStatusTransitions, {
    new: ['in_progress', 'closed'],
    in_progress: ['resolved', 'closed'],
    resolved: ['in_progress', 'closed'],
    closed: [],
  });
  assert.equal(inquiryStatusTransitions.new.includes('new'), false);
});
