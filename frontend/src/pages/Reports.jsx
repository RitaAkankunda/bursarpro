import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileText, 
  Download, 
  Calendar,
  Filter,
  Loader,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboard } from '../context/DashboardContext';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';

const ReportCard = ({ title, description, icon, onClick, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    onClick={onClick}
    disabled={loading}
    className="backdrop-blur-md bg-white/60 shadow-lg p-8 rounded-2xl border border-gray-300 hover:border-primary/30 cursor-pointer transition-all group space-y-4 hover:shadow-lg hover:shadow-primary/20"
  >
    <div className="p-4 bg-blue-50 rounded-xl w-fit group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-gray-600 mt-2">{description}</p>
    </div>
    <div className="flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
      <Download size={18} />
      <span className="text-xs font-bold uppercase">Generate Report</span>
    </div>
    {loading && (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader size={16} className="animate-spin" />
        <span className="text-xs">Generating...</span>
      </div>
    )}
  </motion.div>
);

const Reports = () => {
  const [loading, setLoading] = useState({});
  const [refundStats, setRefundStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const { terms, selectedTerm, setSelectedTerm } = useDashboard();

  // Fetch refund statistics
  useEffect(() => {
    fetchRefundStats();
  }, []);

  const fetchRefundStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/refunds/');
      const refunds = res.data.results || res.data;
      
      const stats = {
        total: refunds.length,
        pending: refunds.filter(r => r.status === 'PENDING').length,
        approved: refunds.filter(r => r.status === 'APPROVED').length,
        totalAmount: refunds.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0),
        approvalRate: refunds.length > 0 ? Math.round((refunds.filter(r => r.status === 'APPROVED').length / refunds.length) * 100) : 0
      };
      setRefundStats(stats);
    } catch (error) {
      console.error('Error fetching refund stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    setLoading(prev => ({ ...prev, [reportType]: true }));
    try {
      const response = await api.get(`/reports/${reportType.replace(/-/g, '_')}/`, {
        params: { term: selectedTerm || '' },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Determine filename
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${reportType}-report-${timestamp}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      // Show success toast
      toast && toast.success(`${reportType.replace(/-/g, ' ')} report generated!`);
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
      toast && toast.error(`Failed to generate report.`);
    } finally {
      setLoading(prev => ({ ...prev, [reportType]: false }));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-gray-800">Reports & Exports</h1>
          <p className="text-gray-600 font-medium">Generate and download comprehensive reports</p>
        </div>

        {/* Refund Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-md bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg p-6 rounded-2xl border border-blue-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Total Refunds</p>
                <p className="text-3xl font-black text-gray-800 mt-2">{refundStats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-200/50 rounded-lg">
                <TrendingUp size={24} className="text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="backdrop-blur-md bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg p-6 rounded-2xl border border-yellow-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Pending</p>
                <p className="text-3xl font-black text-gray-800 mt-2">{refundStats?.pending || 0}</p>
              </div>
              <div className="p-3 bg-yellow-200/50 rounded-lg">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-md bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg p-6 rounded-2xl border border-emerald-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Approved</p>
                <p className="text-3xl font-black text-gray-800 mt-2">{refundStats?.approved || 0}</p>
              </div>
              <div className="p-3 bg-emerald-200/50 rounded-lg">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="backdrop-blur-md bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg p-6 rounded-2xl border border-purple-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Approval Rate</p>
                <p className="text-3xl font-black text-gray-800 mt-2">{refundStats?.approvalRate || 0}%</p>
              </div>
              <div className="p-3 bg-purple-200/50 rounded-lg">
                <AlertCircle size={24} className="text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="backdrop-blur-md bg-white/60 shadow-lg p-6 rounded-2xl border border-gray-300 space-y-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-blue-600" />
            <h3 className="font-bold">Report Filters</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600">Select Term</label>
              <div className="relative">
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 font-medium hover:bg-gray-50 transition-colors appearance-none pr-10 cursor-pointer"
                >
                  <option value="" className="bg-white text-gray-800">Current Active Term</option>
                  {terms?.map(term => (
                    <option key={term.id} value={term.id} className="bg-white text-gray-800">
                      {term.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-3 text-gray-600 text-xs">▼</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600">Date Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-3 text-gray-800 font-medium hover:bg-gray-50 transition-colors"
                />
                <span className="text-gray-600">to</span>
                <input
                  type="date"
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-3 text-gray-800 font-medium hover:bg-gray-50 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Report Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Collection Summary Report */}
          <ReportCard
            title="Collection Summary"
            description="Total collections, payment status, and collection rates by school"
            icon={<FileText size={28} className="text-blue-400" />}
            onClick={() => generateReport('collection-summary')}
            loading={loading['collection-summary']}
          />

          {/* Student Payment Status */}
          <ReportCard
            title="Student Statements"
            description="Individual student payment records and outstanding balances"
            icon={<FileText size={28} className="text-emerald-400" />}
            onClick={() => generateReport('student-statements')}
            loading={loading['student-statements']}
          />

          {/* Payment History */}
          <ReportCard
            title="Payment Transactions"
            description="Complete payment history with receipts and transaction details"
            icon={<FileText size={28} className="text-purple-400" />}
            onClick={() => generateReport('payment-transactions')}
            loading={loading['payment-transactions']}
          />

          {/* Collection Analytics */}
          <ReportCard
            title="Collection Analytics"
            description="Detailed analytics showing payment trends and patterns"
            icon={<FileText size={28} className="text-yellow-400" />}
            onClick={() => generateReport('collection-analytics')}
            loading={loading['collection-analytics']}
          />

          {/* Outstanding Fees Report */}
          <ReportCard
            title="Outstanding Fees"
            description="List of students with pending payments and amounts due"
            icon={<FileText size={28} className="text-accent" />}
            onClick={() => generateReport('outstanding-fees')}
            loading={loading['outstanding-fees']}
          />

          {/* Budget vs Actual */}
          <ReportCard
            title="Budget vs Actual"
            description="Comparison of budgeted vs actual fee collections by class"
            icon={<FileText size={28} className="text-pink-400" />}
            onClick={() => generateReport('budget-vs-actual')}
            loading={loading['budget-vs-actual']}
          />
        </div>

        {/* Quick Export Section */}
        <div className="backdrop-blur-md bg-white/60 shadow-lg p-8 rounded-2xl border border-gray-300 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Quick Export Options</h3>
            <p className="text-gray-600">Export data in different formats for external analysis</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center gap-3 p-6 bg-gray-50 hover:bg-gray-50 rounded-xl transition-colors border border-gray-300 group">
              <FileText size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">Excel Export</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-6 bg-gray-50 hover:bg-gray-50 rounded-xl transition-colors border border-gray-300 group">
              <FileText size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">CSV Export</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-6 bg-gray-50 hover:bg-gray-50 rounded-xl transition-colors border border-gray-300 group">
              <FileText size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">PDF Export</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-6 bg-gray-50 hover:bg-gray-50 rounded-xl transition-colors border border-gray-300 group">
              <Calendar size={24} className="text-yellow-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">Schedule Report</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
