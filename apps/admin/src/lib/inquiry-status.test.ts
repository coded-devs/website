import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allowedInquiryStatusTransitions } from './inquiry-status.ts';

test('only permitted inquiry status transitions are selectable', () => {
  assert.deepEqual(allowedInquiryStatusTransitions('new'), [
    'in_progress',
    'closed',
  ]);
  assert.deepEqual(allowedInquiryStatusTransitions('in_progress'), [
    'resolved',
    'closed',
  ]);
  assert.deepEqual(allowedInquiryStatusTransitions('resolved'), [
    'in_progress',
    'closed',
  ]);
  assert.deepEqual(allowedInquiryStatusTransitions('closed'), []);
});
