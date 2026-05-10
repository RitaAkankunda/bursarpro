import { Link } from 'react-router-dom';
import React from 'react';
import { Wallet, LogIn, Users, ShieldCheck, ArrowRight, Download, CreditCard, MessageSquare, CheckCircle2, Key, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

// Text animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

// Floating animation
const floatingVariants = {
  initial: { y: 0 },
  animate: {
    y: [-20, 20, -20],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Ripple button effect
const RippleButton = ({ children, to, ...props }) => {
  const [ripples, setRipples] = React.useState([]);

  const addRipple = (e) => {
    const button = e.currentTarget;
    const size = Math.max(button.clientWidth, button.clientHeight);
    const x = e.clientX - button.offsetLeft - size / 2;
    const y = e.clientY - button.offsetTop - size / 2;
    
    const ripple = { x, y, size, id: Date.now() };
    setRipples([ripple]);
    
    setTimeout(() => setRipples([]), 600);
  };

  return (
    <Link to={to} {...props} onClick={addRipple} className="relative overflow-hidden">
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
      {children}
    </Link>
  );
};

const FeatureCard = ({ icon, svg, title, desc, delay, color = 'from-blue-500 to-cyan-600' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20, rotateX: -10 }}
    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
    whileHover={{ y: -10, scale: 1.02 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="group relative overflow-hidden perspective"
  >
    <div className={bsolute inset-0 bg-gradient-to-br $\{color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl blur-xl} />
    <motion.div 
      whileHover={{ scale: 1.03 }}
      className="relative backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-lg group-hover:border-white/20 transition-all duration-300"
    >
      {svg ? (
        <motion.div 
          whileHover={{ scale: 1.08 }}
          className="w-full h-48 mb-6 rounded-lg overflow-hidden shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center"
        >
          {svg}
        </motion.div>
      ) : (
        <motion.div
          whileHover={{ scale: 1.15, rotate: 12 }}
          transition={{ type: 'spring', stiffness: 400 }}
          className={inline-flex p-4 bg-gradient-to-br $\{color} rounded-xl mb-6 shadow-lg}
        >
          <div className="text-white">{icon}</div>
        </motion.div>
      )}
      <motion.h3 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
        className="text-xl font-bold mb-3 text-white transition-colors"
      >
        {title}
      </motion.h3>
      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
        className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors"
      >
        {desc}
      </motion.p>
    </motion.div>
  </motion.div>
);

const TestimonialCard = ({ stars, quote, author, role, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, rotateY: -10 }}
    whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
    whileHover={{ y: -5, scale: 1.02 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4 hover:border-white/20 hover:bg-white/10 transition-all group cursor-pointer"
  >
    <motion.div className="flex gap-1">
      {[...Array(stars)].map((_, i) => (
        <motion.span 
          key={i} 
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + i * 0.1 }}
          viewport={{ once: true }}
          className="text-yellow-400 text-lg"
        >
          ★
        </motion.span>
      ))}
    </motion.div>
    <motion.p 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ delay: delay + 0.2 }}
      viewport={{ once: true }}
      className="text-gray-300 italic leading-relaxed text-lg font-light group-hover:text-white transition-colors"
    >
      "{quote}"
    </motion.p>
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.3 }}
      viewport={{ once: true }}
      className="flex items-center gap-3 pt-4 border-t border-white/5 group-hover:border-white/10 transition-colors"
    >
      <motion.div 
        whileHover={{ scale: 1.15 }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold hover:shadow-lg transition-shadow"
      >
        {author.split(' ')[0][0]}{author.split(' ')[1][0]}
      </motion.div>
      <div>
        <p className="font-bold text-white">{author}</p>
        <p className="text-xs text-gray-400">{role}</p>
      </div>
    </motion.div>
  </motion.div>
);

const Landing = () => {
  return (
    <div 
      className="min-h-screen text-white selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden font-outfit"
      style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #062236 50%, #0a1f2e 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '0', left: '0',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)',
          transform: 'translate(-30%, -30%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '0', right: '0',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(80px)',
          transform: 'translate(30%, 30%)',
        }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1628]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">Bursar<span className="text-blue-500">Pro</span></span>
            </Link>
            
            <div className="hidden md:flex items-center gap-10">
              {['Features', 'Dashboard', 'Pricing', 'Resources'].map((item) => (
                <a key={item} href={#$\{item.toLowerCase()}} className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">{item}</a>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">Sign In</Link>
            <Link to="/register" className="px-8 py-3.5 bg-white text-black text-sm font-black rounded-xl hover:bg-gray-100 transition-all uppercase tracking-widest shadow-xl">Join Now</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-12">
        {/* Hero Section */}
        <div id="dashboard" className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-12">
          {/* Left side */}
          <div className="space-y-10 relative">
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="space-y-10 relative"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-blue-400 text-xs font-bold uppercase tracking-[0.2em]"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Next Gen School Governance</span>
              </motion.div>

              <div className="space-y-6">
                <motion.h1 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-6xl md:text-8xl font-black tracking-tight leading-[0.85] text-white"
                >
                  <motion.span variants={itemVariants} className="block">
                    Finance.
                  </motion.span>
                  <motion.span variants={itemVariants} className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
                    Simplified.
                  </motion.span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-xl text-gray-400 font-light leading-relaxed max-w-lg"
                >
                  The all-in-one financial operating system for modern African schools. Track every UGX, automate collections, and empower parents.
                </motion.p>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col gap-8 pt-4"
            >
              <div className="flex flex-wrap items-center gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <RippleButton to="/register" className="px-10 py-5 bg-white text-black font-black rounded-2xl transition-all text-lg flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]">
                    Start Free Trial
                    <ArrowRight size={22} strokeWidth={3} />
                  </RippleButton>
                </motion.div>
                
                <motion.a whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }} whileTap={{ scale: 0.98 }} href="#features" className="px-10 py-5 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl font-bold text-lg text-white transition-all flex items-center gap-2">
                  Quick Demo <ArrowRight size={18} className="rotate-90 md:rotate-0" />
                </motion.a>
              </div>

              <div className="flex items-center gap-6 py-2 border-t border-white/5 w-fit">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a1628] bg-gray-800" />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-[#0a1628] bg-blue-600 flex items-center justify-center text-[10px] font-bold">+</div>
                </div>
                <p className="text-gray-500 text-sm font-medium">Joined by <span className="text-white">500+ educators</span> this month</p>
              </div>
            </motion.div>
          </div>

          {/* Right side - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, type: 'spring' }}
            variants={floatingVariants}
            className="hidden lg:block relative"
          >
            <div className="relative z-20 rounded-[2.5rem] p-4 bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
              <div className="rounded-[1.8rem] overflow-hidden bg-[#0d121f] border border-white/5 aspect-[4/3]">
                <svg viewBox="0 0 800 600" className="w-full h-full">
                  <rect width="800" height="600" fill="#0d121f" />
                  <rect width="800" height="60" fill="rgba(255,255,255,0.02)" />
                  <circle cx="30" cy="30" r="5" fill="#ff5f56" />
                  <circle cx="50" cy="30" r="5" fill="#ffbd2e" />
                  <circle cx="70" cy="30" r="5" fill="#27c93f" />
                  <rect x="40" y="100" width="220" height="120" rx="20" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.2)" />
                  <rect x="290" y="100" width="220" height="120" rx="20" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" />
                  <rect x="540" y="100" width="220" height="120" rx="20" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" />
                  <path d="M40 500 Q 150 450, 300 480 T 550 400 T 760 350" fill="none" stroke="#60a5fa" strokeWidth="4" />
                </svg>
              </div>
            </div>

            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-12 top-20 z-30 p-6 bg-emerald-500/20 backdrop-blur-2xl border border-emerald-400/30 rounded-3xl shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/50">
                   <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Verified</p>
                  <p className="text-white font-bold">Payment Synced</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Features Header */}
        <section id="features" className="py-24 max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20 space-y-4"
          >
            <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em]">The Platform</h2>
            <p className="text-4xl md:text-6xl font-black text-white tracking-tighter">Everything you need <br /> <span className="text-gray-600">to scale your school.</span></p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck size={32} />}
              title="Fraud-Proof Billing"
              desc="Bank-grade security for every transaction. Instant receipt generation and balance tracking for parents."
              delay={0.1}
              color="from-blue-600 to-indigo-600"
            />
            <FeatureCard 
              icon={<Users size={32} />}
              title="Parent Intelligence"
              desc="Beautifully designed parent portals to check balances, download statements, and receive instant alerts."
              delay={0.2}
              color="from-cyan-500 to-blue-600"
            />
            <FeatureCard 
              icon={<TrendingUp size={32} />}
              title="Financial Analytics"
              desc="Real-time collection reports and projections. Understand your school's health in one click."
              delay={0.3}
              color="from-indigo-500 to-purple-600"
            />
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-8 mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { number: '50+', label: 'Schools' },
                { number: '15K+', label: 'Students' },
                { number: '2.5B', label: 'UGX Collected' },
                { number: '99.9%', label: 'Uptime' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center cursor-pointer"
                >
                  <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2"
                  >
                    {stat.number}
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    viewport={{ once: true }}
                    className="text-gray-400 font-medium uppercase text-xs tracking-wider"
                  >
                    {stat.label}
                  </motion.p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 bg-white/5 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em]">Success Stories</h2>
                <p className="text-4xl font-black text-white tracking-tighter">Loved by <br />African <br />Principals.</p>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a1628] bg-gray-800" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-400 font-bold">50+ Verified Schools</p>
                </div>
              </div>
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <TestimonialCard 
                  stars={5}
                  quote="BursarPro transformed our collection process. No more missing receipts or manual errors."
                  author="Richard Baguma"
                  role="Headteacher, Kampala Parents"
                  delay={0.1}
                />
                <TestimonialCard 
                  stars={5}
                  quote="The parent portal is a game changer. Parents can track their balance from home."
                  author="Sarah Namutebi"
                  role="Bursar, Gayaza High"
                  delay={0.2}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="support" className="py-32">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="max-w-5xl mx-auto p-12 rounded-[3rem] bg-gradient-to-tr from-blue-600 to-indigo-700 relative overflow-hidden text-center space-y-8"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-48 -mt-48" />
            
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">Ready to automate?</h2>
            <p className="text-xl text-blue-100 max-w-xl mx-auto font-medium">Join hundreds of schools modernizing their financial operations today.</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Link to="/register" className="px-12 py-5 bg-white text-blue-600 font-black rounded-2xl text-lg shadow-2xl transition-transform hover:-translate-y-1">
                Create Free Account
              </Link>
              <a href="tel:+256708605557" className="px-12 py-5 bg-blue-700 text-white font-black rounded-2xl text-lg border border-white/20 hover:bg-blue-800 transition-all">
                Talk to Sales
              </a>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black text-white tracking-tighter">Bursar<span className="text-blue-500">Pro</span></span>
              </Link>
              <p className="text-gray-400 max-w-sm text-lg font-medium leading-relaxed">
                Empowering the next generation of African schools with premium financial tools.
              </p>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Platform</h4>
              <ul className="space-y-4 text-gray-400 font-bold">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#dashboard" className="hover:text-blue-400 transition-colors">Dashboard</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Company</h4>
              <ul className="space-y-4 text-gray-400 font-bold">
                <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5 text-gray-500 text-sm font-bold uppercase tracking-widest">
            <p>© 2026 BursarPro. Made for Africa.</p>
            <div className="flex gap-8">
              <span>English (UG)</span>
              <span>Status: Online</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
