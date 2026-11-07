import { useEffect, useState } from 'react';
import { X, Wallet, AlertCircle } from 'lucide-react';
import '../../../design-system/fee-registration.css';

export default function CreateFeeModal({ open, onClose, terms, classes, selectedTerm, saving, onSave }) {
  const [term, setTerm] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTerm(String(selectedTerm || terms?.[0]?.id || ''));
      setClassLevel('');
      setAmount('');
      setError('');
    }
  }, [open, selectedTerm, terms]);

  if (!open) return null;

  async function submit(event) {
    event.preventDefault();
    const parsed = Number(amount);
    if (!term || !classLevel) return setError('Select an academic term and a class.');
    if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
      return setError('Enter a valid whole-number amount greater than zero.');
    }
    setError('');
    try { await onSave({ term: Number(term), class_level: Number(classLevel), amount: parsed }); }
    catch (err) { setError(err.message || 'Could not create this fee.'); }
  }

  return (
    <div className="bpf-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="bpf-title" className="bpf-dialog">
        <div className="bpf-header">
          <div><span className="bpf-eyebrow">SCHOOL FINANCE</span><h2 id="bpf-title">Define a fee structure</h2><p>Set tuition for a class in an academic term.</p></div>
          <button type="button" className="bpf-close" aria-label="Close" onClick={onClose} disabled={saving}><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="bpf-body">
          <label htmlFor="bpf-term">Academic term <span>*</span></label>
          <select id="bpf-term" value={term} onChange={e => setTerm(e.target.value)} required disabled={saving}>
            <option value="">Choose term</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <label htmlFor="bpf-class">Academic class <span>*</span></label>
          <select id="bpf-class" value={classLevel} onChange={e => setClassLevel(e.target.value)} required disabled={saving}>
            <option value="">Choose class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {classes.length === 0 && <p className="bpf-hint">No classes exist yet. Create a class from the student registration form or School Setup first.</p>}
          <label htmlFor="bpf-amount">Term fee (UGX) <span>*</span></label>
          <div className="bpf-amount"><span>UGX</span><input id="bpf-amount" type="number" inputMode="numeric" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)} required disabled={saving} aria-describedby="bpf-amount-note"/></div>
          <p className="bpf-hint" id="bpf-amount-note">This amount applies to students assigned to the selected class and term, according to the school's billing rules.</p>
          {error && <p role="alert" className="bpf-error"><AlertCircle size={17}/>{error}</p>}
          <div className="bpf-footer"><button className="bpf-cancel" type="button" onClick={onClose} disabled={saving}>Cancel</button><button className="bpf-save" type="submit" disabled={saving || !term || !classLevel || !amount}><Wallet size={17}/>{saving ? 'Saving…' : 'Save fee structure'}</button></div>
        </form>
      </section>
    </div>
  );
}
