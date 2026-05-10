import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import useMobile from '../hooks/useMobile';

const DashboardLayout = ({ children }) => {
  const isMobile = useMobile();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1628 0%, #062236 50%, #0a1f2e 100%)',
        backgroundAttachment: 'fixed',
      }}
      className="flex flex-col md:flex-row font-outfit relative overflow-hidden"
    >
      {/* Cyan glow blobs */}
      <div className="blob-tl" />
      <div className="blob-br" />
      {/* Extra mid blob */}
      <div style={{
        position: 'absolute', top: '50%', left: '55%',
        width: '340px', height: '340px',
        background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
        transform: 'translate(-50%,-50%)',
      }} />

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
