/** Pure, read-only UX rules. No balances or amounts are derived here. */
export function showRecordedCollectionsValues({ validTerm, isSuccess, isError, isPlaceholderData }) {
  return validTerm === true && isSuccess === true && isError !== true && isPlaceholderData !== true;
}

/** Return generic public-facing feedback; do not expose server response bodies. */
export function classifyRecordedCollectionsError(error) {
  const status = error?.response?.status;
  if (status === 401 || status === 403) {
    return 'Access to recorded collections is restricted. Sign in with an authorized bursar or headmaster account.';
  }
  if (status === 404) return 'The recorded collections report is unavailable for the selected term.';
  if (status === 409 || status === 422) return 'The report could not pass its financial consistency checks. No figures are shown.';
  return 'Recorded collections could not be verified. No figures are shown. You can retry the report.';
}
