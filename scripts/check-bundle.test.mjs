import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkBundle } from './check-bundle.mjs';

const tempDir = () => mkdtempSync(join(tmpdir(), 'bundle-'));

test('fails when dist is missing', () => {
  const result = checkBundle(join(tempDir(), 'missing'));
  assert.equal(result.code, 1);
  assert.match(result.messages[0], /dist\/ not found, run npm run build first/);
});

test('fails when dist has no JS bundles', () => {
  const dir = tempDir();
  writeFileSync(join(dir, 'index.html'), '<html></html>');
  assert.equal(checkBundle(dir).code, 1);
});

test('fails when a bundle contains the forbidden host', () => {
  const dir = tempDir();
  mkdirSync(join(dir, 'sub'));
  writeFileSync(join(dir, 'sub', 'main.js'), 'x="a@chubb.test"');
  const result = checkBundle(dir);
  assert.equal(result.code, 1);
  assert.equal(result.messages.length, 1);
});

test('passes for a clean bundle', () => {
  const dir = tempDir();
  writeFileSync(join(dir, 'main.js'), 'console');
  assert.equal(checkBundle(dir).code, 0);
});
