import { useState } from 'react';
import { Search, X, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchFilter = ({ 
  onSearch, 
  onFilterChange, 
  filterType = 'students', 
  placeholder = 'Search...',
  filters = {},
  onFiltersChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleSearch = (value) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...localFilters, [filterName]: value };
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleResetFilters = () => {
    setLocalFilters({});
    onFiltersChange?.({});
  };

  const renderFilters = () => {
    if (filterType === 'students') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Class Level</label>
            <select
              value={localFilters.class_level_id || ''}
              onChange={(e) => handleFilterChange('class_level_id', e.target.value)}
              className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Classes</option>
              <option value="1">S1</option>
              <option value="2">S2</option>
              <option value="3">S3</option>
              <option value="4">S4</option>
              <option value="5">S5</option>
              <option value="6">S6</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
            <select
              value={localFilters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
            <select
              value={localFilters.gender || ''}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
        </div>
      );
    }

    if (filterType === 'payments') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
            <select
              value={localFilters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
            <select
              value={localFilters.method || ''}
              onChange={(e) => handleFilterChange('method', e.target.value)}
              className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Methods</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Min Amount</label>
              <input
                type="number"
                value={localFilters.min_amount || ''}
                onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                placeholder="Min"
                className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Max Amount</label>
              <input
                type="number"
                value={localFilters.max_amount || ''}
                onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                placeholder="Max"
                className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={localFilters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={localFilters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Sort By</label>
            <select
              value={localFilters.sort_by || 'date'}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="date">Recent</option>
              <option value="amount">Highest Amount</option>
              <option value="student">Student Name</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      );
    }

    if (filterType === 'fees') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Min Amount</label>
              <input
                type="number"
                value={localFilters.min_amount || ''}
                onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                placeholder="Min"
                className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Max Amount</label>
              <input
                type="number"
                value={localFilters.max_amount || ''}
                onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                placeholder="Max"
                className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Sort By</label>
            <select
              value={localFilters.sort_by || 'date'}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full px-3 py-2 bg-white/60 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="date">Recent</option>
              <option value="amount">Highest Amount</option>
              <option value="student">Student Name</option>
              <option value="term">Term</option>
            </select>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 bg-white/60 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-all"
        >
          <Sliders size={16} />
          Advanced Filters
        </button>
        
        {Object.keys(localFilters).length > 0 && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="backdrop-blur-md bg-white/40 p-6 rounded-lg border border-white/30 space-y-4"
          >
            {renderFilters()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {Object.keys(localFilters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(localFilters).map(([key, value]) => (
            value && (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full"
              >
                {key}: {value}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="hover:text-primary/60 transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
