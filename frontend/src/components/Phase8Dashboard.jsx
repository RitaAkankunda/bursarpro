/**
 * Phase 8 Dashboard - Integrated View
 * Combines Analytics, Refunds, Currency, and Reporting features
 */
import React, { useState } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';
import RefundManagement from './RefundManagement';
import CurrencyManagement from './CurrencyManagement';
import ReportingManagement from './ReportingManagement';

const Phase8Dashboard = () => {
  const [activeView, setActiveView] = useState('analytics');

  const navItems = [
    { id: 'analytics', label: '📊 Analytics', icon: '📈' },
    { id: 'refunds', label: '💰 Refunds', icon: '💵' },
    { id: 'currency', label: '💱 Currency', icon: '🌍' },
    { id: 'reporting', label: '📋 Reports', icon: '📄' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-lg overflow-y-auto">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">BursarPro</h1>
          <p className="text-sm text-gray-500 mt-1">Phase 8 Dashboard</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                activeView === item.id
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t">
          <p className="text-xs text-gray-600 text-center">
            Secure Financial Management System
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            v1.0.0 - Phase 8
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {navItems.find(i => i.id === activeView)?.label}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage your school's financial operations
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                ✓ System Online
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                BS
              </div>
            </div>
          </div>
        </div>

        {/* Content Views */}
        <div className="px-0 py-0">
          {activeView === 'analytics' && <AnalyticsDashboard />}
          {activeView === 'refunds' && <RefundManagement />}
          {activeView === 'currency' && <CurrencyManagement />}
          {activeView === 'reporting' && <ReportingManagement />}
        </div>
      </div>
    </div>
  );
};

export default Phase8Dashboard;
