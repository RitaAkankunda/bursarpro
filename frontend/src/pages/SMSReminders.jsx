import React, { useState, useEffect } from 'react';
import { MessageSquare, Settings, Send, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SMSReminders = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [config, setConfig] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [editingConfig, setEditingConfig] = useState(false);
  const [configForm, setConfigForm] = useState({});
  const [newTemplate, setNewTemplate] = useState({ name: '', message_template: '' });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const reminderStatuses = [
    { value: 'PENDING', label: 'Pending', color: 'bg-blue-100 text-blue-800' },
    { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'SENT', label: 'Sent', color: 'bg-green-100 text-green-800' },
    { value: 'FAILED', label: 'Failed', color: 'bg-red-100 text-red-800' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  ];
  
  const triggerTypes = [
    { value: 'DAYS_BEFORE', label: 'Days Before Due Date' },
    { value: 'OVERDUE', label: 'Payment Overdue' },
    { value: 'SPECIFIC_DATE', label: 'Specific Date' },
  ];

  // Fetch configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(
          `${API_URL}/api/finance/sms-reminder-config/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setConfig(response.data);
        setConfigForm(response.data);
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    if (activeTab === 'config') {
      fetchConfig();
    }
  }, [activeTab]);

  // Fetch reminders
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const url = filterStatus === 'all'
          ? `${API_URL}/api/finance/sms-reminders/`
          : filterStatus === 'pending'
          ? `${API_URL}/api/finance/sms-reminders/pending/`
          : `${API_URL}/api/finance/sms-reminders/?status=${filterStatus}`;
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReminders(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching reminders:', error);
        toast.error('Failed to load reminders');
      }
    };

    if (activeTab === 'reminders') {
      fetchReminders();
    }
  }, [activeTab, filterStatus]);

  // Fetch history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(
          `${API_URL}/api/finance/sms-reminder-history/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHistory(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching history:', error);
        toast.error('Failed to load history');
      }
    };

    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(
          `${API_URL}/api/finance/sms-reminder-templates/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTemplates(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(
          `${API_URL}/api/finance/sms-reminder-config/stats/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats(); // Fetch stats whenever we mount
    const interval = setInterval(fetchStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.put(
        `${API_URL}/api/finance/sms-reminder-config/`,
        configForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfig(response.data);
      setEditingConfig(false);
      toast.success('Configuration updated successfully');
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleBatch = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/api/finance/sms-reminders/schedule_batch/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      setLoading(false);
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      toast.error('Failed to schedule reminders');
      setLoading(false);
    }
  };

  const handleSendScheduled = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/api/finance/sms-reminders/send_scheduled/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      setLoading(false);
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error('Failed to send reminders');
      setLoading(false);
    }
  };

  const handleAddTemplate = async () => {
    if (!newTemplate.name || !newTemplate.message_template) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/api/finance/sms-reminder-templates/`,
        newTemplate,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTemplates([response.data, ...templates]);
      setNewTemplate({ name: '', message_template: '' });
      setShowTemplateModal(false);
      toast.success('Template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(
          `${API_URL}/api/finance/sms-reminder-templates/${templateId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTemplates(templates.filter(t => t.id !== templateId));
        toast.success('Template deleted');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
      }
    }
  };

  // Configuration Tab
  const renderConfigTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">SMS Reminder Configuration</h2>
        {!editingConfig && (
          <button
            onClick={() => setEditingConfig(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Edit Configuration
          </button>
        )}
      </div>

      {editingConfig ? (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Enable SMS Reminders</label>
            <input
              type="checkbox"
              checked={configForm.is_enabled || false}
              onChange={(e) => setConfigForm({ ...configForm, is_enabled: e.target.checked })}
              className="h-4 w-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Trigger Type</label>
            <select
              value={configForm.trigger_type || 'DAYS_BEFORE'}
              onChange={(e) => setConfigForm({ ...configForm, trigger_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {triggerTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Days Before Due</label>
              <input
                type="number"
                value={configForm.days_before_due || 3}
                onChange={(e) => setConfigForm({ ...configForm, days_before_due: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Daily Reminders</label>
              <input
                type="number"
                value={configForm.max_daily_reminders || 500}
                onChange={(e) => setConfigForm({ ...configForm, max_daily_reminders: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Send Time (HH:MM)</label>
            <input
              type="time"
              value={configForm.send_time || '08:00'}
              onChange={(e) => setConfigForm({ ...configForm, send_time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message Template</label>
            <textarea
              value={configForm.message_template || ''}
              onChange={(e) => setConfigForm({ ...configForm, message_template: e.target.value })}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Use {student_name}, {parent_name}, {amount}, {term_name}, {due_date}"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">SMS Cost per Unit (UGX)</label>
              <input
                type="number"
                step="0.01"
                value={configForm.sms_cost_per_unit || 200}
                onChange={(e) => setConfigForm({ ...configForm, sms_cost_per_unit: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Budget (UGX)</label>
              <input
                type="number"
                step="0.01"
                value={configForm.monthly_budget || 50000}
                onChange={(e) => setConfigForm({ ...configForm, monthly_budget: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUpdateConfig}
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              onClick={() => setEditingConfig(false)}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        config && (
          <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <p><span className="font-medium">Status:</span> {config.is_enabled ? '✅ Enabled' : '❌ Disabled'}</p>
              <p><span className="font-medium">Trigger Type:</span> {config.trigger_type_display}</p>
              <p><span className="font-medium">Days Before Due:</span> {config.days_before_due} days</p>
              <p><span className="font-medium">Send Time:</span> {config.send_time}</p>
              <p><span className="font-medium">SMS Cost:</span> UGX {config.sms_cost_per_unit}</p>
              <p><span className="font-medium">Monthly Budget:</span> UGX {config.monthly_budget}</p>
            </div>
          </div>
        )
      )}

      {/* Statistics Card */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Sent Today</p>
            <p className="text-3xl font-bold text-blue-900">{stats.sent_today}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-medium">Sent This Month</p>
            <p className="text-3xl font-bold text-green-900">{stats.sent_this_month}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-600 font-medium">Pending</p>
            <p className="text-3xl font-bold text-yellow-900">{stats.pending_count}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-600 font-medium">Monthly Cost</p>
            <p className="text-3xl font-bold text-purple-900">UGX {stats.monthly_cost.toLocaleString()}</p>
            {stats.budget_exceeded && <p className="text-xs text-red-600 font-semibold mt-1">⚠️ Budget Exceeded</p>}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleScheduleBatch}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          <Clock size={20} />
          Schedule Reminders Now
        </button>
        <button
          onClick={handleSendScheduled}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          <Send size={20} />
          Send Scheduled Reminders
        </button>
      </div>
    </div>
  );

  // Reminders Tab
  const renderRemindersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Scheduled Reminders</h2>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No reminders to display</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reminders.map((reminder) => {
            const statusObj = reminderStatuses.find(s => s.value === reminder.status);
            return (
              <div key={reminder.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{reminder.student_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusObj?.color}`}>
                        {statusObj?.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <p><span className="font-medium">Phone:</span> {reminder.recipient_phone}</p>
                      <p><span className="font-medium">Amount:</span> UGX {(reminder.outstanding_amount || 0).toLocaleString()}</p>
                      <p><span className="font-medium">Due:</span> {new Date(reminder.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded mb-3">
                  <p className="text-sm text-gray-700">{reminder.message_content}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Scheduled: {new Date(reminder.scheduled_send_time).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // History Tab
  const renderHistoryTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">SMS History</h2>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No SMS history yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((record) => (
            <div key={record.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-l-green-500">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{record.student_name}</h3>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Sent
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <p><span className="font-medium">Phone:</span> {record.recipient_phone}</p>
                    <p><span className="font-medium">Amount:</span> UGX {(record.amount_reminded || 0).toLocaleString()}</p>
                    <p><span className="font-medium">Cost:</span> UGX {record.cost}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded mb-2">
                <p className="text-sm text-gray-700">{record.message_sent}</p>
              </div>
              <p className="text-xs text-gray-500">
                Sent: {new Date(record.sent_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Templates Tab
  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">SMS Templates</h2>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No templates created yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  {template.description && <p className="text-sm text-gray-600 mb-2">{template.description}</p>}
                  <div className="bg-gray-50 p-3 rounded mb-3">
                    <p className="text-sm text-gray-700">{template.message_template}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200 transition text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Payment Due Reminder"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message Template</label>
                <textarea
                  value={newTemplate.message_template}
                  onChange={(e) => setNewTemplate({ ...newTemplate, message_template: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Use {student_name}, {parent_name}, {amount}, {term_name}, {due_date} as placeholders"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm text-blue-800">
                <p className="font-medium mb-1">Available Placeholders:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{'{student_name}'} - Student's first name</li>
                  <li>{'{parent_name}'} - Parent's name</li>
                  <li>{'{amount}'} - Outstanding amount</li>
                  <li>{'{term_name}'} - Term name</li>
                  <li>{'{due_date}'} - Payment due date</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleAddTemplate}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Create Template
              </button>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <MessageSquare size={40} className="text-blue-600" />
            SMS Payment Reminders
          </h1>
          <p className="text-gray-600">Automate payment reminders to students and parents</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-t-xl shadow-md border-b border-gray-200 flex">
          {[
            { id: 'config', label: 'Configuration', icon: Settings },
            { id: 'reminders', label: 'Reminders', icon: Clock },
            { id: 'history', label: 'History', icon: CheckCircle },
            { id: 'templates', label: 'Templates', icon: MessageSquare },
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
          {activeTab === 'config' && renderConfigTab()}
          {activeTab === 'reminders' && renderRemindersTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'templates' && renderTemplatesTab()}
        </div>
      </div>
    </div>
  );
};

export default SMSReminders;
