import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex font-outfit">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto w-full animate-in fade-in slide-in-from-right-4 duration-500">
        <GlobalSearch />
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
