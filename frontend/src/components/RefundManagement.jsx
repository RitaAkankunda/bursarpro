/**
 * Refund Management Component
 * Handles refund requests, approvals, and processing
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [reversals, setReversals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('refunds');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [notes, setNotes] = useState('');

  const API_BASE = 'http://localhost:8000/api/v1';

  useEffect(() => {
    fetchRefundData();
  }, [activeTab]);

  const fetchRefundData = async () => {
    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      };

      if (activeTab === 'refunds') {
        const res = await axios.get(`${API_BASE}/refunds/`, {
          params: { school: localStorage.getItem('school_id') },
          headers
        });
        setRefunds(res.data.results || res.data);
      } else {
        const res = await axios.get(`${API_BASE}/payment-reversals/`, {
          params: { school: localStorage.getItem('school_id') },
          headers
        });
        setReversals(res.data.results || res.data);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefundAction = async (refund, action) => {
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      };

      let endpoint = `${API_BASE}/refunds/${refund.id}/${action}/`;
      let data = { notes };

      if (action === 'reject') {
        data = { reason: notes };
      }

      const response = await axios.post(endpoint, data, { headers });
      
      // Update local state
      const updatedRefunds = refunds.map(r => 
        r.id === refund.id ? response.data : r
      );
      setRefunds(updatedRefunds);
      
      setShowModal(false);
      setNotes('');
      setSelectedRefund(null);
      
      alert(`✅ Refund ${action}ed successfully!`);
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleReversalAction = async (reversal, action) => {
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      };

      const endpoint = `${API_BASE}/payment-reversals/${reversal.id}/${action}/`;

      const response = await axios.post(endpoint, {}, { headers });
      
      const updatedReversals = reversals.map(r => 
        r.id === reversal.id ? response.data : r
      );
      setReversals(updatedReversals);
      
      alert(`✅ Reversal ${action}ed successfully!`);
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'COMPLETED': 'bg-blue-100 text-blue-800',
      'PROCESSING': 'bg-purple-100 text-purple-800',
      'REVERSED': 'bg-gray-100 text-gray-800'
    };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || ''}`}>{status}</span>;
  };

  if (loading) return <div className="p-8 text-center">Loading refunds...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">💰 Refund Management</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-6 py-3 font-medium ${activeTab === 'refunds' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Refund Requests ({refunds.length})
        </button>
        <button
          onClick={() => setActiveTab('reversals')}
          className={`px-6 py-3 font-medium ${activeTab === 'reversals' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Payment Reversals ({reversals.length})
        </button>
      </div>

      {/* Refunds Table */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Student</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Reason</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Method</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {refunds.map(refund => (
                  <tr key={refund.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{refund.student_name}</td>
                    <td className="px-6 py-4 font-medium">KES {refund.amount}</td>
                    <td className="px-6 py-4 text-sm">{refund.reason}</td>
                    <td className="px-6 py-4">{getStatusBadge(refund.status)}</td>
                    <td className="px-6 py-4 text-sm">{refund.refund_method}</td>
                    <td className="px-6 py-4 text-sm">
                      {refund.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedRefund(refund);
                              setModalAction('approve');
                              setShowModal(true);
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRefund(refund);
                              setModalAction('reject');
                              setShowModal(true);
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {refund.status === 'APPROVED' && (
                        <button
                          onClick={() => handleRefundAction(refund, 'process')}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Process
                        </button>
                      )}
                      {['REJECTED', 'COMPLETED'].includes(refund.status) && (
                        <span className="text-gray-400 text-sm">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {refunds.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No refund requests found
            </div>
          )}
        </div>
      )}

      {/* Reversals Table */}
      {activeTab === 'reversals' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Receipt #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Reason</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reversals.map(reversal => (
                  <tr key={reversal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{reversal.payment_receipt}</td>
                    <td className="px-6 py-4 font-medium">KES {reversal.original_amount}</td>
                    <td className="px-6 py-4 text-sm">{reversal.reason}</td>
                    <td className="px-6 py-4">{getStatusBadge(reversal.status)}</td>
                    <td className="px-6 py-4 text-sm">
                      {reversal.status === 'PENDING' && (
                        <button
                          onClick={() => handleReversalAction(reversal, 'approve')}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                      )}
                      {reversal.status === 'APPROVED' && (
                        <button
                          onClick={() => handleReversalAction(reversal, 'execute')}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Execute
                        </button>
                      )}
                      {['REVERSED'].includes(reversal.status) && (
                        <span className="text-gray-400 text-sm">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reversals.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No reversals found
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedRefund && (
        <Modal
          title={`${modalAction.charAt(0).toUpperCase() + modalAction.slice(1)} Refund`}
          onClose={() => {
            setShowModal(false);
            setNotes('');
          }}
          onSubmit={() => handleRefundAction(selectedRefund, modalAction)}
        >
          <div className="space-y-4">
            <p>
              <strong>Student:</strong> {selectedRefund.student_name}
            </p>
            <p>
              <strong>Amount:</strong> KES {selectedRefund.amount}
            </p>
            <p>
              <strong>Reason:</strong> {selectedRefund.reason}
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">
                {modalAction === 'reject' ? 'Rejection Reason' : 'Notes'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border rounded-lg"
                rows="4"
                placeholder="Enter your notes..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Modal Component
const Modal = ({ title, onClose, onSubmit, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <div className="p-6">{children}</div>
      <div className="p-6 border-t flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

export default RefundManagement;
