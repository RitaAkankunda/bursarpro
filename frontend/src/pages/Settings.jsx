 import { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, CheckCircle2, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('terms');
  const [school, setSchool] = useState(null);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [termForm, setTermForm] = useState({ name: '', start_date: '', end_date: '' });
  const [classForm, setClassForm] = useState({ name: '' });
  const [feeForm, setFeeForm] = useState({ term: '', class_level: '', amount: '' });
  const [submitting, setSubmitting] = useState(false);

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

  const handleDeleteTerm = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/terms/${id}/`);
        setTerms(terms.filter(t => t.id !== id));
        setSuccess('Term deleted');
        setTimeout(() => setSuccess(''), 2000);
      } catch (err) {
        setError('Failed to delete term');
      }
    }
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/class-levels/${id}/`);
        setClasses(classes.filter(c => c.id !== id));
        setSuccess('Class deleted');
        setTimeout(() => setSuccess(''), 2000);
      } catch (err) {
        setError('Failed to delete class');
      }
    }
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
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Start Date</label>
                  <input
                    type="date"
                    value={termForm.start_date}
                    onChange={(e) => setTermForm({ ...termForm, start_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">End Date</label>
                  <input
                    type="date"
                    value={termForm.end_date}
                    onChange={(e) => setTermForm({ ...termForm, end_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
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
                    className="backdrop-blur-md bg-white/60 shadow-lg p-6 rounded-2xl border border-gray-200 flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-bold text-gray-800">{term.name}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(term.start_date).toLocaleDateString()} → {new Date(term.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTerm(term.id)}
                      className="p-2 hover:bg-accent/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} className="text-accent" />
                    </button>
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
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
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
                    className="backdrop-blur-md bg-white/60 shadow-lg p-6 rounded-2xl border border-gray-200 flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-bold text-gray-800">{cls.name}</p>
                      <p className="text-xs text-gray-600">{cls.school_name}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="p-2 hover:bg-accent/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} className="text-accent" />
                    </button>
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
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none bg-gray-50 cursor-pointer text-gray-800 pr-10"
                    >
                      <option value="" className="bg-white text-gray-800 text-gray-800">Select a term</option>
                      {terms.map(term => (
                        <option key={term.id} value={term.id} className="bg-white text-gray-800 text-gray-800">{term.name}</option>
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
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none bg-gray-50 cursor-pointer text-gray-800 pr-10"
                    >
                      <option value="" className="bg-white text-gray-800 text-gray-800">Select a class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id} className="bg-white text-gray-800 text-gray-800">{cls.name}</option>
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
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
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
    </DashboardLayout>
  );
};

export default Settings;
