import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  retryAfterMinutes,
  toInquiryPayload,
  validateInquiry,
} from './inquiry.ts';

const valid = {
  name: 'Amina Okafor',
  email: 'amina@example.com',
  company: '',
  message: 'We are building a booking product and want design help.',
};

describe('validateInquiry', () => {
  it('accepts a valid inquiry with no company', () => {
    assert.deepEqual(validateInquiry(valid), {});
  });

  it('reports every invalid field with the API limits', () => {
    const errors = validateInquiry({
      name: 'A',
      email: 'name@company',
      company: 'x'.repeat(201),
      message: 'Too short',
    });
    assert.equal(errors.name, 'Name must be at least 2 characters.');
    assert.equal(errors.email, 'Enter an email address like name@company.com.');
    assert.equal(errors.company, 'Company must be 200 characters or fewer.');
    assert.equal(errors.message, 'Message must be at least 20 characters.');
  });

  it('counts characters, not UTF-16 units, and trims whitespace', () => {
    assert.equal(
      validateInquiry({ ...valid, name: '  Ọ  ' }).name,
      'Name must be at least 2 characters.',
    );
    assert.equal(validateInquiry({ ...valid, name: 'Ọlá' }).name, undefined);
  });
});

describe('toInquiryPayload', () => {
  it('trims fields and drops a blank company', () => {
    assert.deepEqual(
      toInquiryPayload({ ...valid, name: ' Amina ', company: '  ' }),
      {
        name: 'Amina',
        email: 'amina@example.com',
        message: valid.message,
      },
    );
  });
});

describe('retryAfterMinutes', () => {
  it('rounds seconds up to whole minutes', () => {
    assert.equal(retryAfterMinutes('61'), 2);
    assert.equal(retryAfterMinutes('1'), 1);
  });

  it('returns null for missing or invalid values', () => {
    assert.equal(retryAfterMinutes(null), null);
    assert.equal(retryAfterMinutes('soon'), null);
    assert.equal(retryAfterMinutes('0'), null);
  });
});
