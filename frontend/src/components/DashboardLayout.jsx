import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import useMobile from '../hooks/useMobile';

const DashboardLayout = ({ children }) => {
  const isMobile = useMobile();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f8faf5 0%, #f1f7ee 55%, #eef5ea 100%)',
        backgroundAttachment: 'fixed',
      }}
      className="flex flex-col md:flex-row font-outfit relative overflow-hidden"
    >


      <Sidebar />

      <main
        className={`flex-1 overflow-y-auto w-full relative z-10 ${isMobile ? 'mt-16 pt-4 px-3 pb-8' : 'p-6 md:p-8'}`}
      >
        <GlobalSearch />
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
