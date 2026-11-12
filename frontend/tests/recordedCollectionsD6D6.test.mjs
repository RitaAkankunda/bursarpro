import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecordedCollections, formatRecordedAmount } from '../src/features/finance/recordedCollectionsD6D6.mjs';

test('valid gross/reversed/net amounts remain distinct', () => {
  const x = normalizeRecordedCollections({ read_only:true, scope:'school_term', gross_recorded:'200.00', reversed_recorded:'50.00', net_recorded:'150.00', payment_count:2 });
  assert.deepEqual(x, { gross:200, reversed:50, net:150, count:2 });
});
test('rejects mismatched totals', () => assert.throws(() => normalizeRecordedCollections({read_only:true,scope:'school_term',gross_recorded:'200',reversed_recorded:'50',net_recorded:'200',payment_count:2})));
test('rejects untrusted non-read-only data', () => assert.throws(() => normalizeRecordedCollections({scope:'school_term',gross_recorded:'1',reversed_recorded:'0',net_recorded:'1',payment_count:1})));
test('rejects malformed and negative payment values', () => {
  for (const gross of ['Infinity','NaN','1e6','-1','1,000',null]) assert.throws(() => normalizeRecordedCollections({read_only:true,scope:'school_term',gross_recorded:gross,reversed_recorded:'0',net_recorded:'0',payment_count:1}));
});
test('formats amounts without inventing UGX currency', () => assert.match(formatRecordedAmount(1234.5), /1,234\.50/));
