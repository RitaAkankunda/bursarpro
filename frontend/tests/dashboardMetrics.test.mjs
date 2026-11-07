import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDashboardMetrics } from '../src/features/finance/domain/dashboardMetrics.js';

test('normalizes legacy backend count names', () => {
  const value = normalizeDashboardMetrics({ total_students: 18, students_with_payments: 3, students_without_payments: 15, total_collected: 600000 });
  assert.equal(value.students_paid, 3);
  assert.equal(value.students_unpaid, 15);
  assert.equal(value.average_payment_per_student, 200000);
});
test('missing counts stay unavailable', () => {
  const value = normalizeDashboardMetrics({ total_collected: 0 });
  assert.equal(value.students_paid, null);
  assert.equal(value.students_unpaid, null);
});
test('zero paid students returns zero average when totals are known', () => {
  const value = normalizeDashboardMetrics({ students_paid: 0, total_collected: 0, total_students: 0 });
  assert.equal(value.average_payment_per_student, 0);
  assert.equal(value.students_unpaid, 0);
});
test('null input does not create fabricated metrics', () => {
  assert.equal(normalizeDashboardMetrics(null), null);
});
