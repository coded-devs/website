import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newPasswordSchema } from './contracts.js';

test('new passwords require at least 8 characters', () => {
  assert.equal(newPasswordSchema.safeParse('a'.repeat(7)).success, false);
  assert.equal(newPasswordSchema.safeParse('a'.repeat(8)).success, true);
});

test('a valid 128-code-point ASCII password passes', () => {
  assert.equal(newPasswordSchema.safeParse('a'.repeat(128)).success, true);
  assert.equal(newPasswordSchema.safeParse('a'.repeat(129)).success, false);
});

test('new passwords do not impose composition rules', () => {
  assert.equal(
    newPasswordSchema.safeParse('correct horse battery staple').success,
    true,
  );
  assert.equal(
    newPasswordSchema.safeParse('密碼句子安全長度足夠了無需組合規則').success,
    true,
  );
});

test('new password length counts Unicode code points', () => {
  assert.equal(newPasswordSchema.safeParse('🔐'.repeat(7)).success, false);
  assert.equal(newPasswordSchema.safeParse('🔐'.repeat(8)).success, true);
});

test('new password limits count mixed BMP and astral characters as code points', () => {
  const maximumCodePointPassword = `${'a'.repeat(127)}🔐`;
  const belowMinimumCodePointPassword = `${'a'.repeat(6)}🔐`;

  assert.equal(
    newPasswordSchema.safeParse(maximumCodePointPassword).success,
    true,
  );
  assert.equal(
    newPasswordSchema.safeParse(belowMinimumCodePointPassword).success,
    false,
  );
});

test('a Unicode password within the character limit but over the byte limit fails', () => {
  assert.equal(newPasswordSchema.safeParse('🔐'.repeat(65)).success, false);
});

test('a boundary Unicode password at the byte limit passes', () => {
  assert.equal(newPasswordSchema.safeParse('🔐'.repeat(64)).success, true);
});
