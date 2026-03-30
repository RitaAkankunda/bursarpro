import { Link } from 'react-router-dom';
import { Wallet, LogIn, Users, ShieldCheck, ArrowRight, Download, CreditCard, MessageSquare, CheckCircle2, Key, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon, title, desc, delay, color = 'from-orange-500 to-amber-600' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="group relative overflow-hidden"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
    
    <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-2xl shadow-lg group-hover:border-white/40 transition-all duration-300">
      <div className={`inline-flex p-4 bg-gradient-to-br ${color} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
        <div className="text-white">{icon}</div>
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-orange-600 transition-colors text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors">{desc}</p>
    </div>
  </motion.div>
);

const TestimonialCard = ({ stars, quote, author, role, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 space-y-4"
  >
    <div className="flex gap-1">
      {[...Array(stars)].map((_, i) => (
        <span key={i} className="text-yellow-400 text-lg">★</span>
      ))}
    </div>
    <p className="text-gray-700 italic leading-relaxed text-lg font-light">"{quote}"</p>
    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold">
        {author.split(' ')[0][0]}{author.split(' ')[1][0]}
      </div>
      <div>
        <p className="font-bold text-gray-900">{author}</p>
        <p className="text-xs text-gray-600">{role}</p>
      </div>
    </div>
  </motion.div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-orange-500 selection:text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200 to-transparent opacity-20 blur-[150px] rounded-full animate-blob" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-200 to-transparent opacity-20 blur-[150px] rounded-full animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-200 to-transparent opacity-10 blur-[150px] rounded-full animate-blob animation-delay-4000" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
              <div className="p-2 bg-gradient-to-br from-purple-500 to-orange-600 rounded-xl shadow-lg">
              <Wallet className="text-white w-6 h-6" strokeWidth={2.5} />
            </div>
              <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">BursarPro</span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-700">
            <a href="#features" className="hover:text-orange-600 transition-colors">Features</a>
            <a href="#stats" className="hover:text-orange-600 transition-colors">Impact</a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors">Pricing</a>
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
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Hero Section */}
        <div className="text-center space-y-12 max-w-4xl mx-auto mb-32">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 border border-orange-300 rounded-full text-orange-700 text-xs font-bold uppercase tracking-wider mx-auto"
            >
              <Sparkles size={14} className="animate-spin" strokeWidth={3} />
              Trusted by 50+ Schools Across Uganda
            </motion.div>


            <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05]">
                School Finance,
                <span className="bg-gradient-to-r from-purple-600 via-orange-500 to-pink-600 bg-clip-text text-transparent">
                  Finally Under
                  <br />
                  Control.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 font-light max-w-2xl mx-auto leading-relaxed">
                Say goodbye to spreadsheets and confusion. Automate fee collection, track payments in real-time, and get instant insights—all in one elegant, powerful platform built for Ugandan schools.
              </p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center justify-center gap-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-xl transition-all text-lg flex items-center justify-center gap-3 shadow-2xl hover:shadow-orange-500/50"
              >
                Get Started Free
                <ArrowRight size={20} strokeWidth={3} />
              </Link>
              <a 
                href="#features"
                className="w-full sm:w-auto px-10 py-4 backdrop-blur-xl bg-gray-900/10 border border-gray-400/30 rounded-xl font-bold transition-all text-lg text-gray-800 hover:bg-gray-900/20 hover:border-gray-500/50"
              >
                View Features
              </a>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <p className="text-sm text-gray-400 mb-3">👨‍👩‍👧 Parents: Track your child's balance instantly</p>
              <Link 
                to="/parent-login" 
                className="inline-flex px-8 py-3 bg-orange-500/20 border border-orange-400/50 rounded-xl font-bold text-orange-300 hover:bg-orange-500/30 transition-all text-base gap-2 items-center"
              >
                <Key size={18} strokeWidth={2.5} />
                Access Parent Portal
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Trusted By Schools */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="py-16 text-center space-y-12 mb-32"
        >
          <div className="space-y-2">
            <p className="text-orange-600 font-bold uppercase tracking-widest text-sm">Trusted By Schools Across Uganda</p>
            <h2 className="text-4xl font-black text-gray-900">Partners Including</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-center">
            {[
              "🏫 Kampala Parents' School",
              "🏫 Gayaza High School", 
              "🏫 Kings College Budo",
              "🏫 St. Mary's Kitende",
              "🏫 Makerere College"
            ].map((school, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="backdrop-blur-xl bg-white/60 border border-blue-200/50 rounded-xl p-4 text-gray-700 font-semibold text-sm hover:border-orange-400/50 transition-all"
              >
                {school}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stats Section */}
        <section id="stats" className="py-20 mb-32">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 md:p-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: '50+', label: 'Schools' },
                { number: '15K+', label: 'Students' },
                { number: '2.5B', label: 'UGX Collected' },
                { number: '99.9%', label: 'Uptime' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">{stat.number}</p>
                  <p className="text-gray-700 font-medium uppercase text-xs tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 space-y-20 mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center space-y-4 max-w-2xl mx-auto"
          >
            <h2 className="text-5xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-orange-500 to-pink-600 bg-clip-text text-transparent">
              Powerful Features, Zero Complexity
            </h2>
            <p className="text-gray-700 text-lg font-light">
              Everything modern schools need—designed specifically for the Ugandan education landscape.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck size={28} strokeWidth={2} />}
              title="Bank-Level Security"
              desc="Military-grade encryption with daily automated backups. Your data is safer with us than it's ever been."
              delay={0.1}
              color="from-orange-500 to-orange-600"
            />
            <FeatureCard 
              icon={<MessageSquare size={28} strokeWidth={2} />}
              title="Instant SMS Alerts"
              desc="Parents receive real-time SMS confirmation when fees are paid. No more confusion or missing receipts."
              delay={0.2}
              color="from-emerald-500 to-teal-600"
            />
            <FeatureCard 
              icon={<Download size={28} strokeWidth={2} />}
              title="Pro Receipts"
              desc="Generate beautiful, official PDF receipts instantly. Print or email with a single click."
              delay={0.3}
              color="from-purple-500 to-pink-600"
            />
            <FeatureCard 
              icon={<CreditCard size={28} strokeWidth={2} />}
              title="All Payment Methods"
              desc="Track Mobile Money, Bank Transfers, Cash, and Cheques in one unified ledger system."
              delay={0.4}
              color="from-orange-500 to-red-600"
            />
            <FeatureCard 
              icon={<Users size={28} strokeWidth={2} />}
              title="Student Records"
              desc="Complete searchable databases with full payment history and outstanding balances for every student."
              delay={0.5}
              color="from-cyan-500 to-blue-600"
            />
            <FeatureCard 
              icon={<TrendingUp size={28} strokeWidth={2} />}
              title="Real-Time Analytics"
              desc="Daily collection summaries with AI-powered forecasting and actionable insights for leadership."
              delay={0.6}
              color="from-yellow-500 to-orange-600"
            />
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 space-y-16 mb-32">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <p className="text-orange-600 font-bold uppercase tracking-widest text-sm">How It Works</p>
            <h2 className="text-5xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-orange-500 to-pink-600 bg-clip-text text-transparent">
              Up and Running in Under 24 Hours
            </h2>
          </motion.div>

          <div className="space-y-8 max-w-2xl mx-auto">
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
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-6 items-start group"
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-2xl font-black text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1 backdrop-blur-xl bg-white/70 border border-blue-200/50 rounded-2xl p-6 hover:border-orange-400/50 transition-all">
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{item.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 space-y-16 mb-32">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <p className="text-orange-600 font-bold uppercase tracking-widest text-sm">Testimonials</p>
            <h2 className="text-5xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-orange-500 to-pink-600 bg-clip-text text-transparent">
              Loved by Bursars Across Uganda
            </h2>
            <p className="text-gray-700 text-lg font-light max-w-2xl mx-auto">
              See how school administrators are saving time and reducing disputes with BursarPro
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        <section className="py-20 relative mb-32">
          <div className="backdrop-blur-xl bg-gradient-to-r from-orange-600 to-amber-600 border border-orange-400/30 rounded-3xl p-16 overflow-hidden relative shadow-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10 max-w-2xl mx-auto text-center space-y-12"
            >
              <h2 className="text-5xl font-black text-transparent bg-gradient-to-r from-purple-600 via-orange-500 to-pink-600 bg-clip-text leading-tight">
                Ready to Transform Your School's Finances?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {[
                  "✓ No credit card required",
                  "✓ Free training for your bursar",
                  "✓ 24/7 Support team in Uganda",
                  "✓ Setup completed within 24 hours"
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 text-white"
                  >
                    <span className="text-2xl font-bold text-amber-200">{item.split(' ')[0]}</span>
                    <span className="font-semibold text-lg">{item.substring(2)}</span>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link 
                  to="/register" 
                  className="inline-flex px-10 py-4 bg-white text-orange-600 font-black rounded-xl transition-all text-lg shadow-2xl hover:shadow-white/50 hover:scale-105"
                >
                  Sign Up Now — It's Free
                </Link>
                <Link 
                  to="/parent-login" 
                  className="inline-flex px-10 py-4 bg-white/20 border-2 border-white text-white font-bold rounded-xl transition-all text-lg hover:bg-white/30 gap-2"
                >
                  <Key size={20} />
                  Parent Portal Access
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 backdrop-blur-xl bg-white/80 border-t border-gray-200 py-16 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-orange-600 rounded-lg">
                <Wallet className="text-white w-6 h-6" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">BursarPro</span>
              </div>
              <p className="text-gray-400 max-w-sm font-light leading-relaxed">
                Building the future of school administration in Uganda. Reliable, secure, and beautiful.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm font-medium">
            <p>© 2026 BursarPro. All rights reserved. | Proudly serving Uganda's education sector</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
