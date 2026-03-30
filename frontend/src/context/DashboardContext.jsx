import { createContext, useState, useContext } from 'react';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);

  const updateStats = (newStats) => {
    setDashboardStats(newStats);
  };

  const updateTerm = (termId) => {
    setSelectedTerm(termId);
  };

  // Refresh stats by adding collected amount
  const addPayment = (amount) => {
    setDashboardStats(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        total_collected: parseFloat(prev.total_collected) + parseFloat(amount),
        total_outstanding: parseFloat(prev.total_outstanding) - parseFloat(amount),
        collection_rate_percent: calculateCollectionRate(
          parseFloat(prev.total_collected) + parseFloat(amount),
          prev.total_expected
        )
      };
    });
  };

  const calculateCollectionRate = (collected, expected) => {
    return expected > 0 ? Math.round((collected / expected) * 100 * 10) / 10 : 0;
  };

  return (
    <DashboardContext.Provider value={{ dashboardStats, setDashboardStats, selectedTerm, setSelectedTerm, updateStats, updateTerm, addPayment }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};
