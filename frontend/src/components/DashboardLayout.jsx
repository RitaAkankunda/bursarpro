import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import useMobile from '../hooks/useMobile';

const DashboardLayout = ({ children }) => {
  const isMobile = useMobile();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col md:flex-row font-outfit relative overflow-hidden">
      {/* Animated gradient background elements for depth */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 -ml-32 -mt-32 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
      
      <Sidebar />
      <main className={`flex-1 p-4 md:p-10 overflow-y-auto w-full animate-in fade-in slide-in-from-right-4 duration-500 relative z-10 ${isMobile ? 'mt-16 pt-6' : ''}`}>
        <GlobalSearch />
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
