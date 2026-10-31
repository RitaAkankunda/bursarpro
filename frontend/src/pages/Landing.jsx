import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpRight, ArrowRight, Check, ReceiptText, BellRing, ChartNoAxesCombined, ShieldCheck, GraduationCap, Menu } from 'lucide-react';
import './Landing.css';

const steps = [
  { no:'01', eyebrow:'RECORD', title:'Every payment, in its rightful place.', body:'Record student fee payments and keep an organized view of each learner’s financial history.', icon:ReceiptText, label:'Payment recorded', value:'UGX 450,000' },
  { no:'02', eyebrow:'UNDERSTAND', title:'A clearer picture of what remains.', body:'See paid amounts and outstanding balances without digging through scattered spreadsheets.', icon:ChartNoAxesCombined, label:'Balance updated', value:'UGX 200,000' },
  { no:'03', eyebrow:'COMMUNICATE', title:'Keep families in the conversation.', body:'Prepare fee reminders and help parents stay informed through the school’s communication workflows.', icon:BellRing, label:'Reminder prepared', value:'Parent notified' },
  { no:'04', eyebrow:'REPORT', title:'Make each school decision count.', body:'Turn financial records into reports that help administrators plan with greater confidence.', icon:ShieldCheck, label:'Report generated', value:'Term overview' },
];
const roles = [
  { role:'For bursars', title:'More clarity. Less chasing paperwork.', copy:'Manage fees, payments, balances, and daily finance routines with confidence.', symbol:'↗' },
  { role:'For school leaders', title:'Know where your school stands.', copy:'Understand collections and outstanding fees through accessible reports.', symbol:'◈' },
  { role:'For parents', title:'Stay informed, without the guesswork.', copy:'Access relevant fee information and communications for your learner.', symbol:'✳' },
];
function Appear({ children, className='', delay=0 }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced?false:{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.18}} transition={{duration:.65,delay,ease:[.16,1,.3,1]}}>{children}</motion.div>;
}
function ProductIllustration({step=0}) {
  const item=steps[step]; const Icon=item.icon;
  return <div className="bp-illustration" aria-label="Illustration of school fee management using fictional sample amounts">
    <div className="bp-illustration-grid" aria-hidden="true" />
    <div className="bp-illus-paper bp-illus-paper-back" aria-hidden="true"><i/><i/><i/></div>
    <div className="bp-illus-paper bp-illus-paper-main">
      <div className="bp-paper-top"><span className="bp-school-emblem"><GraduationCap size={17}/></span><span>DEMO SCHOOL <small>FINANCIAL RECORD</small></span><span className="bp-paper-check"><Check size={15}/></span></div>
      <div className="bp-paper-label">{item.label}</div><strong className="bp-paper-value">{item.value}</strong>
      <div className="bp-paper-lines"><i/><i/><i/></div>
      <div className="bp-paper-bottom">Illustrative data · Not a real transaction</div>
    </div>
    <div className="bp-float-token" aria-hidden="true"><Icon size={27} strokeWidth={1.6}/></div>
    <div className="bp-dot-decoration" aria-hidden="true">✳</div>
  </div>;
}
function StoryStep({ step, index }) {
  return <article className="bp-story-step" id={`workflow-${index+1}`}>
    <Appear className="bp-story-copy">
      <span className="bp-step-num">{step.no} <span>/ 04</span></span>
      <div className="bp-step-rule"/>
      <span className="bp-kicker">{step.eyebrow}</span>
      <h3>{step.title}</h3><p>{step.body}</p>
    </Appear>
    <Appear className="bp-story-art" delay={.07}><ProductIllustration step={index}/></Appear>
  </article>;
}
function HeroVisual(){
  const ref=useRef(null); const reduced=useReducedMotion();
  const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
  const y=useTransform(scrollYProgress,[0,1],[26,-25]);
  return <motion.div ref={ref} className="bp-hero-art" style={reduced?{}:{y}}>
    <div className="bp-dash-head"><div className="bp-dash-logo">b.</div><span>School overview</span><span className="bp-dash-date">TERM 01</span></div>
    <div className="bp-dash-greeting">Good morning, Administrator <span>✳</span></div>
    <div className="bp-dash-metrics"><div><small>Fees collected</small><strong>UGX 24.8m</strong><span>↗ Sample collection total</span></div><div><small>Outstanding</small><strong>UGX 8.2m</strong><span>↘ Sample outstanding fees</span></div></div>
    <div className="bp-chart"><div className="bp-chart-title">Collection activity <span>Illustrative</span></div><div className="bp-bars" aria-hidden="true">{[38,57,48,78,63,89,72,96,83].map((h,i)=><span key={i} style={{'--bar-height':`${h}%`,'--bar-delay':`${i*65}ms`}} />)}</div><div className="bp-chart-axis"><span>W1</span><span>W3</span><span>W5</span><span>W7</span><span>W9</span></div></div>
    <div className="bp-hero-badge"><span className="bp-badge-icon"><Check size={16}/></span><span><strong>Payment recorded</strong><small>Sample transaction · UGX 450,000</small></span></div>
    <div className="bp-hero-stamp">DESIGNED<br/>FOR SCHOOLS <span>✳</span></div>
  </motion.div>;
}
export default function Landing(){
  return <div className="bp-site">
    <a className="bp-skip" href="#main-content">Skip to content</a>
    <header className="bp-nav"><Link to="/" className="bp-brand" aria-label="BursarPro home"><span className="bp-brand-symbol">b<span>.</span></span><span>BursarPro</span></Link><nav className="bp-nav-links" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#who-its-for">Who it's for</a><a href="#why-bursarpro">Why BursarPro</a></nav><div className="bp-nav-actions"><Link to="/login" className="bp-text-link">Log in</Link><Link to="/register" className="bp-nav-cta">Get started <ArrowUpRight size={15}/></Link></div><details className="bp-mobile-nav"><summary aria-label="Open navigation"><Menu size={23}/></summary><nav aria-label="Mobile navigation"><a href="#how-it-works">How it works</a><a href="#who-its-for">Who it's for</a><a href="#why-bursarpro">Why BursarPro</a><Link to="/login">Log in</Link><Link to="/register">Get started</Link></nav></details></header>
    <main id="main-content">
      <section className="bp-hero"><div className="bp-hero-copy"><Appear><span className="bp-eyebrow"><span className="bp-eyebrow-dot"/> FINANCIAL CLARITY FOR EDUCATION</span><h1>School finances,<br/><em>finally in focus.</em></h1><p>From fee payments to parent updates, bring the moving parts of school finance into one clear, thoughtful place.</p><div className="bp-hero-buttons"><Link className="bp-button bp-button-dark" to="/register">Start with BursarPro <ArrowUpRight size={18}/></Link><a className="bp-button bp-button-outline" href="#how-it-works">See how it works <ArrowRight size={18}/></a></div><div className="bp-hero-caption"><span>BUILT FOR UGANDAN SCHOOLS</span><span className="bp-caption-line"/><span>01 — 04</span></div></Appear></div><div className="bp-hero-visual"><HeroVisual/></div><div className="bp-hero-squiggle" aria-hidden="true">✳</div></section>
      <section className="bp-statement" id="why-bursarpro"><Appear><p>THE IDEA IS SIMPLE</p><h2>Less time sorting numbers.<br/><em>More time supporting learners.</em></h2><span>One connected view of what has been paid, what is outstanding, and what comes next.</span></Appear></section>
      <section id="how-it-works" className="bp-workflow"><div className="bp-section-top"><span>01 / THE JOURNEY</span><h2>From payment to <em>peace of mind.</em></h2><p>Four connected moments in the everyday life of school finance.</p></div><div className="bp-story-list">{steps.map((step,i)=><StoryStep key={step.no} step={step} index={i}/>)}</div></section>
      <section id="who-its-for" className="bp-roles"><div className="bp-role-heading"><span>02 / BUILT AROUND PEOPLE</span><h2>One school.<br/><em>Different perspectives.</em></h2><p>Give every member of the school community the information they need—without unnecessary complexity.</p></div><div className="bp-role-list">{roles.map((r,i)=><Appear className="bp-role" delay={i*.07} key={r.role}><div className="bp-role-icon">{r.symbol}</div><span>{r.role}</span><h3>{r.title}</h3><p>{r.copy}</p><div className="bp-role-index">0{i+1}</div></Appear>)}</div></section>
      <section className="bp-end"><span>03 / A CLEARER WAY FORWARD</span><h2>Make every school<br/><em>day add up.</em></h2><p>Bring structure, visibility and confidence to the way your school manages fees.</p><Link className="bp-button bp-button-light" to="/register">Explore BursarPro <ArrowUpRight size={19}/></Link><div className="bp-end-orb" aria-hidden="true">✳</div></section>
    </main><footer className="bp-footer"><span className="bp-footer-brand">b<span>.</span> <small>BursarPro</small></span><span>Thoughtfully built for school finance.</span><div><Link to="/login">Log in</Link><a href="#main-content">Back to top ↑</a></div></footer>
  </div>;
}
