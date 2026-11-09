import assert from 'node:assert/strict';
import { test } from 'node:test';
import { escapeDelimitedField, splitDelimitedLine } from './delimited-text.ts';

test('delimited text preserves pipes, slashes, and embedded line breaks', () => {
  const fields = [
    'Our values',
    'Build with care | every day.\nListen first.\\',
  ];
  const encoded = fields.map(escapeDelimitedField).join(' | ');

  assert.deepEqual(splitDelimitedLine(encoded), fields);
});
