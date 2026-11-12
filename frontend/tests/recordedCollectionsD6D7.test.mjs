import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTermId, normalizeRecordedCollections } from '../src/features/finance/recordedCollectionsD6D6.mjs';
const payload = (overrides = {}) => ({
  read_only: true, scope: 'Recorded payments only', school_id: 10, term_id: 8,
  gross_recorded: '300.00', reversed_recorded: '100.00', net_recorded: '200.00', payment_count: 2,
  ...overrides,
});
test('matches selected term and produces valid read-only totals', () => {
  assert.deepEqual(normalizeRecordedCollections(payload(), 8), {gross:300,reversed:100,net:200,count:2});
});
test('rejects response for a different selected term', () => {
  assert.throws(() => normalizeRecordedCollections(payload({term_id:9}), 8), /term/i);
});
test('rejects missing or invalid school ownership context', () => {
  for (const school_id of [null, 0, -1, '10']) {
    assert.throws(() => normalizeRecordedCollections(payload({school_id}), 8));
  }
});
test('rejects malformed selected term identifiers', () => {
  for (const term of ['0', '-2', '1 OR 1=1', '1.2', '', '1234567890123']) {
    assert.throws(() => normalizeTermId(term));
  }
  assert.equal(normalizeTermId('8'), 8);
});
test('rejects unrepresentable money and invalid count', () => {
  assert.throws(() => normalizeRecordedCollections(payload({gross_recorded:'999999999999999.00'}), 8));
  assert.throws(() => normalizeRecordedCollections(payload({payment_count:true}), 8));
});
