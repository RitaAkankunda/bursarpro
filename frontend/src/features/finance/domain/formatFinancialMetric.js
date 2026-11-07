/** Display-only formatting; financial calculation remains server-side. */
export function formatFinancialMetric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `UGX ${new Intl.NumberFormat('en-UG', { maximumFractionDigits: 2 }).format(value)}`;
  }
  if (typeof value === 'string' && value.trim()) return value;
  return '—';
}
