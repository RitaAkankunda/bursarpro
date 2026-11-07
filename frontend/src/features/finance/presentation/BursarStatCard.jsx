import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatFinancialMetric } from '../domain/formatFinancialMetric';

/** Presentation only: receives precomputed API values; never calculates balances. */
export default function BursarStatCard({ title, value, icon: Icon, subtitle, delay = 0, trend }) {
  const reduceMotion = useReducedMotion();
  const trendNumber = Number(trend);
  const hasTrend = trend !== undefined && trend !== null && Number.isFinite(trendNumber);
  return (
    <motion.section
      aria-label={title}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, delay }}
      className="bp-metric"
    >
      <div className="bp-metric__head">
        <span className="bp-metric__eyebrow">{title}</span>
        <span className="bp-metric__icon" aria-hidden="true">{Icon && <Icon size={21} strokeWidth={1.8} />}</span>
      </div>
      <div className="bp-metric__value">{formatFinancialMetric(value)}</div>
      {hasTrend && (
        <div className={trendNumber >= 0 ? 'bp-metric__trend bp-metric__trend--up' : 'bp-metric__trend bp-metric__trend--down'}>
          {trendNumber >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(trendNumber)}%</span>
          <span className="bp-metric__trend-label">reported change</span>
        </div>
      )}
      {subtitle && <p className="bp-metric__subtitle">{subtitle}</p>}
    </motion.section>
  );
}
