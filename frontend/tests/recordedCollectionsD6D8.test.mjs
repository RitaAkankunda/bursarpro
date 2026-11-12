import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyRecordedCollectionsError, showRecordedCollectionsValues } from '../src/features/finance/recordedCollectionsD6D8.mjs';

test('shows values only for successful non-placeholder selected term', () => {
  assert.equal(showRecordedCollectionsValues({validTerm:true,isSuccess:true,isError:false,isPlaceholderData:false}), true);
});
test('does not show stale or placeholder values for a different term', () => {
  assert.equal(showRecordedCollectionsValues({validTerm:true,isSuccess:true,isError:false,isPlaceholderData:true}), false);
  assert.equal(showRecordedCollectionsValues({validTerm:false,isSuccess:true,isError:false,isPlaceholderData:false}), false);
});
test('does not show values after refresh or request error', () => {
  assert.equal(showRecordedCollectionsValues({validTerm:true,isSuccess:true,isError:true,isPlaceholderData:false}), false);
});
test('distinguishes access and consistency failures without leaking server message', () => {
  assert.match(classifyRecordedCollectionsError({response:{status:403,data:{secret:'do not show'}}}), /restricted/i);
  assert.match(classifyRecordedCollectionsError({response:{status:409}}), /consistency/i);
  assert.doesNotMatch(classifyRecordedCollectionsError({response:{status:500,data:{secret:'do not show'}}}), /do not show/);
});
test('panel wires read-only values gate, status, and retry controls', () => {
  const source = readFileSync(new URL('../src/features/finance/RecordedCollectionsPanel.jsx', import.meta.url),'utf8');
  assert.match(source, /showRecordedCollectionsValues\(/);
  assert.match(source, /\{showValues \? \(/);
  assert.match(source, /aria-busy=\{busy\}/);
  assert.match(source, /Retry report/);
});
