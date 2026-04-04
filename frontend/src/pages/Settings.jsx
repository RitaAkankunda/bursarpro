 import { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, CheckCircle2, Trash2, Edit2, AlertTriangle, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Improved Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, title, message, icon: Icon = AlertTriangle, isDangerous = false, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 20 }}
          className="backdrop-blur-md bg-white/90 shadow-2xl w-full max-w-sm p-8 rounded-2xl border border-white/20 space-y-6"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              isDangerous ? 'bg-red-100' : 'bg-blue-100'
            }`}
          >
            <Icon className={`w-8 h-8 ${isDangerous ? 'text-red-600' : 'text-blue-600'}`} />
          </motion.div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-gray-900">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Warning Badge */}
          {isDangerous && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-700">This action cannot be undone</p>
            </motion.div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelText}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                isDangerous
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-red-600/30'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-600/30'
              }`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
              {confirmText}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('terms');
  const [school, setSchool] = useState(null);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null, name: '' });

  // Edit states
  const [editingTermId, setEditingTermId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editTermData, setEditTermData] = useState({ name: '', start_date: '', end_date: '' });
  const [editClassData, setEditClassData] = useState({ name: '' });

  // Form states
  const [termForm, setTermForm] = useState({ name: '', start_date: '', end_date: '' });
  const [classForm, setClassForm] = useState({ name: '' });
  const [feeForm, setFeeForm] = useState({ term: '', class_level: '', amount: '' });
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  // Update term mutation
  const updateTermMutation = useMutation({
    mutationFn: (data) => api.patch(`/terms/${data.id}/`, { name: data.name, start_date: data.start_date, end_date: data.end_date }),
    onSuccess: (res) => {
      setTerms(prev => prev.map(t => t.id === res.data.id ? res.data : t));
      toast.success('Term updated successfully');
      setEditingTermId(null);
      queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update term');
    }
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: (data) => api.patch(`/class-levels/${data.id}/`, { name: data.name }),
    onSuccess: (res) => {
      setClasses(prev => prev.map(c => c.id === res.data.id ? res.data : c));
      toast.success('Class updated successfully');
      setEditingClassId(null);
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update class');
    }
  });

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch terms, classes, fees, and schools
      const [termsRes, classesRes, feesRes, schoolsRes] = await Promise.all([
        api.get('/terms/'),
        api.get('/class-levels/'),
        api.get('/fee-structures/'),
        api.get('/schools/'),
      ]);
      
      setTerms(termsRes.data);
      setClasses(classesRes.data);
      setFeeStructures(feesRes.data);
      
      // Set first school or create default
      if (Array.isArray(schoolsRes.data) && schoolsRes.data.length > 0) {
        setSchool(schoolsRes.data[0]);
      } else {
        // Create a default school if none exist
        try {
          const newSchool = await api.post('/schools/', { name: 'Default School' });
          setSchool(newSchool.data);
        } catch (schoolErr) {
          console.error('Could not create default school:', schoolErr);
        }
      }
      setError('');
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTerm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!school) {
        setError('No school selected. Please reload the page.');
        setSubmitting(false);
        return;
      }
      const res = await api.post('/terms/', { ...termForm, school: school.id });
      setTerms([...terms, res.data]);
      setTermForm({ name: '', start_date: '', end_date: '' });
      setSuccess('Term created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating term:', err.response?.data);
      setError(err.response?.data?.detail || err.response?.data?.school?.[0] || 'Failed to create term');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/class-levels/', { ...classForm, school: school.id });
      setClasses([...classes, res.data]);
      setClassForm({ name: '' });
      setSuccess('Class level created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFeeStructure = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/fee-structures/', feeForm);
      setFeeStructures([...feeStructures, res.data]);
      setFeeForm({ term: '', class_level: '', amount: '' });
      setSuccess('Fee structure created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create fee structure');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTerm = async (id, termName) => {
    setDeleteConfirm({ isOpen: true, type: 'term', id, name: termName });
  };

  const handleDeleteClass = async (id, className) => {
    setDeleteConfirm({ isOpen: true, type: 'class', id, name: className });
  };

  const confirmDelete = async () => {
    const { type, id } = deleteConfirm;
    try {
      if (type === 'term') {
        await api.delete(`/terms/${id}/`);
        setTerms(terms.filter(t => t.id !== id));
        setSuccess('Term deleted successfully');
      } else if (type === 'class') {
        await api.delete(`/class-levels/${id}/`);
        setClasses(classes.filter(c => c.id !== id));
        setSuccess('Class deleted successfully');
      }
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(`Failed to delete ${type}`);
      setTimeout(() => setError(''), 3000);
    }
    setDeleteConfirm({ isOpen: false, type: null, id: null, name: '' });
  };

  const handleEditTerm = (term) => {
    setEditingTermId(term.id);
    setEditTermData({ name: term.name, start_date: term.start_date, end_date: term.end_date });
  };

  const handleSaveTermEdit = () => {
    if (!editTermData.name || !editTermData.start_date || !editTermData.end_date) {
      toast.error('Please fill in all fields');
      return;
    }
    updateTermMutation.mutate({ id: editingTermId, ...editTermData });
  };

  const handleEditClass = (cls) => {
    setEditingClassId(cls.id);
    setEditClassData({ name: cls.name });
  };

  const handleSaveClassEdit = () => {
    if (!editClassData.name) {
      toast.error('Please fill in class name');
      return;
    }
    updateClassMutation.mutate({ id: editingClassId, ...editClassData });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-gray-800">School Setup</h1>
          <p className="text-gray-600 font-medium">Configure terms, classes, and fee structures</p>
        </div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-accent/10 border border-accent/20 rounded-2xl flex items-start gap-3 text-accent text-sm font-bold"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl flex items-start gap-3 text-emerald-400 text-sm font-bold"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          {['terms', 'classes', 'fees'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-bold uppercase text-xs tracking-wider transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-blue-600 border-primary'
                  : 'text-gray-600 border-transparent hover:text-gray-800'
              }`}
            >
              {tab === 'terms' ? '📅 Terms' : tab === 'classes' ? '🏛️ Classes' : '💰 Fees'}
            </button>
          ))}
        </div>

        {/* Terms Tab */}
        {activeTab === 'terms' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Term Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-md bg-white/60 shadow-lg p-8 space-y-6 rounded-3xl border border-gray-200 h-fit"
            >
              <h2 className="text-2xl font-black text-gray-800">Add New Term</h2>
              <form onSubmit={handleAddTerm} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Term Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Term 1 2026"
                    value={termForm.name}
                    onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Start Date</label>
                  <input
                    type="date"
                    value={termForm.start_date}
                    onChange={(e) => setTermForm({ ...termForm, start_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">End Date</label>
                  <input
                    type="date"
                    value={termForm.end_date}
                    onChange={(e) => setTermForm({ ...termForm, end_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700 rounded-xl font-bold text-gray-800 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin inline mr-2" size={18} /> : <Plus className="inline mr-2" size={18} />}
                  Add Term
                </button>
              </form>
            </motion.div>

            {/* Terms List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-black text-gray-800">Active Terms</h2>
              {terms.length === 0 ? (
                <div className="backdrop-blur-md bg-white/60 shadow-lg p-8 text-center text-gray-600 rounded-3xl border border-gray-200">
                  <p>No terms created yet</p>
                </div>
              ) : (
                terms.map(term => (
                  <motion.div
                    key={term.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="backdrop-blur-md bg-white/60 shadow-lg p-6 rounded-2xl border border-gray-200 space-y-3 group"
                  >
                    {editingTermId === term.id ? (
                      <div className="space-y-3">
                        <input 
                          type="text"
                          value={editTermData.name}
                          onChange={(e) => setEditTermData({ ...editTermData, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Term name"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="date"
                            value={editTermData.start_date}
                            onChange={(e) => setEditTermData({ ...editTermData, start_date: e.target.value })}
                            className="px-3 py-2 bg-white border border-blue-300 rounded-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <input 
                            type="date"
                            value={editTermData.end_date}
                            onChange={(e) => setEditTermData({ ...editTermData, end_date: e.target.value })}
                            className="px-3 py-2 bg-white border border-blue-300 rounded-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleSaveTermEdit}
                            disabled={updateTermMutation.isPending}
                            className="flex-1 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1 font-bold text-sm"
                          >
                            <Save size={16} />
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingTermId(null)}
                            className="flex-1 p-2 bg-gray-300 hover:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-1 font-bold text-sm"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="font-bold text-gray-800">{term.name}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(term.start_date).toLocaleDateString()} → {new Date(term.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditTerm(term)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors flex-1"
                            title="Edit"
                          >
                            <Edit2 size={16} className="mx-auto" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteTerm(term.id, term.name)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex-1"
                            title="Delete"
                          >
                            <Trash2 size={16} className="mx-auto" />
                          </motion.button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Class Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-md bg-white/60 shadow-lg p-8 space-y-6 rounded-3xl border border-gray-200 h-fit"
            >
              <h2 className="text-2xl font-black text-gray-800">Add New Class</h2>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Class Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Primary 1, Senior 4"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700 rounded-xl font-bold text-gray-800 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin inline mr-2" size={18} /> : <Plus className="inline mr-2" size={18} />}
                  Add Class
                </button>
              </form>
            </motion.div>

            {/* Classes List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-black text-gray-800">Class Levels</h2>
              {classes.length === 0 ? (
                <div className="backdrop-blur-md bg-white/60 shadow-lg p-8 text-center text-gray-600 rounded-3xl border border-gray-200">
                  <p>No classes created yet</p>
                </div>
              ) : (
                classes.map(cls => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="backdrop-blur-md bg-white/60 shadow-lg p-6 rounded-2xl border border-gray-200 space-y-3 group"
                  >
                    {editingClassId === cls.id ? (
                      <div className="space-y-3">
                        <input 
                          type="text"
                          value={editClassData.name}
                          onChange={(e) => setEditClassData({ name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Class name"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={handleSaveClassEdit}
                            disabled={updateClassMutation.isPending}
                            className="flex-1 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1 font-bold text-sm"
                          >
                            <Save size={16} />
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingClassId(null)}
                            className="flex-1 p-2 bg-gray-300 hover:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-1 font-bold text-sm"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="font-bold text-gray-800">{cls.name}</p>
                          <p className="text-xs text-gray-600">{cls.school_name}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditClass(cls)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors flex-1"
                            title="Edit"
                          >
                            <Edit2 size={16} className="mx-auto" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteClass(cls.id, cls.name)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex-1"
                            title="Delete"
                          >
                            <Trash2 size={16} className="mx-auto" />
                          </motion.button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Fee Structure Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-md bg-white/60 shadow-lg p-8 space-y-6 rounded-3xl border border-gray-200 h-fit"
            >
              <h2 className="text-2xl font-black text-gray-800">Add Fee Structure</h2>
              <form onSubmit={handleAddFeeStructure} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Term</label>
                  <div className="relative">
                    <select
                      value={feeForm.term}
                      onChange={(e) => setFeeForm({ ...feeForm, term: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer pr-10 font-medium"
                    >
                      <option value="">Select a term</option>
                      {terms.map(term => (
                        <option key={term.id} value={term.id}>{term.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-3 text-gray-600">
                      ▼
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Class Level</label>
                  <div className="relative">
                    <select
                      value={feeForm.class_level}
                      onChange={(e) => setFeeForm({ ...feeForm, class_level: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer pr-10 font-medium"
                    >
                      <option value="">Select a class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-3 text-gray-600">
                      ▼
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Amount (UGX)</label>
                  <input
                    type="number"
                    placeholder="e.g., 500000"
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700 rounded-xl font-bold text-gray-800 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin inline mr-2" size={18} /> : <Plus className="inline mr-2" size={18} />}
                  Add Fee Structure
                </button>
              </form>
            </motion.div>

            {/* Fee Structures List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-black text-gray-800">Fee Structures</h2>
              {feeStructures.length === 0 ? (
                <div className="backdrop-blur-md bg-white/60 shadow-lg p-8 text-center text-gray-600 rounded-3xl border border-gray-200">
                  <p>No fee structures created yet</p>
                </div>
              ) : (
                feeStructures.map(fee => (
                  <motion.div
                    key={fee.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="backdrop-blur-md bg-white/60 shadow-lg p-6 rounded-2xl border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-800">{fee.class_level_name}</p>
                        <p className="text-xs text-gray-600">{fee.term_name}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-black text-blue-600">UGX {parseInt(fee.amount).toLocaleString()}</p>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.type === 'term' ? 'Delete Term?' : 'Delete Class?'}
        message={deleteConfirm.type === 'term' 
          ? `Are you sure you want to delete "${deleteConfirm.name}"? All associated fee structures and student data will be affected.` 
          : `Are you sure you want to delete "${deleteConfirm.name}"? All associated fee structures will be deleted.`
        }
        icon={Trash2}
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: null, id: null, name: '' })}
        confirmText={`Delete ${deleteConfirm.type === 'term' ? 'Term' : 'Class'}`}
        cancelText="Cancel"
        isLoading={false}
      />
    </DashboardLayout>
  );
};

export default Settings;
