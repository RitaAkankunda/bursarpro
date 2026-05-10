import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = `${API_URL}/api/v1`;

const Reconciliation = () => {
  const [activeTab, setActiveTab] = useState('statements');
  const [bankStatements, setBankStatements] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);

  const [uploadingStatement, setUploadingStatement] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);

  const statementStatuses = [
    { value: 'PENDING', label: 'Pending Review', color: 'bg-yellow-500/10 text-yellow-500' },
    { value: 'PROCESSING', label: 'Processing', color: 'bg-blue-500/10 text-blue-500' },
    { value: 'RECONCILED', label: 'Fully Reconciled', color: 'bg-emerald-500/10 text-emerald-500' },
    { value: 'PARTIAL', label: 'Partially Reconciled', color: 'bg-orange-500/10 text-orange-500' },
    { value: 'FAILED', label: 'Failed', color: 'bg-red-500/10 text-red-500' },
  ];

  const severityLevels = [
    { value: 'CRITICAL', label: 'Critical', color: 'bg-red-500/10 text-red-500' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-500/10 text-orange-500' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-500' },
    { value: 'LOW', label: 'Low', color: 'bg-emerald-500/10 text-emerald-500' },
  ];

  useEffect(() => {
    const fetchStatements = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_BASE}/bank-statements/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBankStatements(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching statements:', error);
        toast.error('Failed to load bank statements');
      }
    };

    if (activeTab === 'statements') {
      fetchStatements();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchReconciliations = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const url = filterStatus === 'unmatched'
          ? `${API_BASE}/payment-reconciliations/unmatched/`
          : filterStatus === 'disputed'
            ? `${API_BASE}/payment-reconciliations/disputed/`
            : `${API_BASE}/payment-reconciliations/`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReconciliations(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching reconciliations:', error);
        toast.error('Failed to load reconciliations');
      }
    };

    if (activeTab === 'reconciliations') {
      fetchReconciliations();
    }
  }, [activeTab, filterStatus]);

  useEffect(() => {
    const fetchDiscrepancies = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const url = filterSeverity === 'all'
          ? `${API_BASE}/reconciliation-discrepancies/unresolved/`
          : `${API_BASE}/reconciliation-discrepancies/by_severity/?severity=${filterSeverity}`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDiscrepancies(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching discrepancies:', error);
        toast.error('Failed to load discrepancies');
      }
    };

    if (activeTab === 'discrepancies') {
      fetchDiscrepancies();
    }
  }, [activeTab, filterSeverity]);

  const handleStatementUpload = async (file) => {
    if (!file) return;

    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setUploadingStatement(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('statement_date', new Date().toISOString().split('T')[0]);
      formData.append('file_name', file.name);

      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE}/bank-statements/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setBankStatements([response.data, ...bankStatements]);
      setShowStatementModal(false);
      toast.success('Bank statement uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload statement');
    } finally {
      setUploadingStatement(false);
    }
  };

  const processStatement = async (statementId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE}/bank-statements/${statementId}/process/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBankStatements(bankStatements.map((s) => (s.id === statementId ? response.data : s)));
      toast.success('Statement processing started');
    } catch (error) {
      console.error('Error processing statement:', error);
      toast.error('Failed to process statement');
    }
  };

  const handleMatchPayment = async (reconciliationId, paymentId, confidence) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE}/payment-reconciliations/${reconciliationId}/match_payment/`, {
        payment_id: paymentId,
        confidence_score: confidence,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReconciliations(reconciliations.map((r) => (r.id === reconciliationId ? response.data : r)));
      setShowMatchModal(false);
      setSelectedReconciliation(null);
      toast.success('Payment matched successfully');
    } catch (error) {
      console.error('Error matching payment:', error);
      toast.error('Failed to match payment');
    }
  };

  const resolveDiscrepancy = async (discrepancyId, notes) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE}/reconciliation-discrepancies/${discrepancyId}/resolve/`, {
        resolution_notes: notes,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDiscrepancies(discrepancies.map((d) => (d.id === discrepancyId ? response.data : d)));
      toast.success('Discrepancy resolved');
    } catch (error) {
      console.error('Error resolving discrepancy:', error);
      toast.error('Failed to resolve discrepancy');
    }
  };

  const renderStatementsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Bank Statements</h2>
        <button
          onClick={() => setShowStatementModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition font-bold"
        >
          <Upload size={20} />
          Upload Statement
        </button>
      </div>

      {bankStatements.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
          <Upload size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">No bank statements uploaded yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bankStatements.map((statement) => {
            const statusObj = statementStatuses.find((s) => s.value === statement.status);
            return (
              <div key={statement.id} className="backdrop-blur-md bg-white/5 p-4 rounded-xl shadow border border-white/10 hover:bg-white/10 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{statement.file_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusObj?.color}`}>
                        {statusObj?.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                      <p><span className="text-gray-500 font-medium">Date:</span> {new Date(statement.statement_date).toLocaleDateString()}</p>
                      <p><span className="text-gray-500 font-medium">Amount:</span> UGX {(statement.total_amount || 0).toLocaleString()}</p>
                      <p><span className="text-gray-500 font-medium">Transactions:</span> {statement.transaction_count}</p>
                    </div>
                  </div>
                  {statement.status === 'PENDING' && (
                    <button
                      onClick={() => processStatement(statement.id)}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition ml-4 font-bold text-sm"
                    >
                      Process
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderReconciliationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Payment Reconciliations</h2>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="unmatched">Unmatched</option>
          <option value="disputed">Disputed</option>
        </select>
      </div>

      {reconciliations.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
          <Clock size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">No reconciliation records found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reconciliations.map((reconciliation) => (
            <div key={reconciliation.id} className="backdrop-blur-md bg-white/5 p-4 rounded-xl shadow border border-white/10 hover:bg-white/10 transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{reconciliation.bank_transaction_id}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      reconciliation.status === 'MATCHED' ? 'bg-emerald-500/10 text-emerald-500' :
                      reconciliation.status === 'UNMATCHED' ? 'bg-yellow-500/10 text-yellow-500' :
                      reconciliation.status === 'MANUAL_MATCHED' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {reconciliation.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-400">
                    <p><span className="text-gray-500 font-medium">Bank Date:</span> {reconciliation.bank_date}</p>
                    <p><span className="text-gray-500 font-medium">Amount:</span> UGX {(reconciliation.bank_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
                {reconciliation.status === 'UNMATCHED' && (
                  <button
                    onClick={() => {
                      setSelectedReconciliation(reconciliation);
                      setShowMatchModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-bold text-sm"
                  >
                    Match Manual
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDiscrepanciesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Discrepancies</h2>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Severities</option>
          {severityLevels.map((level) => (
            <option key={level.value} value={level.value}>{level.label}</option>
          ))}
        </select>
      </div>

      {discrepancies.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
          <CheckCircle size={48} className="mx-auto text-emerald-500/50 mb-4" />
          <p className="text-gray-400">No unresolved discrepancies found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {discrepancies.map((discrepancy) => {
            const severityObj = severityLevels.find((s) => s.value === discrepancy.severity);
            return (
              <div key={discrepancy.id} className="backdrop-blur-md bg-white/5 p-4 rounded-xl shadow border-l-4 border-l-red-500 border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{discrepancy.discrepancy_type_display}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${severityObj?.color}`}>
                        {severityObj?.label}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-2">{discrepancy.description}</p>
                  </div>
                </div>
                {!discrepancy.is_resolved && (
                  <button
                    onClick={() => {
                      const notes = prompt('Enter resolution notes:');
                      if (notes) resolveDiscrepancy(discrepancy.id, notes);
                    }}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-bold"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Payment Reconciliation</h1>
            <p className="text-gray-400 mt-2 font-medium">Manage bank statement uploads and reconcile with recorded payments</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-1.5 flex gap-1 border border-white/10">
          {[
            { id: 'statements', label: 'Bank Statements', icon: Upload },
            { id: 'reconciliations', label: 'Reconciliations', icon: Clock },
            { id: 'discrepancies', label: 'Discrepancies', icon: AlertCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-md bg-white/5 rounded-3xl p-8 border border-white/10 shadow-2xl"
        >
          {activeTab === 'statements' && renderStatementsTab()}
          {activeTab === 'reconciliations' && renderReconciliationsTab()}
          {activeTab === 'discrepancies' && renderDiscrepanciesTab()}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showStatementModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Upload Bank Statement</h2>
              <input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleStatementUpload(e.target.files[0])}
                disabled={uploadingStatement}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white mb-6"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStatementModal(false)}
                  className="flex-1 px-6 py-3 border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 transition"
                >Cancel</button>
                <button
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={uploadingStatement}
                >{uploadingStatement ? 'Uploading...' : 'Upload'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMatchModal && selectedReconciliation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Manual Match</h2>
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                  <p className="font-mono text-white text-sm">{selectedReconciliation.bank_transaction_id}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className="text-xl font-bold text-white">UGX {(selectedReconciliation.bank_amount || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-4">
                <input
                  type="number"
                  placeholder="Enter Payment ID"
                  id="paymentId"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMatchModal(false)}
                    className="flex-1 px-4 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition"
                  >Cancel</button>
                  <button
                    onClick={() => {
                      const paymentId = document.getElementById('paymentId').value;
                      if (paymentId) handleMatchPayment(selectedReconciliation.id, paymentId, 100);
                      else toast.error('Payment ID required');
                    }}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold"
                  >Match</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default Reconciliation;
