import React from 'react';

/**
 * Reusable styled dropdown/select component
 * Provides consistent styling across all pages
 */
const SelectDropdown = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
  error = null,
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
          {label}
          {required && <span className="text-accent ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="w-full px-4 py-3 glass-morphism rounded-xl border border-white/5 outline-none focus:ring-2 focus:ring-primary/50 text-sm appearance-none bg-white/5 cursor-pointer text-white pr-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <option value="" className="bg-slate-900 text-white">
            {placeholder}
          </option>
          {Array.isArray(options) && options.map((option) => (
            <option
              key={option.id || option.value}
              value={option.id || option.value}
              className="bg-slate-900 text-white"
            >
              {option.label || option.name || option.text}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-3.5 text-text-muted text-xs">
          ▼
        </div>
      </div>
      {error && <p className="text-xs text-accent mt-1">{error}</p>}
    </div>
  );
};

export default SelectDropdown;
