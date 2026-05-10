import React, { useState, useEffect } from 'react';
import { MessageSquare, Settings, Send, Clock, CheckCircle, AlertCircle, BarChart3, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = `${API_URL}/api/v1`;

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
    { value: 'PENDING', label: 'Pending', color: 'bg-blue-500/10 text-blue-500' },
    { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-yellow-500/10 text-yellow-500' },
    { value: 'SENT', label: 'Sent', color: 'bg-emerald-500/10 text-emerald-500' },
    { value: 'FAILED', label: 'Failed', color: 'bg-red-500/10 text-red-500' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-gray-500/10 text-gray-500' },
  ];
  
  const triggerTypes = [
    { value: 'DAYS_BEFORE', label: 'Days Before Due Date' },
    { value: 'OVERDUE', label: 'Payment Overdue' },
    { value: 'SPECIFIC_DATE', label: 'Specific Date' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        if (activeTab === 'config') {
          const res = await axios.get(`${API_BASE}/sms-reminder-config/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setConfig(res.data);
          setConfigForm(res.data);
        } else if (activeTab === 'reminders') {
          const url = filterStatus === 'all'
            ? `${API_BASE}/sms-reminders/`
            : filterStatus === 'pending'
            ? `${API_BASE}/sms-reminders/pending/`
            : `${API_BASE}/sms-reminders/?status=${filterStatus}`;
          const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setReminders(res.data.results || res.data);
        } else if (activeTab === 'history') {
          const res = await axios.get(`${API_BASE}/sms-reminder-history/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setHistory(res.data.results || res.data);
        } else if (activeTab === 'templates') {
          const res = await axios.get(`${API_BASE}/sms-reminder-templates/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setTemplates(res.data.results || res.data);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        toast.error(`Failed to load ${activeTab}`);
      }
    };

    fetchData();
  }, [activeTab, filterStatus]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_BASE}/sms-reminder-config/stats/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  const handleUpdateConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.put(`${API_BASE}/sms-reminder-config/`, configForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data);
      setEditingConfig(false);
      toast.success('Configuration updated');
    } catch (error) {
      toast.error('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE}/sms-reminder-templates/`, newTemplate, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates([...templates, response.data]);
      setShowTemplateModal(false);
      setNewTemplate({ name: '', message_template: '' });
      toast.success('Template created');
    } catch (error) {
      toast.error('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const renderConfigTab = () => (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label: 'Total Sent', value: stats?.total_sent || 0, icon: Send, color: 'text-blue-500' },
          { label: 'Pending', value: stats?.pending_count || 0, icon: Clock, color: 'text-yellow-500' },
          { label: 'Success Rate', value: `${stats?.success_rate || 0}%`, icon: CheckCircle, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
              </div>
              <stat.icon className={stat.color} size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">SMS Configuration</h2>
          {!editingConfig && (
            <button
              onClick={() => setEditingConfig(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
            >Edit Config</button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Company/School Name</label>
              <input
                disabled={!editingConfig}
                value={configForm.company_name || ''}
                onChange={(e) => setConfigForm({...configForm, company_name: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                disabled={!editingConfig}
                checked={configForm.is_active || false}
                onChange={(e) => setConfigForm({...configForm, is_active: e.target.checked})}
                className="w-5 h-5 rounded border-white/10 bg-white/5 text-blue-600"
              />
              <span className="text-white font-medium">Automatic Reminders Enabled</span>
            </div>
          </div>
          <div className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Reminder Trigger</label>
              <select
                disabled={!editingConfig}
                value={configForm.trigger_type || ''}
                onChange={(e) => setConfigForm({...configForm, trigger_type: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-50"
              >
                {triggerTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {editingConfig && (
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setEditingConfig(false)}
              className="px-6 py-3 border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 transition"
            >Cancel</button>
            <button
              onClick={handleUpdateConfig}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
            >Save Changes</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderRemindersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Active Reminders</h2>
        <div className="flex gap-4">
          <button
            onClick={async () => {
              setLoading(true);
              const token = localStorage.getItem('access_token');
              await axios.post(`${API_BASE}/sms-reminders/schedule_batch/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setActiveTab('reminders');
              setLoading(false);
              toast.success('Batch scheduled');
            }}
            className="px-4 py-2 border border-white/10 text-white rounded-xl font-bold hover:bg-white/5 transition flex items-center gap-2"
          >
            <Clock size={18} /> Schedule Batch
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              const token = localStorage.getItem('access_token');
              await axios.post(`${API_BASE}/sms-reminders/send_scheduled/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setLoading(false);
              toast.success('Sending started');
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <Send size={18} /> Send All
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {reminders.map((reminder) => {
          const status = reminderStatuses.find(s => s.value === reminder.status);
          return (
            <div key={reminder.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md hover:bg-white/10 transition">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-bold mb-1">{reminder.recipient_number}</h4>
                  <p className="text-gray-400 text-sm line-clamp-2">{reminder.message}</p>
                  <p className="text-xs text-gray-500 mt-2">Scheduled: {new Date(reminder.scheduled_time).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${status?.color}`}>
                  {status?.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
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
            <h1 className="text-4xl font-black text-white tracking-tight">SMS Reminders</h1>
            <p className="text-gray-400 mt-2 font-medium">Automate and track payment reminders to parents</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-1.5 flex gap-1 border border-white/10 overflow-x-auto">
          {[
            { id: 'config', label: 'Dashboard', icon: BarChart3 },
            { id: 'reminders', label: 'Active Queue', icon: Clock },
            { id: 'templates', label: 'Templates', icon: MessageSquare },
            { id: 'history', label: 'History', icon: Send },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
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
          className="min-h-[400px]"
        >
          {activeTab === 'config' && renderConfigTab()}
          {activeTab === 'reminders' && renderRemindersTab()}
          {activeTab === 'templates' && (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-white">SMS Templates</h2>
                 <button
                   onClick={() => setShowTemplateModal(true)}
                   className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition font-bold"
                 >
                   <Plus size={20} /> New Template
                 </button>
               </div>
               <div className="grid md:grid-cols-2 gap-6">
                 {templates.map(t => (
                   <div key={t.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                     <h3 className="text-white font-bold mb-2">{t.name}</h3>
                     <p className="text-gray-400 text-sm whitespace-pre-wrap">{t.message_template}</p>
                   </div>
                 ))}
               </div>
             </div>
          )}
          {activeTab === 'history' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-6 py-4 text-gray-400 font-bold text-sm uppercase">Recipient</th>
                    <th className="px-6 py-4 text-gray-400 font-bold text-sm uppercase">Sent At</th>
                    <th className="px-6 py-4 text-gray-400 font-bold text-sm uppercase">Provider ID</th>
                    <th className="px-6 py-4 text-gray-400 font-bold text-sm uppercase">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map(h => (
                    <tr key={h.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-white font-medium">{h.recipient_number}</td>
                      <td className="px-6 py-4 text-gray-400">{new Date(h.sent_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{h.provider_response_id || 'N/A'}</td>
                      <td className="px-6 py-4 text-blue-400 font-bold">UGX {h.cost || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Create Template</h2>
                <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Template Name</label>
                  <input
                    placeholder="e.g. Overdue Notice"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Message Body</label>
                  <textarea
                    rows={4}
                    placeholder="Use {parent_name}, {student_name}, {amount_due} variables"
                    value={newTemplate.message_template}
                    onChange={(e) => setNewTemplate({...newTemplate, message_template: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleCreateTemplate}
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >Create Template</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default SMSReminders;
