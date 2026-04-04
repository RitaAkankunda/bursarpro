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

const FeatureCard = ({ icon, svg, title, desc, delay, color = 'from-orange-500 to-amber-600' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20, rotateX: -10 }}
    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
    whileHover={{ y: -10, scale: 1.02 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="group relative overflow-hidden perspective"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl blur-xl`} />
    <motion.div 
      whileHover={{ scale: 1.03 }}
      className="relative backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-2xl shadow-lg group-hover:border-white/40 transition-all duration-300"
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
          className={`inline-flex p-4 bg-gradient-to-br ${color} rounded-xl mb-6 shadow-lg`}
        >
          <div className="text-white">{icon}</div>
        </motion.div>
      )}
      <motion.h3 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
        className="text-xl font-bold mb-3 group-hover:text-orange-600 transition-colors text-gray-800"
      >
        {title}
      </motion.h3>
      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
        className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors"
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
    className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 space-y-4 hover:border-white/40 hover:bg-white/15 transition-all group cursor-pointer"
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
      className="text-gray-700 italic leading-relaxed text-lg font-light group-hover:text-gray-600 transition-colors"
    >
      "{quote}"
    </motion.p>
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.3 }}
      viewport={{ once: true }}
      className="flex items-center gap-3 pt-4 border-t border-white/10 group-hover:border-white/20 transition-colors"
    >
      <motion.div 
        whileHover={{ scale: 1.15 }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold hover:shadow-lg transition-shadow"
      >
        {author.split(' ')[0][0]}{author.split(' ')[1][0]}
      </motion.div>
      <div>
        <p className="font-bold text-gray-900">{author}</p>
        <p className="text-xs text-gray-600">{role}</p>
      </div>
    </motion.div>
  </motion.div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white text-gray-900 selection:bg-blue-500 selection:text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-transparent opacity-15 blur-[150px] rounded-full animate-blob" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100 to-transparent opacity-10 blur-[150px] rounded-full animate-blob animation-delay-2000" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg">
              <Wallet className="text-white w-6 h-6" strokeWidth={2.5} />
            </div>
              <span className="text-2xl font-black tracking-tighter text-blue-600">BursarPro</span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-700">
            <a href="#dashboard" className="hover:text-blue-600 transition-colors">Dashboard</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a>
            <a href="#support" className="hover:text-blue-600 transition-colors">FAQ & Support</a>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Link 
              to="/login" 
              className="px-6 py-2.5 bg-gray-900/10 hover:bg-gray-900/20 border border-gray-400/30 rounded-xl font-semibold transition-all flex items-center gap-2 group text-gray-700"
            >
              <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Staff Login</span>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-12">
        {/* Hero Section with Dashboard */}
        <div id="dashboard" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12">
          {/* Left side - Text & CTA */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 border-2 border-blue-300 rounded-full text-white text-lg font-black uppercase tracking-widest shadow-2xl hover:shadow-3xl hover:from-blue-700 hover:to-blue-700 transition-all relative overflow-hidden mt-6"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-20 transition-opacity rounded-full" />
                <Sparkles size={28} className="animate-spin flex-shrink-0 relative z-10" strokeWidth={3} />
                <span className="relative z-10">Trusted by 50+ Schools Across Uganda</span>
              </motion.div>

              <div className="space-y-2">
                <motion.h1 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]"
                >
                  {['School', 'Finance,'].map((word, idx) => (
                    <motion.span key={idx} variants={itemVariants} className="inline-block mr-3">
                      {word}
                    </motion.span>
                  ))}
                  <motion.span variants={itemVariants} className="text-blue-600 inline-block">
                    Finally
                  </motion.span>
                  <br />
                  <motion.span variants={itemVariants} className="text-blue-600 inline-block">
                    Under Control.
                  </motion.span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-base md:text-lg text-gray-600 font-light leading-relaxed"
                >
                  Say goodbye to spreadsheets and confusion. Automate fee collection, track payments in real-time, and get instant insights—all in one elegant, powerful platform built for Ugandan schools.
                </motion.p>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col items-start justify-start gap-3 pt-2"
            >
              <div className="flex flex-col sm:flex-row items-start gap-3 w-full">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <RippleButton
                    to="/register" 
                    className="w-full px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl transition-all text-lg flex items-center justify-center gap-3 shadow-2xl hover:shadow-blue-500/50"
                  >
                    Get Started Free
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ArrowRight size={20} strokeWidth={3} />
                    </motion.div>
                  </RippleButton>
                </motion.div>
                <motion.a 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="#features"
                  className="w-full sm:w-auto px-10 py-4 backdrop-blur-xl bg-gray-900/10 border border-gray-400/30 rounded-xl font-bold transition-all text-lg text-gray-800 hover:bg-gray-900/20 hover:border-gray-500/50"
                >
                  View Features
                </motion.a>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-left"
              >
                <p className="text-sm text-gray-400 mb-2">👨‍👩‍👧 Parents: Track your child's balance instantly</p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RippleButton
                    to="/parent-login" 
                    className="inline-flex px-8 py-3 bg-blue-500/20 border border-blue-400/50 rounded-xl font-bold text-blue-600 hover:bg-blue-500/30 transition-all text-base gap-2 items-center"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Key size={18} strokeWidth={2.5} />
                    </motion.div>
                    Access Parent Portal
                  </RippleButton>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right side - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            variants={floatingVariants}
            initial="initial"
            animate="animate"
            className="relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 hidden lg:block"
          >
            <svg viewBox="0 0 900 675" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <rect width="900" height="675" fill="#0d1f5c"/>
              <rect x="0" y="0" width="180" height="675" fill="#091548"/>
              <rect x="20" y="30" width="140" height="32" rx="8" fill="#1a56ff"/>
              <text x="90" y="51" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace">BursarPro</text>
              <rect x="20" y="80" width="140" height="28" rx="6" fill="rgba(255,255,255,0.08)"/>
              <text x="40" y="99" fill="rgba(255,255,255,0.7)" fontSize="10" fontFamily="monospace">Dashboard</text>
              <rect x="180" y="0" width="720" height="56" fill="#0f2468"/>
              <text x="210" y="34" fill="white" fontSize="14" fontWeight="bold" fontFamily="monospace">Dashboard Overview — Term 1</text>
              <rect x="200" y="72" width="155" height="72" rx="10" fill="#0f2468"/>
              <text x="220" y="96" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="monospace">TOTAL COLLECTED</text>
              <text x="220" y="124" fill="white" fontSize="16" fontWeight="bold" fontFamily="monospace">UGX 48.2M</text>
              <rect x="370" y="72" width="155" height="72" rx="10" fill="#0f2468"/>
              <text x="390" y="96" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="monospace">STUDENTS PAID</text>
              <text x="390" y="124" fill="#4ade80" fontSize="16" fontWeight="bold" fontFamily="monospace">1,042 / 1,240</text>
              <rect x="540" y="72" width="155" height="72" rx="10" fill="#0f2468"/>
              <text x="560" y="96" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="monospace">OUTSTANDING</text>
              <text x="560" y="124" fill="#f87171" fontSize="16" fontWeight="bold" fontFamily="monospace">UGX 6.1M</text>
              <rect x="710" y="72" width="155" height="72" rx="10" fill="#1a56ff"/>
              <text x="730" y="96" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="monospace">COLLECTION RATE</text>
              <text x="730" y="124" fill="white" fontSize="16" fontWeight="bold" fontFamily="monospace">94.7%</text>
              <rect x="200" y="158" width="460" height="200" rx="10" fill="#0f2468"/>
              <text x="220" y="182" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="monospace">Collections by Week</text>
              <rect x="230" y="300" width="30" height="40" rx="3" fill="rgba(26,86,255,0.4)"/>
              <rect x="278" y="275" width="30" height="65" rx="3" fill="rgba(26,86,255,0.5)"/>
              <rect x="326" y="250" width="30" height="90" rx="3" fill="rgba(26,86,255,0.6)"/>
              <rect x="374" y="230" width="30" height="110" rx="3" fill="rgba(26,86,255,0.7)"/>
              <rect x="422" y="210" width="30" height="130" rx="3" fill="#1a56ff"/>
              <rect x="470" y="225" width="30" height="115" rx="3" fill="rgba(26,86,255,0.75)"/>
              <rect x="518" y="215" width="30" height="125" rx="3" fill="#1a56ff" opacity="0.9"/>
              <rect x="566" y="200" width="30" height="140" rx="3" fill="#f5c842"/>
              <line x1="220" y1="348" x2="610" y2="348" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              <rect x="672" y="158" width="193" height="200" rx="10" fill="#0f2468"/>
              <text x="692" y="182" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="monospace">Recent Payments</text>
              <line x1="682" y1="192" x2="855" y2="192" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              <text x="692" y="212" fill="white" fontSize="9" fontFamily="monospace">Aisha Nakato</text>
              <text x="692" y="225" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">S.3 — 2 min ago</text>
              <text x="845" y="218" textAnchor="end" fill="#4ade80" fontSize="9" fontFamily="monospace" fontWeight="bold">+320,000</text>
              <rect x="200" y="370" width="300" height="110" rx="10" fill="#0f2468"/>
              <text x="220" y="394" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="monospace">SMS Log</text>
              <rect x="220" y="404" width="260" height="22" rx="5" fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.3)" strokeWidth="1"/>
              <text x="235" y="419" fill="#4ade80" fontSize="8" fontFamily="monospace">✓ SMS sent → +256 772 *** 421</text>
            </svg>
          </motion.div>
        </div>

        {/* Bursars Trust Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="py-12 text-center mb-16 flex flex-col items-center gap-6"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="backdrop-blur-xl bg-gradient-to-r from-blue-50/80 to-purple-50/80 border border-blue-200/60 rounded-3xl px-8 py-8 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 shadow-lg hover:shadow-2xl transition-all"
          >
            <div className="flex -space-x-4">
              {[ { bg: 'from-blue-500 to-blue-600', letter: 'G' }, { bg: 'from-green-500 to-teal-600', letter: 'R' }, { bg: 'from-orange-500 to-orange-600', letter: 'P' }, { bg: 'from-yellow-400 to-yellow-500', letter: 'J', textColor: 'text-gray-900' } ].map((avatar, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.3, zIndex: 20 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center ${avatar.textColor || 'text-white'} font-bold text-lg border-4 border-white shadow-lg cursor-pointer`}
                >
                  {avatar.letter}
                </motion.div>
              ))}
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="text-left md:text-center flex-1"
            >
              <p className="text-gray-600 text-base font-medium leading-relaxed">
                <span className="text-gray-900 font-black text-xl md:text-2xl block mb-1">200+ School Leaders</span>
                <span className="text-gray-700">trust BursarPro with their finances across Uganda</span>
              </p>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Trusted By Schools */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="py-10 text-center space-y-8 mb-16"
        >
          <div className="space-y-1">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-blue-600 font-bold uppercase tracking-widest text-sm"
            >
              Trusted By Schools Across Uganda
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-4xl font-black text-gray-900"
            >
              Partners Including
            </motion.h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center justify-center">
            {[
              "🏫 Kampala Parents' School",
              "🏫 Gayaza High School", 
              "🏫 Kings College Budo",
              "🏫 St. Mary's Kitende",
              "🏫 Makerere College"
            ].map((school, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: 1.08, y: -5 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="backdrop-blur-xl bg-white/60 border border-blue-200/50 rounded-xl p-4 text-gray-700 font-semibold text-sm hover:border-orange-400/50 transition-all cursor-pointer shadow-lg hover:shadow-xl"
              >
                {school}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stats Section */}
        <section id="stats" className="py-12 mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
                    className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2"
                  >
                    {stat.number}
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    viewport={{ once: true }}
                    className="text-gray-700 font-medium uppercase text-xs tracking-wider"
                  >
                    {stat.label}
                  </motion.p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 space-y-10 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center space-y-2 max-w-2xl mx-auto"
          >
            <h2 className="text-4xl font-black tracking-tight text-gray-900">
              Powerful Features, Zero Complexity
            </h2>
            <p className="text-gray-600 text-base font-light">
              Everything modern schools need—designed specifically for the Ugandan education landscape.
            </p>
          </motion.div>

          {/* 5-Card Circular Layout: 4 corners + 1 center */}
          <div className="max-w-6xl mx-auto">
            {/* Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FeatureCard 
                svg={
                  <svg className="w-full h-full" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
                  <rect width="600" height="200" fill="#0f1e4a"/>
                  <line x1="0" y1="40" x2="600" y2="40" stroke="#1a2f6a" strokeWidth="1"/>
                  <line x1="0" y1="80" x2="600" y2="80" stroke="#1a2f6a" strokeWidth="1"/>
                  <line x1="0" y1="120" x2="600" y2="120" stroke="#1a2f6a" strokeWidth="1"/>
                  <line x1="0" y1="160" x2="600" y2="160" stroke="#1a2f6a" strokeWidth="1"/>
                  <line x1="100" y1="0" x2="100" y2="200" stroke="#1a2f6a" strokeWidth="1"/>
                  <line x1="200" y1="0" x2="200" y2="200" stroke="#1a2f6a" strokeWidth="1"/>
                  <line x1="300" y1="0" x2="300" y2="200" stroke="#1a2f6a" strokeWidth="1"/>
                  <line x1="400" y1="0" x2="400" y2="200" stroke="#1a2f6a" strokeWidth="1"/>
                  <line x1="500" y1="0" x2="500" y2="200" stroke="#1a2f6a" strokeWidth="1"/>
                  <path d="M300 30 L340 50 L340 100 Q340 140 300 160 Q260 140 260 100 L260 50 Z" fill="#1a56ff" opacity="0.9"/>
                  <path d="M300 50 L325 64 L325 100 Q325 128 300 142 Q275 128 275 100 L275 64 Z" fill="#4a7fff" opacity="0.7"/>
                  <rect x="288" y="90" width="24" height="20" rx="3" fill="white"/>
                  <path d="M292 90 Q292 78 300 78 Q308 78 308 90" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="300" cy="100" r="3" fill="#1a56ff"/>
                  <circle cx="300" cy="95" r="50" fill="none" stroke="#1a56ff" strokeWidth="1" opacity="0.3"/>
                  <circle cx="300" cy="95" r="70" fill="none" stroke="#1a56ff" strokeWidth="1" opacity="0.15"/>
                  <circle cx="80" cy="50" r="3" fill="#4a7fff" opacity="0.6"/>
                  <circle cx="520" cy="150" r="3" fill="#4a7fff" opacity="0.6"/>
                  <text x="300" y="185" textAnchor="middle" fill="#4a7fff" fontSize="10" opacity="0.5" fontFamily="monospace">AES-256 ENCRYPTED · DAILY BACKUP</text>
                </svg>
              }
              title="Bank-Level Security"
              desc="Military-grade encryption with daily automated backups. Your data is safer with us than it's ever been."
              delay={0.1}
              color="from-blue-500 to-blue-600"
            />
            <FeatureCard 
              svg={
                <svg className="w-full h-full" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
                  <rect width="600" height="200" fill="#1a1208"/>
                  <circle cx="300" cy="100" r="120" fill="#3d2a00" opacity="0.6"/>
                  <rect x="210" y="15" width="180" height="170" rx="4" fill="#fffbf0" style={{filter: "drop-shadow(4px 6px 8px rgba(0,0,0,0.35))"}}/>
                  <rect x="210" y="15" width="180" height="30" rx="4" fill="#f5c842"/>
                  <text x="300" y="35" textAnchor="middle" fill="#1a1208" fontSize="10" fontWeight="bold" fontFamily="monospace">BURSARPRO RECEIPT</text>
                  <text x="225" y="60" fill="#6b5c30" fontSize="7.5" fontFamily="monospace">Student: John Mukasa</text>
                  <text x="225" y="74" fill="#6b5c30" fontSize="7.5" fontFamily="monospace">Class: S.4 West</text>
                  <text x="225" y="88" fill="#6b5c30" fontSize="7.5" fontFamily="monospace">Term: Term 1 2026</text>
                  <line x1="220" y1="96" x2="382" y2="96" stroke="#e0d4a0" strokeWidth="1" strokeDasharray="4,3"/>
                  <text x="225" y="110" fill="#6b5c30" fontSize="7.5" fontFamily="monospace">Tuition Fee</text>
                  <text x="370" y="110" textAnchor="end" fill="#6b5c30" fontSize="7.5" fontFamily="monospace">250,000</text>
                  <text x="225" y="123" fill="#6b5c30" fontSize="7.5" fontFamily="monospace">Boarding</text>
                  <text x="370" y="123" textAnchor="end" fill="#6b5c30" fontSize="7.5" fontFamily="monospace">180,000</text>
                  <circle cx="340" cy="155" r="22" fill="none" stroke="#22c55e" strokeWidth="2.5" opacity="0.7"/>
                  <text x="340" y="161" textAnchor="middle" fill="#22c55e" fontSize="18" opacity="0.7">✓</text>
                  <rect x="240" y="165" width="120" height="12" rx="2" fill="none" stroke="#d4c89a" strokeWidth="1"/>
                  <line x1="244" y1="167" x2="244" y2="175" stroke="#6b5c30" strokeWidth="1.5"/>
                  <line x1="248" y1="167" x2="248" y2="175" stroke="#6b5c30" strokeWidth="3"/>
                  <line x1="253" y1="167" x2="253" y2="175" stroke="#6b5c30" strokeWidth="1"/>
                </svg>
              }
              title="Pro Receipts"
              desc="Generate beautiful, official PDF receipts instantly. Print or email with a single click."
              delay={0.3}
              color="from-purple-500 to-pink-600"
            />
            </div>

            {/* Center Card */}
            <div className="flex justify-center mb-6">
              <div className="w-full md:w-1/2">
            <FeatureCard 
              svg={
                <svg className="w-full h-full" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
                  <rect width="600" height="200" fill="#13082a"/>
                  <circle cx="300" cy="100" r="130" fill="#1e0d3f" opacity="0.8"/>
                  <rect x="80" y="50" width="150" height="90" rx="12" fill="#f5c842" transform="rotate(-8 155 95)"/>
                  <text x="98" y="80" fill="#1a1208" fontSize="9" fontWeight="bold" fontFamily="monospace" transform="rotate(-8 155 95)">MOBILE MONEY</text>
                  <text x="98" y="98" fill="#1a1208" fontSize="7" fontFamily="monospace" transform="rotate(-8 155 95)">+256 7XX XXX XXX</text>
                  <text x="98" y="115" fill="#1a1208" fontSize="11" fontWeight="bold" fontFamily="monospace" transform="rotate(-8 155 95)">MTN</text>
                  <rect x="200" y="55" width="150" height="90" rx="12" fill="#1a56ff" transform="rotate(3 275 100)"/>
                  <text x="215" y="82" fill="white" fontSize="9" fontWeight="bold" fontFamily="monospace" transform="rotate(3 275 100)">BANK TRANSFER</text>
                  <text x="215" y="98" fill="rgba(255,255,255,0.7)" fontSize="7" fontFamily="monospace" transform="rotate(3 275 100)">**** **** **** 4821</text>
                  <circle cx="240" cy="110" r="10" fill="rgba(255,255,255,0.2)" transform="rotate(3 275 100)"/>
                  <circle cx="252" cy="110" r="10" fill="rgba(255,255,255,0.15)" transform="rotate(3 275 100)"/>
                  <rect x="320" y="45" width="150" height="90" rx="12" fill="#16a34a" transform="rotate(6 395 90)"/>
                  <text x="335" y="72" fill="white" fontSize="9" fontWeight="bold" fontFamily="monospace" transform="rotate(6 395 90)">CASH PAYMENT</text>
                  <text x="335" y="90" fill="rgba(255,255,255,0.8)" fontSize="18" fontFamily="monospace" transform="rotate(6 395 90)">UGX</text>
                  <rect x="220" y="155" width="160" height="26" rx="13" fill="#7c3aed"/>
                  <text x="300" y="173" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="monospace">ONE UNIFIED LEDGER</text>
                </svg>
              }
              title="All Payment Methods"
              desc="Track Mobile Money, Bank Transfers, Cash, and Cheques in one unified ledger system."
              delay={0.4}
              color="from-orange-500 to-red-600"
            />
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard 
              svg={
                <svg className="w-full h-full" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
                  <rect width="600" height="200" fill="#071a2e"/>
                  <rect x="40" y="20" width="520" height="28" rx="6" fill="#0d3060"/>
                  <text x="60" y="39" fill="#93c5fd" fontSize="8.5" fontFamily="monospace" fontWeight="bold">NAME</text>
                  <text x="190" y="39" fill="#93c5fd" fontSize="8.5" fontFamily="monospace" fontWeight="bold">CLASS</text>
                  <text x="290" y="39" fill="#93c5fd" fontSize="8.5" fontFamily="monospace" fontWeight="bold">PAID</text>
                  <text x="380" y="39" fill="#93c5fd" fontSize="8.5" fontFamily="monospace" fontWeight="bold">BALANCE</text>
                  <text x="480" y="39" fill="#93c5fd" fontSize="8.5" fontFamily="monospace" fontWeight="bold">STATUS</text>
                  <rect x="40" y="52" width="520" height="24" rx="4" fill="#0a2444"/>
                  <text x="60" y="68" fill="#e2e8f0" fontSize="8" fontFamily="monospace">Aisha Nakato</text>
                  <text x="190" y="68" fill="#e2e8f0" fontSize="8" fontFamily="monospace">S.3 East</text>
                  <text x="290" y="68" fill="#22c55e" fontSize="8" fontFamily="monospace">320,000</text>
                  <text x="380" y="68" fill="#22c55e" fontSize="8" fontFamily="monospace">0</text>
                  <rect x="478" y="58" width="44" height="12" rx="6" fill="#14532d"/>
                  <text x="500" y="68" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace">PAID</text>
                  <rect x="40" y="80" width="520" height="24" rx="4" fill="#071a2e"/>
                  <text x="60" y="96" fill="#e2e8f0" fontSize="8" fontFamily="monospace">Brian Ssempala</text>
                  <text x="190" y="96" fill="#e2e8f0" fontSize="8" fontFamily="monospace">S.5 West</text>
                  <text x="290" y="96" fill="#fbbf24" fontSize="8" fontFamily="monospace">200,000</text>
                  <text x="380" y="96" fill="#f87171" fontSize="8" fontFamily="monospace">120,000</text>
                  <rect x="478" y="86" width="44" height="12" rx="6" fill="#7c2d12"/>
                  <text x="500" y="96" textAnchor="middle" fill="#fca5a5" fontSize="7" fontFamily="monospace">OWING</text>
                  <rect x="40" y="108" width="520" height="24" rx="4" fill="#0a2444"/>
                  <text x="60" y="124" fill="#e2e8f0" fontSize="8" fontFamily="monospace">Carol Atim</text>
                  <text x="190" y="124" fill="#e2e8f0" fontSize="8" fontFamily="monospace">P.7 A</text>
                  <text x="290" y="124" fill="#22c55e" fontSize="8" fontFamily="monospace">180,000</text>
                  <text x="380" y="124" fill="#22c55e" fontSize="8" fontFamily="monospace">0</text>
                  <rect x="440" y="168" width="120" height="20" rx="10" fill="#1a56ff"/>
                  <text x="500" y="182" textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace" fontWeight="bold">1,240 students</text>
                </svg>
              }
              title="Student Records"
              desc="Complete searchable databases with full payment history and outstanding balances for every student."
              delay={0.5}
              color="from-cyan-500 to-blue-600"
            />
            <FeatureCard 
              svg={
                <svg className="w-full h-full" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
                  <rect width="600" height="200" fill="#0d1f7a"/>
                  <rect x="60" y="140" width="40" height="40" rx="4" fill="rgba(255,255,255,0.15)"/>
                  <rect x="115" y="110" width="40" height="70" rx="4" fill="rgba(255,255,255,0.25)"/>
                  <rect x="170" y="80" width="40" height="100" rx="4" fill="rgba(255,255,255,0.35)"/>
                  <rect x="225" y="60" width="40" height="120" rx="4" fill="rgba(255,255,255,0.55)"/>
                  <rect x="280" y="40" width="40" height="140" rx="4" fill="rgba(255,255,255,0.75)"/>
                  <rect x="335" y="55" width="40" height="125" rx="4" fill="rgba(255,255,255,0.6)"/>
                  <rect x="390" y="70" width="40" height="110" rx="4" fill="rgba(255,255,255,0.45)"/>
                  <rect x="445" y="50" width="40" height="130" rx="4" fill="rgba(255,255,255,0.8)"/>
                  <polyline points="80,140 135,112 190,82 245,62 300,42 355,56 410,72 465,52" fill="none" stroke="#f5c842" strokeWidth="2.5" strokeLinejoin="round"/>
                  <circle cx="80" cy="140" r="4" fill="#f5c842"/>
                  <circle cx="135" cy="112" r="4" fill="#f5c842"/>
                  <circle cx="190" cy="82" r="4" fill="#f5c842"/>
                  <circle cx="245" cy="62" r="4" fill="#f5c842"/>
                  <circle cx="300" cy="42" r="4" fill="#f5c842"/>
                  <circle cx="465" cy="52" r="6" fill="#f5c842" stroke="white" strokeWidth="2"/>
                  <line x1="50" y1="180" x2="550" y2="180" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                  <rect x="460" y="12" width="120" height="32" rx="8" fill="rgba(245,200,66,0.2)" stroke="#f5c842" strokeWidth="1"/>
                  <text x="520" y="25" textAnchor="middle" fill="#f5c842" fontSize="8" fontFamily="monospace" fontWeight="bold">+94% collected</text>
                  <text x="520" y="38" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="7" fontFamily="monospace">this term</text>
                </svg>
              }
              title="Real-Time Analytics"
              desc="Daily collection summaries with AI-powered forecasting and actionable insights for leadership."
              delay={0.6}
              color="from-yellow-500 to-orange-600"
            />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 space-y-8 mb-12">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-2"
          >
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-blue-600 font-bold uppercase tracking-widest text-sm"
            >
              How It Works
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-4xl font-black tracking-tight text-gray-900"
            >
              Up and Running in Under 24 Hours
            </motion.h2>
          </motion.div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              {
                step: '01',
                title: 'Sign Up Your School',
                desc: 'Create your school account in minutes. No credit card required. Our team gives you a free onboarding session to ensure everything is perfect.'
              },
              {
                step: '02',
                title: 'Import Your Students',
                desc: 'Upload your class lists via CSV or add students manually. All records are organized by class and term automatically.'
              },
              {
                step: '03',
                title: 'Start Recording Payments',
                desc: 'Record any fee payment in under 10 seconds. Parents get an SMS instantly, and receipts are generated automatically.'
              },
              {
                step: '04',
                title: 'Monitor & Analyze',
                desc: 'Monitor collections, outstanding balances, and financial health from your dashboard. Share reports with your headteacher.'
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ x: 10 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-4 items-start group"
              >
                <motion.div 
                  whileHover={{ scale: 1.15, rotate: 360 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="flex-shrink-0"
                >
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-2xl font-black text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {item.step}
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex-1 backdrop-blur-xl bg-white/70 border border-blue-200/50 rounded-2xl p-6 hover:border-blue-400/50 transition-all group-hover:bg-white/80"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed group-hover:text-gray-600 transition-colors">{item.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-12 space-y-8 mb-12">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-2"
          >
            <p className="text-blue-600 font-bold uppercase tracking-widest text-sm">Testimonials</p>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">
              Loved by Bursars Across Uganda
            </h2>
            <p className="text-gray-600 text-base font-light max-w-2xl mx-auto">
              See how school administrators are saving time and reducing disputes with BursarPro
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TestimonialCard
              stars={5}
              quote="Before BursarPro, I used to spend 3 days every term reconciling payments. Now it takes less than an hour. The SMS feature alone has stopped so many parent disputes."
              author="Grace Namutebi"
              role="Bursar, Kampala Parents' School"
              delay={0.1}
            />
            <TestimonialCard
              stars={5}
              quote="The headteacher now checks the dashboard herself every morning. We finally have a shared understanding of school finances without me printing daily reports."
              author="Robert Ssekandi"
              role="Finance Officer, St. Mary's Kitende"
              delay={0.2}
            />
            <TestimonialCard
              stars={5}
              quote="Outstanding balances used to be a mystery. Now parents know exactly what they owe, real-time. Our collection rate improved from 68% to 94% in one term!"
              author="Dorothy Kabwire"
              role="School Administrator, Kings College Budo"
              delay={0.3}
            />
            <TestimonialCard
              stars={5}
              quote="The receipt generation is a lifesaver. Professional-looking PDFs that parents actually trust. Zero disputes over missing receipts anymore."
              author="James Katumba"
              role="Bursar, Gayaza High School"
              delay={0.4}
            />
          </div>
        </section>

        {/* Final CTA */}
        <section id="support" className="py-12 relative mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-xl bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400/30 rounded-3xl p-10 overflow-hidden relative shadow-2xl"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10 max-w-2xl mx-auto text-center space-y-6"
            >
              <motion.h2 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-4xl font-black text-white leading-tight"
              >
                {['Ready to Transform', "Your School's Finances?"].map((word, idx) => (
                  <motion.span key={idx} variants={itemVariants} className="inline-block mr-2">
                    {word}
                  </motion.span>
                ))}
              </motion.h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {[
                  "✓ No credit card required",
                  "✓ Free training for your bursar",
                  "✓ 24/7 Support team in Uganda",
                  "✓ Setup completed within 24 hours"
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 10 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 text-sm text-white group cursor-pointer"
                  >
                    <motion.span 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      className="text-lg font-bold text-amber-200"
                    >
                      {item.split(' ')[0]}
                    </motion.span>
                    <span className="font-semibold text-sm group-hover:translate-x-1 transition-transform">{item.substring(2)}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RippleButton
                    to="/register" 
                    className="inline-flex px-10 py-4 bg-white text-orange-600 font-black rounded-xl transition-all text-lg shadow-2xl hover:shadow-white/50"
                  >
                    Sign Up Now — It's Free
                  </RippleButton>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RippleButton
                    to="/parent-login" 
                    className="inline-flex px-10 py-4 bg-white/20 border-2 border-white text-white font-bold rounded-xl transition-all text-lg hover:bg-white/30 gap-2"
                  >
                    <Key size={20} />
                    Parent Portal Access
                  </RippleButton>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 backdrop-blur-xl bg-white/80 border-t border-gray-200 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg">
                <Wallet className="text-white w-6 h-6" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tighter text-blue-600">BursarPro</span>
              </div>
              <p className="text-gray-400 max-w-sm font-light text-sm leading-relaxed">
                Building the future of school administration in Uganda. Reliable, secure, and beautiful.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center text-gray-500 text-xs font-medium">
            <p>© 2026 BursarPro. All rights reserved. | Proudly serving Uganda's education sector</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
