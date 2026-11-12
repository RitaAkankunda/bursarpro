/** Pure assertions for manual-assisted browser verification; no server writes. */
export function assessPanel({ panelPresent, selectedTermText, totalsVisible, alerts, refreshVisible }) {
  if (!panelPresent) return { pass: false, reason: 'Verified recorded collections panel not present' };
  if (!selectedTermText) return { pass: false, reason: 'Selected term label missing' };
  if (alerts.some(x => /traceback|internal server error|exception at|secret key|password=/i.test(x))) {
    return { pass: false, reason: 'Potential internal error exposed to browser' };
  }
  if (alerts.length && totalsVisible) return { pass: false, reason: 'Unverified totals visible while report has an error' };
  if (selectedTermText.includes('Selected term #') && !refreshVisible) {
    return { pass: false, reason: 'Refresh collections button not present for selected term' };
  }
  return { pass: true, reason: 'Panel structure and fail-closed display checks passed' };
}
export function makeEvidenceFilename(step, timestamp) {
  const safe = String(step).replace(/[^a-z0-9_-]/gi, '_').slice(0, 64);
  return `${timestamp}-${safe}.png`;
}
