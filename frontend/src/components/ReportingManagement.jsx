/**
 * Reporting Management Component
 * Handles report templates, scheduling, and customization
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReportingManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [customReports, setCustomReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    report_type: 'PAYMENT_SUMMARY',
    recipients: '',
    frequency: 'WEEKLY',
    enabled: true
  });

  const [customReportData, setCustomReportData] = useState({
    name: '',
    report_type: 'PAYMENT_SUMMARY',
    description: '',
    selected_fields: []
  });

  const API_BASE = 'http://localhost:8000/api/v1';

  const reportTypes = [
    { value: 'PAYMENT_SUMMARY', label: '💰 Payment Summary' },
    { value: 'OUTSTANDING_FEES', label: '📋 Outstanding Fees' },
    { value: 'PAYMENT_BY_METHOD', label: '📊 Payment by Method' },
    { value: 'STUDENT_STATEMENT', label: '👤 Student Statement' },
    { value: 'CLASS_SUMMARY', label: '📚 Class Summary' }
  ];

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      };

      const schoolId = localStorage.getItem('school_id');

      if (activeTab === 'templates') {
        const res = await axios.get(`${API_BASE}/report-templates/?school=${schoolId}`, { headers });
        setTemplates(res.data.results || res.data);
      } else if (activeTab === 'executions') {
        const res = await axios.get(`${API_BASE}/report-executions/?template__school=${schoolId}`, { headers });
        setExecutions(res.data.results || res.data);
      } else if (activeTab === 'custom') {
        const res = await axios.get(`${API_BASE}/report-customizations/?school=${schoolId}`, { headers });
        setCustomReports(res.data.results || res.data);
      }

      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      };

      const data = {
        ...formData,
        school: localStorage.getItem('school_id'),
        recipients: formData.recipients.split(',').map(r => r.trim()).join(',')
      };

      const response = await axios.post(`${API_BASE}/report-templates/`, data, { headers });

      setTemplates([...templates, response.data]);
      setShowCreateModal(false);
      setFormData({
        report_type: 'PAYMENT_SUMMARY',
        recipients: '',
        frequency: 'WEEKLY',
        enabled: true
      });
      alert('✅ Report template created successfully!');
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleGenerateReport = async (templateId) => {
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(
        `${API_BASE}/report-templates/${templateId}/generate_now/`,
        {},
        { headers }
      );

      alert(`✅ Report generated!\n\nData:\n${JSON.stringify(response.data.data, null, 2)}`);
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      };

      await axios.delete(`${API_BASE}/report-templates/${templateId}/`, { headers });

      setTemplates(templates.filter(t => t.id !== templateId));
      alert('✅ Template deleted successfully!');
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center">📊 Loading reports...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📋 Reporting Management</h1>
        {activeTab === 'templates' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            + Create Template
          </button>
        )}
        {activeTab === 'custom' && (
          <button
            onClick={() => setShowCustomModal(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            + Custom Report
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-3 font-medium ${activeTab === 'templates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('executions')}
          className={`px-6 py-3 font-medium ${activeTab === 'executions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Executions ({executions.length})
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-6 py-3 font-medium ${activeTab === 'custom' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Custom ({customReports.length})
        </button>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div key={template.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <h3 className="font-semibold mb-2">{template.report_type.replace('_', ' ')}</h3>
              <p className="text-sm text-gray-600 mb-3">Frequency: {template.frequency}</p>
              <p className="text-sm text-gray-600 mb-4">Recipients: {template.recipients}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateReport(template.id)}
                  className="flex-1 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  Generate
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="flex-1 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Executions Tab */}
      {activeTab === 'executions' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Report Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Generated</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">File</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {executions.map(exec => (
                  <tr key={exec.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{exec.template_type}</td>
                    <td className="px-6 py-4 text-sm">{new Date(exec.generated_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        exec.status === 'SENT' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {exec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{exec.file_path}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {executions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No report executions found
            </div>
          )}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <TemplateModal
          title="Create Report Template"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateTemplate}
          onClose={() => setShowCreateModal(false)}
          reportTypes={reportTypes}
        />
      )}

      {/* Custom Report Modal */}
      {showCustomModal && (
        <CustomReportModal
          onClose={() => setShowCustomModal(false)}
        />
      )}
    </div>
  );
};

// Template Modal Component
const TemplateModal = ({ title, formData, setFormData, onSubmit, onClose, reportTypes }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Report Type</label>
          <select
            value={formData.report_type}
            onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {reportTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Recipients (comma-separated emails)</label>
          <textarea
            value={formData.recipients}
            onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
            placeholder="user@school.com, admin@school.com"
            className="w-full px-3 py-2 border rounded-lg"
            rows="3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Frequency</label>
          <select
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.enabled}
            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            className="w-4 h-4"
          />
          <label className="ml-2 text-sm">Enable this template</label>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
);

// Custom Report Modal Component
const CustomReportModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Create Custom Report</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <p className="text-gray-600 text-center py-8">
        Custom report creation coming soon...
      </p>
      <button
        onClick={onClose}
        className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
      >
        Close
      </button>
    </div>
  </div>
);

export default ReportingManagement;
