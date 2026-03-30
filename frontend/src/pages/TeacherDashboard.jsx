import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, Users, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [expandedClass, setExpandedClass] = useState(null);

  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (userRole !== 'TEACHER') {
      navigate('/login');
      return;
    }
    fetchDashboard();
  }, [userRole, navigate]);

  const fetchDashboard = async (termId = null) => {
    try {
      setLoading(true);
      const params = termId ? `?term_id=${termId}` : '';
      console.log('Fetching:', `/teacher-dashboard/${params}`);
      const response = await api.get(`/teacher-dashboard/${params}`);
      console.log('Response:', response.data);
      setDashboard(response.data);
      
      if (!selectedTerm && response.data.term_id) {
        setSelectedTerm(response.data.term_id);
      }
      
      setError('');
    } catch (err) {
      console.error('Full error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(`Failed: ${err.response?.status || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTermChange = (termId) => {
    setSelectedTerm(termId);
    fetchDashboard(termId);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-700 font-bold">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-white/80 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20 text-center space-y-4"
        >
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">{error || 'Unable to Load'}</h2>
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Return to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              Teacher Dashboard
            </h1>
            <p className="text-gray-600 text-sm font-medium">{dashboard.school}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 bg-white hover:bg-gray-100 rounded-lg transition border border-gray-200"
            title="Logout"
          >
            <LogOut size={20} className="text-gray-700" />
          </button>
        </motion.div>

        {/* Term Selector */}
        {dashboard.terms && dashboard.terms.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-md bg-white/50 rounded-xl p-4 border border-white/30"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Term:
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => handleTermChange(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dashboard.terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {/* Overview Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Classes</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{dashboard.total_classes}</p>
              </div>
              <BookOpen className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/60 rounded-xl p-6 border border-white/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Current Term</p>
                <p className="text-2xl font-bold text-indigo-600 mt-2">{dashboard.term}</p>
              </div>
              <Users className="w-12 h-12 text-indigo-200" />
            </div>
          </div>
        </motion.div>

        {/* Classes List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Your Classes
          </h2>

          {dashboard.classes && dashboard.classes.length > 0 ? (
            <div className="space-y-3">
              {dashboard.classes.map((classItem, idx) => (
                <motion.div
                  key={classItem.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                  className="backdrop-blur-md bg-white/70 rounded-xl border border-white/30 shadow-lg overflow-hidden"
                >
                  {/* Class Header */}
                  <button
                    onClick={() =>
                      setExpandedClass(expandedClass === classItem.id ? null : classItem.id)
                    }
                    className="w-full p-6 hover:bg-white/50 transition flex items-center justify-between"
                  >
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{classItem.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {classItem.total_students} students • UGX{' '}
                        {(classItem.fee_amount || 0).toLocaleString()} per student
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        UGX {classItem.total_collected.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">collected this term</p>
                    </div>
                  </button>

                  {/* Class Stats */}
                  <div className="px-6 py-3 bg-gray-50/50 border-t border-white/30 flex gap-4 text-sm">
                    <span className="px-3 py-1 bg-green-100/50 text-green-700 rounded-full font-semibold">
                      ✓ Paid: {classItem.students_paid}
                    </span>
                    <span className="px-3 py-1 bg-orange-100/50 text-orange-700 rounded-full font-semibold">
                      ⚠ Unpaid: {classItem.students_unpaid}
                    </span>
                  </div>

                  {/* Expanded Students List */}
                  {expandedClass === classItem.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 py-4 bg-white/30 border-t border-white/30"
                    >
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Students in {classItem.name}:
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {classItem.students && classItem.students.length > 0 ? (
                          classItem.students.map((student) => (
                            <div
                              key={student.id}
                              className="p-3 bg-white/50 rounded-lg flex justify-between items-center"
                            >
                              <div>
                                <p className="font-semibold text-gray-800">{student.name}</p>
                                <p className="text-xs text-gray-600">{student.admission_no}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No students in this class</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="backdrop-blur-md bg-white/70 rounded-xl p-8 border border-white/30 text-center">
              <p className="text-gray-600 font-medium">No classes assigned yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
