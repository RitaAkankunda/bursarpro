import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, Clock, Download, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    { value: 'PENDING', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'PROCESSING', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
    { value: 'RECONCILED', label: 'Fully Reconciled', color: 'bg-green-100 text-green-800' },
    { value: 'PARTIAL', label: 'Partially Reconciled', color: 'bg-orange-100 text-orange-800' },
    { value: 'FAILED', label: 'Failed', color: 'bg-red-100 text-red-800' },
  ];

  const severityLevels = [
    { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800' },
  ];

  // Fetch bank statements
  useEffect(() => {
    const fetchStatements = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(
          `${API_URL}/api/finance/bank-statements/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
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

  // Fetch reconciliations
  useEffect(() => {
    const fetchReconciliations = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const url = filterStatus === 'unmatched' 
          ? `${API_URL}/api/finance/payment-reconciliations/unmatched/`
          : filterStatus === 'disputed'
          ? `${API_URL}/api/finance/payment-reconciliations/disputed/`
          : `${API_URL}/api/finance/payment-reconciliations/`;
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
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

  // Fetch discrepancies
  useEffect(() => {
    const fetchDiscrepancies = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const url = filterSeverity === 'all'
          ? `${API_URL}/api/finance/reconciliation-discrepancies/unresolved/`
          : `${API_URL}/api/finance/reconciliation-discrepancies/by_severity/?severity=${filterSeverity}`;
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
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
      const response = await axios.post(
        `${API_URL}/api/finance/bank-statements/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
      const response = await axios.post(
        `${API_URL}/api/finance/bank-statements/${statementId}/process/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBankStatements(
        bankStatements.map(s => s.id === statementId ? response.data : s)
      );
      toast.success('Statement processing started');
    } catch (error) {
      console.error('Error processing statement:', error);
      toast.error('Failed to process statement');
    }
  };

  const handleMatchPayment = async (reconciliationId, paymentId, confidence) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/api/finance/payment-reconciliations/${reconciliationId}/match_payment/`,
        { payment_id: paymentId, confidence_score: confidence },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReconciliations(
        reconciliations.map(r => r.id === reconciliationId ? response.data : r)
      );
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
      const response = await axios.post(
        `${API_URL}/api/finance/reconciliation-discrepancies/${discrepancyId}/resolve/`,
        { resolution_notes: notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDiscrepancies(
        discrepancies.map(d => d.id === discrepancyId ? response.data : d)
      );
      toast.success('Discrepancy resolved');
    } catch (error) {
      console.error('Error resolving discrepancy:', error);
      toast.error('Failed to resolve discrepancy');
    }
  };

  // Bank Statements Tab
  const renderStatementsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Bank Statements</h2>
        <button
          onClick={() => setShowStatementModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
        >
          <Upload size={20} />
          Upload Statement
        </button>
      </div>

      {bankStatements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No bank statements uploaded yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bankStatements.map((statement) => {
            const statusObj = statementStatuses.find(s => s.value === statement.status);
            return (
              <div key={statement.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{statement.file_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusObj?.color}`}>
                        {statusObj?.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <p><span className="font-medium">Date:</span> {new Date(statement.statement_date).toLocaleDateString()}</p>
                      <p><span className="font-medium">Amount:</span> UGX {(statement.total_amount || 0).toLocaleString()}</p>
                      <p><span className="font-medium">Transactions:</span> {statement.transaction_count}</p>
                      <p><span className="font-medium">Uploaded:</span> {new Date(statement.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {statement.status === 'PENDING' && (
                    <button
                      onClick={() => processStatement(statement.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition ml-4"
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

  // Reconciliations Tab
  const renderReconciliationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payment Reconciliations</h2>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="unmatched">Unmatched</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      {reconciliations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No reconciliation records found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reconciliations.map((reconciliation) => (
            <div key={reconciliation.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{reconciliation.bank_transaction_id}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      reconciliation.status === 'MATCHED' ? 'bg-green-100 text-green-800' :
                      reconciliation.status === 'UNMATCHED' ? 'bg-yellow-100 text-yellow-800' :
                      reconciliation.status === 'MANUAL_MATCHED' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {reconciliation.status_display}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <p><span className="font-medium">Amount:</span> UGX {(reconciliation.bank_amount || 0).toLocaleString()}</p>
                    <p><span className="font-medium">Date:</span> {new Date(reconciliation.bank_date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Confidence:</span> {Math.round(reconciliation.confidence_score)}%</p>
                  </div>
                </div>
                {reconciliation.status === 'UNMATCHED' && (
                  <button
                    onClick={() => {
                      setSelectedReconciliation(reconciliation);
                      setShowMatchModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition ml-4"
                  >
                    Match
                  </button>
                )}
              </div>
              {reconciliation.amount_difference > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-2">
                  <AlertCircle size={18} className="text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Amount difference: UGX {reconciliation.amount_difference.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Discrepancies Tab
  const renderDiscrepanciesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Discrepancies</h2>
        <div className="flex gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            {severityLevels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>
      </div>

      {discrepancies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
          <p className="text-gray-600">No unresolved discrepancies found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {discrepancies.map((discrepancy) => {
            const severityObj = severityLevels.find(s => s.value === discrepancy.severity);
            return (
              <div key={discrepancy.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-l-red-500">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{discrepancy.discrepancy_type_display}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${severityObj?.color}`}>
                        {severityObj?.label}
                      </span>
                      {discrepancy.is_resolved && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{discrepancy.description}</p>
                    {discrepancy.suggested_action && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded mb-2">
                        <span className="font-medium">Suggested Action:</span> {discrepancy.suggested_action}
                      </p>
                    )}
                  </div>
                </div>
                {!discrepancy.is_resolved && (
                  <button
                    onClick={() => {
                      const notes = prompt('Enter resolution notes:');
                      if (notes) {
                        resolveDiscrepancy(discrepancy.id, notes);
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Reconciliation</h1>
          <p className="text-gray-600">Manage bank statement uploads and reconcile with recorded payments</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-t-xl shadow-md border-b border-gray-200 flex">
          {[
            { id: 'statements', label: 'Bank Statements', icon: Upload },
            { id: 'reconciliations', label: 'Reconciliations', icon: Clock },
            { id: 'discrepancies', label: 'Discrepancies', icon: AlertCircle },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 transition border-b-2 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-md p-6">
          {activeTab === 'statements' && renderStatementsTab()}
          {activeTab === 'reconciliations' && renderReconciliationsTab()}
          {activeTab === 'discrepancies' && renderDiscrepanciesTab()}
        </div>
      </div>

      {/* Upload Statement Modal */}
      {showStatementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Bank Statement</h2>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleStatementUpload(e.target.files[0]);
                }
              }}
              disabled={uploadingStatement}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowStatementModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={uploadingStatement}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowStatementModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                disabled={uploadingStatement}
              >
                {uploadingStatement ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Payment Modal */}
      {showMatchModal && selectedReconciliation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Match Payment</h2>
            <p className="text-gray-600 mb-4">
              Transaction: {selectedReconciliation.bank_transaction_id}
            </p>
            <p className="text-gray-600 mb-4">
              Amount: UGX {(selectedReconciliation.bank_amount || 0).toLocaleString()}
            </p>
            <input
              type="number"
              placeholder="Payment ID"
              id="paymentId"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <input
              type="number"
              placeholder="Confidence Score (0-100)"
              id="confidence"
              min="0"
              max="100"
              defaultValue="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowMatchModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const paymentId = document.getElementById('paymentId').value;
                  const confidence = parseInt(document.getElementById('confidence').value);
                  if (paymentId && confidence >= 0 && confidence <= 100) {
                    handleMatchPayment(selectedReconciliation.id, paymentId, confidence);
                  } else {
                    toast.error('Please enter valid payment ID and confidence score');
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reconciliation;
