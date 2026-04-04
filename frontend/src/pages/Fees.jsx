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
  ArrowRight,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  Copy,
  CheckCircle,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import BulkImportModal from '../components/BulkImportModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const FeeCard = ({ fee, delay, onEdit, onDelete, isEditing, editedAmount, onAmountChange, onSave, onCancel }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    className="backdrop-blur-md bg-white/60 shadow-lg p-10 space-y-8 group relative overflow-hidden rounded-2xl border border-white/40"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="flex items-start justify-between relative z-10">
      <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner ring-1 ring-blue-200">
        <School size={28} />
      </div>
      <div className="text-right space-y-1">
        <p className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em]">{fee.term_name}</p>
        <h3 className="text-2xl font-black text-gray-800 group-hover:text-blue-600 transition-colors">{fee.class_level_name}</h3>
      </div>
    </div>

    <div className="space-y-3 relative z-10">
      <p className="text-[10px] uppercase font-bold text-gray-600 tracking-widest flex items-center gap-2">
        <Tag size={12} className="text-blue-600" />
        Full Term Tuition
      </p>
      {isEditing ? (
        <div className="flex gap-2">
          <input 
            type="number"
            value={editedAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={onSave}
            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            title="Save"
          >
            <CheckCircle size={18} />
          </button>
          <button 
            onClick={onCancel}
            className="p-2 bg-gray-300 hover:bg-gray-400 text-white rounded-lg transition-colors"
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-gray-800">UGX {fee.amount.toLocaleString()}</span>
          <span className="text-xs text-gray-600 font-bold uppercase tracking-tighter">/ Term</span>
        </div>
      )}
    </div>

    <div className="pt-6 border-t border-gray-200 flex items-center justify-between relative z-10">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Active Listing</span>
      </div>
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(fee)}
          disabled={isEditing}
          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
          title="Edit"
        >
          <Edit2 size={18} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(fee.id)}
          disabled={isEditing}
          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
          title="Delete"
        >
          <Trash2 size={18} />
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const Fees = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [terms, setTerms] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedAmount, setEditedAmount] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const queryClient = useQueryClient();

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
      toast.error('Failed to load terms');
    }
  };

  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fee-structures/?term_id=${selectedTerm}`);
      setFeeStructures(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  // Update fee mutation
  const updateFeeMutation = useMutation({
    mutationFn: (data) => api.patch(`/fee-structures/${data.id}/`, { amount: data.amount }),
    onSuccess: (res) => {
      setFeeStructures(prev => prev.map(f => f.id === res.data.id ? res.data : f));
      toast.success('Fee updated successfully');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update fee');
    }
  });

  // Delete fee mutation
  const deleteFeeMutation = useMutation({
    mutationFn: (id) => api.delete(`/fee-structures/${id}/`),
    onSuccess: (res, id) => {
      setFeeStructures(prev => prev.filter(f => f.id !== id));
      toast.success('Fee deleted successfully');
      setShowDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete fee');
    }
  });

  const handleEdit = (fee) => {
    setEditingId(fee.id);
    setEditedAmount(fee.amount.toString());
  };

  const handleSave = () => {
    if (!editedAmount || isNaN(editedAmount) || parseFloat(editedAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    updateFeeMutation.mutate({ id: editingId, amount: parseFloat(editedAmount) });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedAmount('');
  };

  const handleDelete = (id) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    deleteFeeMutation.mutate(showDeleteConfirm);
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-gray-800">Academic Fees</h1>
            <p className="text-gray-600 font-medium">Define and manage tuition costs per class level and academic term.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBulkImport(true)}
              className="flex items-center gap-2 px-6 py-4 bg-amber-50 border border-amber-200 shadow-sm hover:shadow-md hover:bg-amber-100 text-amber-700 font-bold rounded-2xl transition-all whitespace-nowrap"
            >
              <Upload size={20} />
              Bulk Import
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl transition-all shadow-2xl active:scale-95 whitespace-nowrap"
            >
              <Plus size={20} />
              Define New Fee
            </motion.button>
          </div>
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
            <div className="col-span-full backdrop-blur-md bg-white/60 shadow-lg p-20 text-center space-y-4 rounded-2xl border border-white/40">
               <Coins size={64} className="text-gray-600 mx-auto opacity-20" strokeWidth={1} />
               <div className="space-y-1">
                 <p className="text-xl font-bold">No Fees Defined</p>
                 <p className="text-xs text-gray-600">Start by defining tuition for this term to enable student billing.</p>
               </div>
            </div>
          ) : (
            feeStructures.map((fee, idx) => (
              <FeeCard 
                key={fee.id} 
                fee={fee} 
                delay={idx * 0.1}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isEditing={editingId === fee.id}
                editedAmount={editedAmount}
                onAmountChange={setEditedAmount}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ))
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertCircle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Delete Fee Structure?</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmDelete}
                    disabled={deleteFeeMutation.isPending}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleteFeeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Import Modal */}
        <BulkImportModal 
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          type="fee-structures"
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
            setShowBulkImport(false);
            fetchFeeStructures();
            toast.success('Fee structures imported successfully!');
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default Fees;
