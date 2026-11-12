import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { normalizeTermId, normalizeRecordedCollections, formatRecordedAmount } from './recordedCollectionsD6D6.mjs';
import { classifyRecordedCollectionsError, showRecordedCollectionsValues } from './recordedCollectionsD6D8.mjs';

/** Read-only recorded payments; not tuition billed, outstanding, or bank-settled. */
export default function RecordedCollectionsPanel({ termId }) {
  let selectedTerm = null;
  try {
    if (termId !== undefined && termId !== null && String(termId).trim() !== '') {
      selectedTerm = normalizeTermId(termId);
    }
  } catch (_) {
    // Fail closed. Do not send malformed term identifiers to the server.
  }
  const query = useQuery({
    queryKey: ['recorded-collections-D6D6', selectedTerm],
    enabled: selectedTerm !== null,
    staleTime: 60_000,
    retry: false,
    queryFn: async ({ signal }) => {
      const response = await api.get('/financial-dashboard/recorded/', {
        params: { term_id: selectedTerm }, signal,
      });
      return normalizeRecordedCollections(response.data, selectedTerm);
    },
  });
  const hasTermValue = termId !== undefined && termId !== null && String(termId).trim() !== '';
  const invalidTerm = hasTermValue && selectedTerm === null;
  const busy = selectedTerm !== null && query.isFetching;
  const showValues = showRecordedCollectionsValues({ validTerm: selectedTerm !== null, isSuccess: query.isSuccess, isError: query.isError, isPlaceholderData: query.isPlaceholderData });
  const errorMessage = query.isError ? classifyRecordedCollectionsError(query.error) : null;

  return (
    <section aria-label="Verified recorded collections" aria-busy={busy} className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-emerald-950">Verified recorded collections</h2>
          <p className="mt-1 text-xs font-medium text-emerald-800">Read-only · {selectedTerm === null ? 'No valid term selected' : `Selected term #${selectedTerm}`}</p>
        </div>
        {selectedTerm !== null ? (
          <button type="button" onClick={() => query.refetch()} disabled={busy}
            className="rounded-lg border border-emerald-700 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? 'Refreshing…' : 'Refresh collections'}
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-slate-600">Recorded payments less executed reversals. This is not tuition billed, outstanding balances, or confirmed bank settlement.</p>
      {!hasTermValue ? <p role="status" className="mt-4 text-sm text-slate-600">Select a term to view recorded collections.</p> : null}
      {invalidTerm ? <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Invalid term selection. Choose a valid school term.</p> : null}
      {selectedTerm !== null && query.isPending ? <p role="status" className="mt-4 text-sm text-slate-600">Loading recorded collections…</p> : null}
      {selectedTerm !== null && errorMessage ? (
        <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {errorMessage}
          <button type="button" className="ml-2 underline font-semibold" onClick={() => query.refetch()} disabled={busy}>Retry report</button>
        </p>
      ) : null}
      {showValues ? (
        <>
          {busy ? <p role="status" className="mt-3 text-xs text-slate-600">Refreshing the selected term…</p> : null}
          <div aria-label="Validated recorded collections totals" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Gross recorded', query.data.gross],
              ['Executed reversals', query.data.reversed],
              ['Net recorded', query.data.net],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs font-semibold text-emerald-900">{label}</p>
                <p className="mt-2 text-lg font-bold text-emerald-950">{formatRecordedAmount(value)}</p>
              </div>
            ))}
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-800">Payment records</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{query.data.count.toLocaleString('en-UG')}</p>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
