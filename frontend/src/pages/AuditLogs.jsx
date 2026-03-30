import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Loader2, Filter, Activity, ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { TableSkeleton } from '../components/SkeletonLoader';

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('ALL');

  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, filterAction, searchTerm],
    queryFn: async () => {
      let url = `/audit-logs/?page=${page}`;
      if (filterAction !== 'ALL') url += `&action=${filterAction}`;
      if (searchTerm) url += `&search=${searchTerm}`;
      const res = await api.get(url);
      return res.data;
    },
    keepPreviousData: true
  });

  const logs = logsData?.results || [];
  const totalPages = logsData?.total_pages || 1;

  const actionColors = {
    CREATE: 'bg-green-100 text-green-800 border-green-200',
    UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
    DELETE: 'bg-red-100 text-red-800 border-red-200',
    APPROVE: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
              <ShieldAlert className="text-blue-600" size={32} /> System Audit Trail
            </h1>
            <p className="text-gray-500 font-medium mt-1">Immutable ledger of all critical system modifications.</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white/50 p-4 rounded-2xl border border-white/40 shadow-sm backdrop-blur-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search audit descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-700 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
              className="px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer font-bold text-gray-600"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Creates</option>
              <option value="UPDATE">Updates</option>
              <option value="DELETE">Deletions</option>
            </select>
            
            <button className="px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter size={18} /> Advanced
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/70 backdrop-blur-xl border border-white shadow-xl rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-gray-100">
                  <TableSkeleton columns={5} rows={8} />
                </tbody>
              </table>
            ) : error ? (
              <div className="p-12 text-center text-red-500 font-bold flex flex-col items-center gap-3">
                <ShieldAlert size={48} />
                Failed to load audit logs. Check your permissions.
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">
                No audit logs found matching your criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Action</th>
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Entity</th>
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Description</th>
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Performed By</th>
                    <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-widest">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-md text-xs font-black border uppercase tracking-wide ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-800">
                        {log.entity_type} #{log.entity_id}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-gray-600 truncate max-w-sm" title={log.description}>
                          {log.description}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-gray-700">
                        {log.performed_by || 'System'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {!isLoading && logs.length > 0 && (
            <div className="py-4 px-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition-colors text-gray-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition-colors text-gray-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditLogs;
