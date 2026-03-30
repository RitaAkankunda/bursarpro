import { useEffect, useState } from 'react';
import { 
  Search, 
  UserPlus, 
  X,
  Filter,
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

const AddStudentModal = ({ isOpen, onClose, onSuccess, classes }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    student_id: '',
    parent_name: '',
    parent_phone: '',
    class_level: ''
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newStudent) => api.post('/students/', newStudent),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student added successfully!');
      setForm({
        first_name: '',
        last_name: '',
        student_id: '',
        parent_name: '',
        parent_phone: '',
        class_level: ''
      });
      onClose();
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.detail || err.response?.data?.student_id?.[0] || 'Failed to add student';
      toast.error(errorMsg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="backdrop-blur-md bg-white/60 shadow-lg w-full max-w-md p-8 rounded-3xl border border-gray-200 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-800">Add New Student</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal content begins */}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">First Name</label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Last Name</label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Student ID</label>
            <input
              type="text"
              required
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              placeholder="e.g., STU001"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Class Level</label>
            <div className="relative">
              <select
                required
                value={form.class_level}
                onChange={(e) => setForm({ ...form, class_level: e.target.value })}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none cursor-pointer pr-10 text-gray-800"
              >
                <option value="" className="bg-white text-gray-800 text-gray-800">
                  {classes.length === 0 ? 'No classes available' : 'Select a class'}
                </option>
                {classes && classes.length > 0 ? (
                  classes.map(cls => (
                    <option key={cls.id} value={cls.id} className="bg-white text-gray-800 text-gray-800">
                      {cls.name}
                    </option>
                  ))
                ) : null}
              </select>
              <div className="pointer-events-none absolute right-3 top-3 text-gray-600 text-xs">▼</div>
            </div>
            {classes.length === 0 && (
              <p className="text-xs text-accent mt-2">⚠️ No classes created yet. Go to Settings → Classes to add one.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Parent Name</label>
            <input
              type="text"
              required
              value={form.parent_name}
              onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              placeholder="Parent/Guardian name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Parent Phone</label>
            <input
              type="tel"
              required
              value={form.parent_phone}
              onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              placeholder="+256701234567"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-3 bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700 rounded-xl font-bold text-gray-800 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 className="animate-spin inline mr-2" size={18} /> : <UserPlus className="inline mr-2" size={18} />}
              Add Student
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Students = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);

  // Reset page when search or class changes
  useEffect(() => {
    setPage(1);
  }, [search, selectedClass]);

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/class-levels/');
      return res.data?.results || res.data || [];
    }
  });

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', selectedClass, search, page],
    queryFn: async () => {
      let url = `/students/?page=${page}&`;
      if (selectedClass) url += `class_level_id=${selectedClass}&`;
      if (search) url += `search=${search}`;
      const res = await api.get(url);
      return res.data;
    }
  });

  const students = studentsData?.results || (Array.isArray(studentsData) ? studentsData : []);
  const totalCount = studentsData?.count || students.length || 0;
  const totalPages = Math.ceil(totalCount / 10);

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/students/${id}/`),
    onSuccess: () => {
      toast.success('Student deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: () => toast.error('Failed to delete student')
  });

  const handleDeleteStudent = (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportCSV = async () => {
    const toastId = toast.loading('Preparing CSV export...');
    try {
      let url = '/students/?no_paginate=true&';
      if (selectedClass) url += `class_level_id=${selectedClass}&`;
      if (search) url += `search=${search}`;
      
      const res = await api.get(url);
      const dataToExport = res.data;
      
      if (!dataToExport || dataToExport.length === 0) {
        toast.error('No records found to export', { id: toastId });
        return;
      }

      const headers = ['First Name', 'Last Name', 'Student ID', 'Class Level', 'Parent Name', 'Parent Phone'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(s => [
          `"${s.first_name}"`,
          `"${s.last_name}"`,
          `"${s.student_id}"`,
          `"${s.class_level_name || 'N/A'}"`,
          `"${s.parent_name}"`,
          `"${s.parent_phone}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `students_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV Export downloaded!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Export failed', { id: toastId });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-gray-800">Student Directory</h1>
            <p className="text-gray-600 font-medium">Manage records and monitor fee status across all students.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 text-gray-800 font-bold rounded-2xl transition-all whitespace-nowrap"
            >
              <Download size={20} />
              Export CSV
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-3 px-8 py-4 bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-2xl active:scale-95 whitespace-nowrap"
            >
              <UserPlus size={20} />
              Add New Student
            </motion.button>
          </div>
        </header>

        {/* Replaced local error/success with react-hot-toast */}

        {/* DEBUG INFO */}
        <div className="p-4 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono text-slate-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500">Classes Loaded:</span> <span className="text-blue-600 font-bold">{classes.length}</span>
            </div>
            <div>
              <span className="text-slate-500">Page Loading:</span> <span className="text-blue-600 font-bold">{studentsLoading ? 'Yes' : 'No'}</span>
            </div>
            {classes.length > 0 && (
              <div className="col-span-2">
                <span className="text-slate-500">Class Names:</span> <span className="text-emerald-400">{classes.map(c => c.name).join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
            <input 
              type="text"
              placeholder="Search by name or registration ID..."
              className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 border border-gray-200 transition-all text-sm font-medium placeholder:text-gray-600/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {classes.length > 0 && (
            <div className="flex items-center gap-4 bg-white p-1 rounded-2xl border border-gray-200 min-w-fit">
              <div className="flex items-center gap-2 px-4 py-3">
                <Filter size={18} className="text-blue-600" />
                <div className="relative">
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer appearance-none pr-6 text-gray-800"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id} className="bg-white text-gray-800 text-gray-800">{c.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-0 top-0 text-gray-600 text-xs">▼</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="backdrop-blur-md bg-white/60 shadow-lg border border-gray-200 relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 shadow-lg hover:shadow-blue-600/30 hover:bg-blue-700" />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                  <th className="px-8 py-6">
                    <div className="flex items-center gap-2">Student <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="px-8 py-6">ID Number</th>
                  <th className="px-8 py-6">Academic Class</th>
                  <th className="px-8 py-6">Parent Contact</th>
                  <th className="px-8 py-6 text-right">Fee Balance</th>
                  <th className="px-8 py-6 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm font-medium">
                {studentsLoading ? (
                  <TableSkeleton rows={5} />
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center text-gray-600">
                      <div className="flex flex-col items-center gap-4 py-10 opacity-40">
                        <GraduationCap size={64} strokeWidth={1} />
                        <div className="space-y-1">
                          <p className="text-lg font-bold">No Students Found</p>
                          <p className="text-xs">Click "Add New Student" to register your first student.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      key={student.id} 
                      className="hover:bg-gray-50 transition-all border-b border-gray-200 group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-blue-700 bg-blue-100 ring-2 ring-white/50 uppercase">
                            {student?.first_name?.charAt(0) || ''}{student?.last_name?.charAt(0) || ''}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{student?.first_name || 'Unknown'} {student?.last_name || ''}</p>
                            <p className="text-xs text-gray-600">{student?.parent_name || 'No Parent Listed'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-mono text-xs font-bold text-blue-600">{student?.student_id}</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">{student?.class_level_name || 'N/A'}</span>
                      </td>
                      <td className="px-8 py-5 text-sm">{student?.parent_phone || 'N/A'}</td>
                      <td className="px-8 py-5 text-right font-bold">UGX 0</td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-2 hover:bg-accent/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} className="text-accent" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalCount)} of {totalCount} records
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft size={16} className="text-gray-800" />
                </button>
                <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-blue-600 shadow-sm">
                  Page {page} of {totalPages}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronRight size={16} className="text-gray-800" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddStudentModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        classes={classes}
      />
    </DashboardLayout>
  );
};

export default Students;
