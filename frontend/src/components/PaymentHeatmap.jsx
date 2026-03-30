/**
 * Interactive Payment Heatmap Component
 * Calendar-style heat visualization of payment activity by day
 */
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

const PaymentHeatmap = ({ termId, maxValue = 5000000 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState(null);

  // Generate array of days for the current month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getIntensity = (amount) => {
    if (!amount) return 0;
    return Math.min(100, (amount / maxValue) * 100);
  };

  const getColor = (intensity) => {
    if (intensity === 0) return '#f3f4f6';
    if (intensity < 25) return '#bfdbfe';
    if (intensity < 50) return '#60a5fa';
    if (intensity < 75) return '#3b82f6';
    return '#1e40af';
  };

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        const headers = {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        };

        // Fetch all payments for the term
        const response = await api.get('/payments/', {
          params: {
            term: termId,
            limit: 1000
          },
          headers
        });

        const payments = Array.isArray(response.data) ? response.data : response.data.results || [];

        // Aggregate payments by date
        const heatmapData = {};
        payments.forEach((payment) => {
          const date = new Date(payment.payment_date);
          const day = date.getDate();
          heatmapData[day] = (heatmapData[day] || 0) + parseFloat(payment.amount);
        });

        setData(heatmapData);
      } catch (err) {
        console.error('Error fetching heatmap data:', err);
        setData({});
      } finally {
        setLoading(false);
      }
    };

    if (termId) {
      fetchPaymentData();
    }
  }, [termId, currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatCurrency = (amount) => {
    if (!amount) return 'No data';
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="backdrop-blur-md bg-white/60 p-6 rounded-2xl border border-white/30 shadow-lg"
      >
        <div className="h-64 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg animate-pulse" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-md bg-white/60 p-6 rounded-2xl border border-white/30 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">💰 Payment Activity Heatmap</h3>
          <p className="text-xs text-gray-600 mt-1">Daily payment volume visualization</p>
        </div>
        <TrendingUp size={24} className="text-blue-500" />
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>

        <h4 className="text-base font-bold text-gray-800 uppercase tracking-wider">
          {monthName}
        </h4>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {dayLabels.map((day) => (
          <div key={day} className="text-center">
            <p className="text-xs font-bold text-gray-600 uppercase">{day}</p>
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {days.map((day, index) => {
          const amount = day ? data[day] : null;
          const intensity = day ? getIntensity(amount) : 0;
          const color = getColor(intensity);

          return (
            <motion.div
              key={index}
              whileHover={day ? { scale: 1.1 } : {}}
              onMouseEnter={() => day && setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              className="relative aspect-square rounded-lg cursor-pointer transition-all duration-200 group"
              style={{ backgroundColor: color }}
            >
              {day && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">{day}</span>
                  </div>

                  {/* Tooltip on hover */}
                  {hoveredDay === day && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: -50 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-1/2 transform -translate-x-1/2 z-10 whitespace-nowrap"
                    >
                      <div className="bg-gray-800 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xl mb-2">
                        {formatCurrency(amount)}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </div>
                    </motion.div>
                  )}

                  {/* Glow effect for high-value days */}
                  {intensity >= 75 && (
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 10px rgba(59, 130, 246, 0.3)',
                          '0 0 20px rgba(59, 130, 246, 0.5)',
                          '0 0 10px rgba(59, 130, 246, 0.3)',
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-lg"
                    />
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 font-medium">Intensity Scale:</p>
        <div className="flex gap-1 items-center">
          <div className="text-xs text-gray-600">No data</div>
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f3f4f6' }} />

          <div className="text-xs text-gray-600">Low</div>
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#bfdbfe' }} />

          <div className="text-xs text-gray-600">Medium</div>
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#60a5fa' }} />

          <div className="text-xs text-gray-600">High</div>
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#1e40af' }} />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-blue-600">
              {Object.keys(data).length}
            </p>
            <p className="text-xs text-gray-600 font-medium mt-1">Active Days</p>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600">
              {formatCurrency(Object.values(data).reduce((a, b) => a + b, 0))}
            </p>
            <p className="text-xs text-gray-600 font-medium mt-1">Total Collected</p>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600">
              {formatCurrency(Object.values(data).length > 0 ? Object.values(data).reduce((a, b) => a + b, 0) / Object.keys(data).length : 0)}
            </p>
            <p className="text-xs text-gray-600 font-medium mt-1">Avg per Day</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentHeatmap;
