import { useEffect, useState } from 'react';
import { 
  Plus, 
  Coins, 
  School, 
  Layers,
  Search,
  Loader2,
  AlertCircle,
  Tag,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

const FeeCard = ({ fee, delay }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    className="backdrop-blur-md bg-white/60 shadow-lg p-10 space-y-8 group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="flex items-start justify-between">
      <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner ring-1 ring-blue-200">
        <School size={28} />
      </div>
      <div className="text-right space-y-1">
        <p className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em]">{fee.term_name}</p>
        <h3 className="text-2xl font-black text-gray-800 group-hover:text-blue-600 transition-colors">{fee.class_level_name}</h3>
      </div>
    </div>

    <div className="space-y-1">
      <p className="text-[10px] uppercase font-bold text-gray-600 tracking-widest flex items-center gap-2">
        <Tag size={12} className="text-blue-600" />
        Full Term Tuition
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-gray-800">UGX {fee.amount.toLocaleString()}</span>
        <span className="text-xs text-gray-600 font-bold uppercase tracking-tighter">/ Term</span>
      </div>
    </div>

    <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Active Listing</span>
      </div>
      <button className="text-blue-600 hover:text-gray-800 transition-colors">
        <ArrowRight size={20} />
      </button>
    </div>
  </motion.div>
);

const Fees = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTerm) {
      fetchFeeStructures();
    }
  }, [selectedTerm]);

  const fetchInitialData = async () => {
    try {
      const res = await api.get('/terms/');
      setTerms(res.data);
      if (res.data.length > 0) {
        setSelectedTerm(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fee-structures/?term_id=${selectedTerm}`);
      setFeeStructures(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-gray-800">Academic Fees</h1>
            <p className="text-gray-600 font-medium">Define and manage tuition costs per class level and academic term.</p>
          </div>
          
          <button className="flex items-center gap-3 px-8 py-4 btn-primary text-white font-bold rounded-2xl transition-all shadow-2xl active:scale-95 whitespace-nowrap">
            <Plus size={20} />
            Define New Fee
          </button>
        </header>

        <div className="flex items-center gap-4 bg-white p-1 rounded-2xl border border-gray-200 w-fit">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 min-w-[200px] relative">
            <Layers size={18} className="text-blue-600" />
            <select 
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer appearance-none pr-8 flex-1 text-gray-800"
            >
              {terms.map(t => (
                <option key={t.id} value={t.id} className="bg-white text-gray-800 text-gray-800">{t.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 text-gray-600 text-xs">▼</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">Loading Fee Structures...</p>
              </div>
            </div>
          ) : feeStructures.length === 0 ? (
            <div className="col-span-full backdrop-blur-md bg-white/60 shadow-lg p-20 text-center space-y-4">
               <Coins size={64} className="text-gray-600 mx-auto opacity-20" strokeWidth={1} />
               <div className="space-y-1">
                 <p className="text-xl font-bold">No Fees Defined</p>
                 <p className="text-xs text-gray-600">Start by defining tuition for this term to enable student billing.</p>
               </div>
            </div>
          ) : (
            feeStructures.map((fee, idx) => (
              <FeeCard key={fee.id} fee={fee} delay={idx * 0.1} />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Fees;
