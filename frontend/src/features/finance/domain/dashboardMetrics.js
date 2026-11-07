// Presentation adapter for the existing dashboard API response.
// Missing data is shown as unavailable rather than invented.
export function normalizeDashboardMetrics(data) {
  if (!data) return null;
  const count = (v) => {
    const n = Number(v);
    return v === null || v === undefined || v === '' || !Number.isFinite(n) || n < 0 ? null : Math.floor(n);
  };
  const amount = (v) => {
    const n = Number(v);
    return v === null || v === undefined || v === '' || !Number.isFinite(n) ? null : n;
  };
  const total = count(data.total_students);
  const paid = count(data.students_paid ?? data.students_with_payments);
  const unpaid = count(data.students_unpaid ?? data.students_without_payments) ?? (total !== null && paid !== null ? Math.max(0, total - paid) : null);
  const collected = amount(data.total_collected);
  const avg = amount(data.average_payment_per_student) ?? (collected !== null && paid !== null ? (paid ? collected / paid : 0) : null);
  return {
    ...data,
    total_students: total,
    students_paid: paid,
    students_unpaid: unpaid,
    total_expected: amount(data.total_expected),
    total_collected: collected,
    total_outstanding: amount(data.total_outstanding),
    average_payment_per_student: avg,
    collection_rate_percent: amount(data.collection_rate_percent),
  };
}
