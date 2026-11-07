import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFinancialMetric } from '../src/features/finance/domain/formatFinancialMetric.js';

test('formats finite numeric financial figures in UGX', () => {
  assert.equal(formatFinancialMetric(450000), 'UGX 450,000');
  assert.equal(formatFinancialMetric(0), 'UGX 0');
});
test('does not mistake percentages or count strings for currency', () => {
  assert.equal(formatFinancialMetric('85%'), '85%');
  assert.equal(formatFinancialMetric('17 students'), '17 students');
});
test('does not display invalid missing figures as money', () => {
  assert.equal(formatFinancialMetric(undefined), '—');
  assert.equal(formatFinancialMetric(NaN), '—');
  assert.equal(formatFinancialMetric(''), '—');
});
