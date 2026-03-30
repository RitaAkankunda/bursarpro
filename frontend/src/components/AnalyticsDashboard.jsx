/**
 * Analytics Dashboard Component
 * Displays payment analytics, forecasts, and payment method trends
 */
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [forecasts, setForecasts] = useState(null);
  const [methodTrends, setMethodTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days

  const API_BASE = 'http://localhost:8000/api/v1';

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      };

      // Fetch payment analytics
      const analyticsRes = await axios.get(`${API_BASE}/payment-analytics/summary/`, {
        params: {
          school: localStorage.getItem('school_id'),
          term: localStorage.getItem('term_id')
        },
        headers
      });
      setAnalytics(analyticsRes.data);

      // Fetch forecasts
      const forecastRes = await axios.get(`${API_BASE}/payment-forecasts/`, {
        params: {
          school: localStorage.getItem('school_id'),
          term: localStorage.getItem('term_id')
        },
        headers
      });
      setForecasts(forecastRes.data);

      // Fetch payment method trends
      const trendsRes = await axios.get(`${API_BASE}/payment-method-trends/`, {
        params: {
          school: localStorage.getItem('school_id'),
          term: localStorage.getItem('term_id')
        },
        headers
      });
      setMethodTrends(trendsRes.data);

      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">📊 Loading analytics...</div>;
  }

  if (error) {
    return <div className="p-8 bg-red-50 border border-red-200 rounded-lg">⚠️ Error: {error}</div>;
  }

  // Prepare chart data
  const forecastData = forecasts?.results?.map(f => ({
    date: new Date(f.forecast_date).toLocaleDateString(),
    predicted: f.predicted_total,
    confidence: f.confidence_level
  })) || [];

  const paymentMethodData = methodTrends?.results?.map(t => ({
    name: t.dominant_method,
    cash: t.cash_percentage,
    bank: t.bank_percentage,
    cheque: t.cheque_percentage,
    mobile: t.mobile_percentage
  })) || [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📊 Analytics Dashboard</h1>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard 
          title="Total Payments" 
          value={analytics?.total_payments || 0}
          icon="💰"
        />
        <SummaryCard 
          title="Total Amount" 
          value={`KES ${(analytics?.total_amount || 0).toLocaleString()}`}
          icon="💵"
        />
        <SummaryCard 
          title="Average Payment" 
          value={`KES ${(analytics?.average_payment || 0).toLocaleString()}`}
          icon="📊"
        />
        <SummaryCard 
          title="Forecasted Total" 
          value={`KES ${(forecasts?.results?.[0]?.predicted_total || 0).toLocaleString()}`}
          icon="🔮"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Forecast Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📈 Payment Forecast (30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="predicted" stroke="#3b82f6" name="Predicted Total" />
              <Line type="monotone" dataKey="confidence" stroke="#10b981" name="Confidence %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">💱 Payment Methods Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Cash', value: analytics?.cash_payments || 0 },
                  { name: 'Bank', value: analytics?.bank_payments || 0 },
                  { name: 'Cheque', value: analytics?.cheque_payments || 0 },
                  { name: 'Mobile', value: analytics?.mobile_payments || 0 }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Method Trends */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">📊 Payment Method Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={paymentMethodData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cash" stackId="a" fill="#3b82f6" name="Cash %" />
            <Bar dataKey="bank" stackId="a" fill="#10b981" name="Bank %" />
            <Bar dataKey="cheque" stackId="a" fill="#f59e0b" name="Cheque %" />
            <Bar dataKey="mobile" stackId="a" fill="#ef4444" name="Mobile %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights Section */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-4">💡 Insights</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="mr-3">✓</span>
            <span>Most popular payment method: {methodTrends?.results?.[0]?.dominant_method || 'N/A'}</span>
          </li>
          <li className="flex items-center">
            <span className="mr-3">✓</span>
            <span>30-day forecast confidence: {forecasts?.results?.[0]?.confidence_level || 0}%</span>
          </li>
          <li className="flex items-center">
            <span className="mr-3">✓</span>
            <span>Total transactions this period: {analytics?.total_payments || 0}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
  </div>
);

export default AnalyticsDashboard;
