import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, BookOpen, CalendarDays, CheckCircle2, CircleAlert, CreditCard, FileBarChart2, RefreshCcw, ShieldCheck, Users } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const money = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0
  ? `UGX ${value.toLocaleString('en-UG', { maximumFractionDigits: 2 })}` : 'Not available';
const number = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value.toLocaleString() : 'Not available';
const rate = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? `${value.toFixed(1)}%` : 'Not available';
const extractTerms = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : null;
const Panel = ({title, children}) => <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-base font-bold text-slate-900">{title}</h2>{children}</section>;

export default function HeadmasterDashboard() {
  const navigate = useNavigate();
  const [terms, setTerms] = useState([]);
  const [termId, setTermId] = useState('');
  const [termsState, setTermsState] = useState('loading');
  const [state, setState] = useState('idle');
  const [data, setData] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setTermsState('loading');
    api.get('/terms/').then(res => {
      if (!active) return;
      const items = extractTerms(res.data);
      if (!items) { setTermsState('error'); return; }
      setTerms(items);
      setTermId(previous => items.some(t => String(t.id) === String(previous)) ? previous : String(items[0]?.id ?? ''));
      setTermsState('ready');
    }).catch(() => { if (active) setTermsState('error'); });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (termsState !== 'ready' || !termId) { setData(null); setState('idle'); return; }
    let active = true;
    setState('loading'); setData(null);
    api.get('/headmaster-dashboard/', { params: { term_id: termId } }).then(res => {
      if (!active) return;
      if (!res.data || typeof res.data !== 'object' || Array.isArray(res.data)) { setState('error'); return; }
      setData(res.data); setState('ready');
    }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [termId, termsState, retry]);

  const cards = [
    {title:'Schools in scope', value:number(data?.number_of_schools), icon:BookOpen},
    {title:'Collection rate', value:rate(data?.overall_collection_rate === undefined || data?.overall_collection_rate === null ? NaN : Number(data.overall_collection_rate)), icon:Activity},
    {title:'Recorded collections', value:money(data?.total_collected === undefined || data?.total_collected === null ? NaN : Number(data.total_collected)), icon:CreditCard},
    {title:'Outstanding student accounts', value:Array.isArray(data?.unpaid_students) ? number(data.unpaid_students.length) : 'Not available', icon:Users},
  ];
  // Do not render figures when the server request failed or supplied no matching term.
  return <DashboardLayout><main className="mx-auto max-w-7xl space-y-6 pb-12 text-slate-900">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-700">School leadership / financial oversight</p><h1 className="text-3xl font-extrabold tracking-tight">Headmaster overview</h1><p className="mt-2 text-sm text-slate-600">{data?.school?.name || 'School-specific financial and operational reporting'}</p></div>
      <div className="flex gap-2"><button type="button" onClick={()=>navigate('/reports')} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Reports</button><button type="button" onClick={()=>setRetry(v=>v+1)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"><RefreshCcw size={16}/> Refresh</button></div>
    </header>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><label htmlFor="headmaster-term" className="mb-2 block text-sm font-semibold">Reporting term</label><select id="headmaster-term" value={termId} onChange={e=>setTermId(e.target.value)} disabled={termsState!=='ready'||terms.length===0} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 md:max-w-md">{terms.length===0?<option value="">No term selected</option>:terms.map(t=><option key={t.id} value={t.id}>{t.name || `Term ${t.id}`}</option>)}</select></div>
    {termsState==='loading' && <div role="status" className="rounded-xl bg-white p-6 text-slate-600">Loading school terms…</div>}
    {termsState==='error' && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900"><span>Unable to load school terms. This is not the same as having no terms configured.</span><button onClick={()=>setRetry(v=>v+1)} className="rounded-lg bg-white px-4 py-2 font-semibold">Retry</button></div>}
    {termsState==='ready' && terms.length===0 && <Panel title="No academic terms are available"><p className="text-sm text-slate-600">This school currently has no accessible academic terms. Ask an authorized school administrator to confirm setup and permissions.</p><button onClick={()=>navigate('/reports')} className="mt-4 text-sm font-semibold text-emerald-800">Open reports <ArrowRight className="inline" size={14}/></button></Panel>}
    {termsState==='ready' && terms.length>0 && state==='loading' && <p role="status" className="rounded-xl border border-slate-200 bg-white p-6">Loading verified Headmaster metrics…</p>}
    {termsState==='ready' && terms.length>0 && state==='error' && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900"><CircleAlert className="mr-2 inline" size={19}/>Financial summary could not be loaded for the selected term. No figures have been shown as verified.<button onClick={()=>setRetry(v=>v+1)} className="ml-3 underline">Retry</button></div>}
    {termsState==='ready' && state==='ready' && data && <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({title,value,icon:Icon})=><section key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span><Icon size={19} className="text-emerald-700"/></div><p className="text-2xl font-extrabold text-slate-900">{value}</p></section>)}</div>
      <div className="grid gap-5 lg:grid-cols-2"><Panel title="School performance"><div className="space-y-3">{Array.isArray(data.schools) && data.schools.length ? data.schools.map((school,i)=><div key={school.id??i} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-800">{school.name||'School'}</span><span className="text-sm text-emerald-800">{rate(school.collection_rate_percent == null ? NaN : Number(school.collection_rate_percent))}</span></div>):<p className="text-sm text-slate-600">No school performance breakdown was returned for this term.</p>}</div></Panel><Panel title="Leadership priorities"><div className="space-y-3"><button onClick={()=>navigate('/reports')} className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left font-semibold">Review financial reports <FileBarChart2 size={18}/></button><button onClick={()=>navigate('/audit-logs')} className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left font-semibold">Review audit activity <ShieldCheck size={18}/></button><div className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 size={18} className="shrink-0"/>Oversight is read-only. Payment posting and reversal execution remain restricted.</div></div></Panel></div>
      <Panel title="Recent recorded payments">{Array.isArray(data.recent_payments)&&data.recent_payments.length?<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-600"><th className="py-3">Reference</th><th>Student</th><th>Amount</th></tr></thead><tbody>{data.recent_payments.slice(0,10).map((p,i)=><tr key={p.id??i} className="border-b"><td className="py-3">{p.receipt_number||p.reference||'—'}</td><td>{p.student_name||p.student||'—'}</td><td>{typeof p.amount==='number'?money(p.amount):String(p.amount??'—')}</td></tr>)}</tbody></table></div>:<p className="text-sm text-slate-600">No recent payments were returned by the Headmaster summary for this term.</p>}</Panel>
    </>}
  </main></DashboardLayout>;
}
