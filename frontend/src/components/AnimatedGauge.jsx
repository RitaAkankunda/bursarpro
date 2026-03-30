/**
 * Animated Gauge Card Component
 * Beautiful circular progress indicators with animations
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, Zap } from 'lucide-react';

const AnimatedGauge = ({ 
  percentage = 65, 
  label = 'Collection Rate', 
  value = '65%',
  color = '#3b82f6',
  icon: IconComp = TrendingUp,
  subtitle = null,
  animated = true,
  size = 'md'
}) => {
  const [displayPercentage, setDisplayPercentage] = useState(0);

  const sizeMap = {
    sm: { radius: 45, strokeWidth: 4, fontSize: 28 },
    md: { radius: 55, strokeWidth: 5, fontSize: 32 },
    lg: { radius: 70, strokeWidth: 6, fontSize: 40 }
  };

  const config = sizeMap[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference;

  useEffect(() => {
    if (!animated) {
      setDisplayPercentage(percentage);
      return;
    }

    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += Math.random() * 15;
        if (current >= percentage) {
          setDisplayPercentage(percentage);
          clearInterval(interval);
        } else {
          setDisplayPercentage(current);
        }
      }, 50);

      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(timer);
  }, [percentage, animated]);

  const getColor = (pct) => {
    if (pct >= 75) return '#10b981'; // Green
    if (pct >= 50) return '#3b82f6'; // Blue
    if (pct >= 25) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const gaugeColor = typeof color === 'string' && color.startsWith('#') ? color : getColor(percentage);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="backdrop-blur-md bg-white/60 p-6 rounded-2xl border border-white/30 shadow-lg relative overflow-hidden group"
    >
      {/* Animated background glow */}
      <motion.div
        animate={{
          boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.1)',
            '0 0 40px rgba(59, 130, 246, 0.2)',
            '0 0 20px rgba(59, 130, 246, 0.1)',
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 rounded-2xl"
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-gray-800">{value}</h3>
              <motion.div
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <ArrowUpRight size={20} className="text-emerald-500" strokeWidth={3} />
              </motion.div>
            </div>
            {subtitle && (
              <p className="text-xs text-gray-600 mt-1 font-medium">{subtitle}</p>
            )}
          </div>

          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className={`p-3 rounded-xl w-fit`}
            style={{ backgroundColor: `${gaugeColor}20` }}
          >
            <IconComp size={24} style={{ color: gaugeColor }} strokeWidth={2} />
          </motion.div>
        </div>

        {/* Circular Progress */}
        <div className="flex justify-center mb-6">
          <div className="relative w-40 h-40">
            <svg
              viewBox="0 0 180 180"
              className="w-full h-full transform -rotate-90"
            >
              {/* Background circle */}
              <circle
                cx="90"
                cy="90"
                r={config.radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={config.strokeWidth}
              />

              {/* Progress circle */}
              <motion.circle
                cx="90"
                cy="90"
                r={config.radius}
                fill="none"
                stroke={gaugeColor}
                strokeWidth={config.strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (displayPercentage / 100) * circumference}
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 8px ${gaugeColor}40)`,
                }}
              />

              {/* Center circle for 3D effect */}
              <circle
                cx="90"
                cy="90"
                r={config.radius - config.strokeWidth - 8}
                fill="white"
                opacity="0.3"
              />
            </svg>

            {/* Percentage text in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                key={Math.floor(displayPercentage)}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <p className="text-4xl font-black" style={{ color: gaugeColor }}>
                  {Math.round(displayPercentage)}
                </p>
                <p className="text-xs font-bold text-gray-500 mt-1">%</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/20">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: gaugeColor }}
          />
          <p className="text-xs font-semibold text-gray-600">
            {displayPercentage >= 75 ? '✅ On Track' : displayPercentage >= 50 ? '⚠️ Good Progress' : '❌ Needs Attention'}
          </p>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{
          background: `radial-gradient(400px at var(--mouse-x, 50%) var(--mouse-y, 50%), ${gaugeColor}10, transparent 80%)`
        }}
      />
    </motion.div>
  );
};

export default AnimatedGauge;
