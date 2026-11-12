// Pure read-model adapter. Recorded collections are NOT billed tuition or bank settlement.
export function normalizeTermId(termId) {
  const text = String(termId ?? '').trim();
  if (!/^[1-9][0-9]{0,11}$/.test(text)) throw new Error('Invalid selected term');
  const value = Number(text);
  if (!Number.isSafeInteger(value)) throw new Error('Invalid selected term');
  return value;
}

export function normalizeRecordedCollections(payload, expectedTermId = null) {
  if (!payload || payload.read_only !== true || typeof payload.scope !== 'string' || !payload.scope.trim()) {
    throw new Error('Invalid recorded collections response');
  }
  if (expectedTermId !== null) {
    const expected = normalizeTermId(expectedTermId);
    if (normalizeTermId(payload.term_id) !== expected) throw new Error('Report term does not match selected term');
    if (!Number.isSafeInteger(payload.school_id) || payload.school_id < 1) throw new Error('Invalid school scope');
  }
  const parseMoney = (value) => {
    if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Missing amount');
    const text = String(value).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Invalid amount');
    const n = Number(text);
    if (!Number.isFinite(n) || n < 0 || !Number.isSafeInteger(Math.round(n * 100))) throw new Error('Invalid amount');
    return n;
  };
  const gross = parseMoney(payload.gross_recorded);
  const reversed = parseMoney(payload.reversed_recorded);
  const net = parseMoney(payload.net_recorded);
  if (reversed > gross || Math.abs((gross - reversed) - net) > 0.011) throw new Error('Inconsistent recorded collections');
  const count = Number(payload.payment_count);
  if (!Number.isSafeInteger(count) || count < 0 || typeof payload.payment_count === 'boolean') throw new Error('Invalid payment count');
  return { gross, reversed, net, count };
}
export function formatRecordedAmount(amount) {
  return new Intl.NumberFormat('en-UG', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(amount);
}
