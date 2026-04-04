import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import useMobile from '../hooks/useMobile';

const DashboardLayout = ({ children }) => {
  const isMobile = useMobile();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col md:flex-row font-outfit">
      <Sidebar />
      <main className={`flex-1 p-4 md:p-10 overflow-y-auto w-full animate-in fade-in slide-in-from-right-4 duration-500 ${isMobile ? 'mt-16 pt-6' : ''}`}>
        <GlobalSearch />
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
