import { useState } from 'react';
import { FileText, Download, RefreshCcw, CircleAlert, CalendarDays, ShieldCheck } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';

const catalog = [
  ['collection-summary','Collection summary','Verified collections and receipts for the selected term'],
  ['student-statements','Student statements','Individual student payment and balance statements'],
  ['payment-transactions','Payment transactions','Recorded payment and receipt history'],
  ['collection-analytics','Collection analytics','Collection patterns and trends'],
  ['outstanding-fees','Outstanding fees','Students with unpaid balances'],
  ['budget-vs-actual','Budget versus actual','Comparison of expected and recorded collections'],
];
const extensionFromType = (type) => type.includes('pdf')?'pdf':type.includes('csv')?'csv':type.includes('spreadsheet')?'xlsx':null;
const isSupportedResponse = (type) => extensionFromType(type) !== null;
export default function Reports() {
  const {terms, selectedTerm, setSelectedTerm} = useDashboard();
  const [busy,setBusy] = useState('');
  const [feedback,setFeedback] = useState(null);
  const [startDate,setStartDate] = useState('');
  const [endDate,setEndDate] = useState('');
  async function downloadReport(id) {
    if (startDate && endDate && startDate>endDate) {setFeedback({error:true,message:'End date cannot be before start date.'});return;}
    setBusy(id);setFeedback(null);
    try {
      const response=await api.get(`/reports/${id.replace(/-/g,'_')}/`,{params:{term:selectedTerm||'',...(startDate?{start_date:startDate}:{}),...(endDate?{end_date:endDate}:{})},responseType:'blob'});
      const contentType=(response.headers?.['content-type']||response.data?.type||'').toLowerCase();
      if(!isSupportedResponse(contentType)) throw new Error('Unsupported report response');
      const filename=`${id}-${new Date().toISOString().slice(0,10)}.${extensionFromType(contentType)}`;
      const blob=new Blob([response.data],{type:contentType});const url=URL.createObjectURL(blob);
      const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
      setFeedback({error:false,message:`${filename} downloaded.`});
    }catch {setFeedback({error:true,message:'The report could not be generated. Check availability and your permissions; no file was downloaded.'});}
    finally {setBusy('');}
  }
  return <DashboardLayout><main className="mx-auto max-w-7xl space-y-6 pb-12 text-slate-900">
    <header><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Financial intelligence</p><h1 className="mt-1 text-3xl font-extrabold">Reports & exports</h1><p className="mt-2 text-sm text-slate-600">Prepare term-scoped reports from your school's authorized records.</p></header>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 font-bold"><CalendarDays size={19} className="text-emerald-700"/> Report filters</div><div className="grid gap-4 md:grid-cols-3"><label className="text-sm font-semibold">Academic term<select value={selectedTerm||''} onChange={e=>setSelectedTerm(e.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900"><option value="">Current active term</option>{(Array.isArray(terms)?terms:[]).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label className="text-sm font-semibold">Start date<input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3"/></label><label className="text-sm font-semibold">End date<input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3"/></label></div><p className="mt-3 text-xs text-slate-500">Date filters are sent to the report endpoint; support for each report must be confirmed by the backend.</p></section>
    {feedback&&<div role={feedback.error?'alert':'status'} className={`rounded-xl border p-4 text-sm ${feedback.error?'border-red-200 bg-red-50 text-red-900':'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{feedback.error?<CircleAlert size={16} className="mr-2 inline"/>:<ShieldCheck size={16} className="mr-2 inline"/>}{feedback.message}</div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{catalog.map(([id,title,description])=><section key={id} className="flex min-h-56 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><FileText size={22}/></div><h2 className="text-lg font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p></div><button type="button" disabled={!!busy} onClick={()=>downloadReport(id)} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Download size={16}/>{busy===id?'Generating…':'Generate report'}</button></section>)}</div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 font-bold"><ShieldCheck size={19} className="text-emerald-700"/> Data integrity and exports</div><p className="mt-2 text-sm leading-relaxed text-slate-600">Only server-generated PDF, CSV, or spreadsheet responses are downloaded. Unsupported or error responses are rejected rather than saved with a misleading PDF extension. Scheduled and universal one-click exports are not offered until real backend integrations are verified.</p></section>
  </main></DashboardLayout>;
}
