import type { FilterState } from '../types';
import { formatBillingMonth } from '../types';
import MonthPicker from './MonthPicker';
import CustomDropdown from './CustomDropdown';

interface FiltersProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    categories: string[];
    billingMonths: string[];
}

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses', icon: '📋' },
    { value: 'Unpaid', label: 'Unpaid', icon: '⏳' },
    { value: 'Paid', label: 'Paid', icon: '✓' },
    { value: 'Completely Paid', label: 'Completely Paid', icon: '✅' },
];

const Filters: React.FC<FiltersProps> = ({ filters, onFilterChange, categories, billingMonths }) => {
    const handleChange = (field: keyof FilterState, value: string) => {
        onFilterChange({ ...filters, [field]: value });
    };

    const handleClear = () => {
        onFilterChange({ status: '', category: '', search: '', billing_month: filters.billing_month });
    };

    const hasActiveFilters = filters.status || filters.category || filters.search;

    const categoryOptions = [
        { value: '', label: 'All Categories', icon: '📁' },
        ...categories.map(cat => ({ value: cat, label: cat, icon: getCategoryIcon(cat) })),
    ];

    return (
        <div className="card p-4 animate-fade-in">
            <div className="flex flex-wrap items-center gap-3">
                {/* Custom Month Picker */}
                <MonthPicker
                    value={filters.billing_month}
                    onChange={(value) => handleChange('billing_month', value)}
                    className="min-w-[200px]"
                />

                {/* Quick month buttons */}
                {billingMonths.length > 0 && (
                    <div className="flex gap-1">
                        {billingMonths.slice(0, 3).map((month) => (
                            <button
                                key={month}
                                onClick={() => handleChange('billing_month', month)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${filters.billing_month === month
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                    : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-600'
                                    }`}
                            >
                                {formatBillingMonth(month).split(' ')[0]}
                            </button>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className="flex-1 min-w-[180px]">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={filters.search}
                            onChange={(e) => handleChange('search', e.target.value)}
                            className="input !py-2.5 pl-10"
                        />
                    </div>
                </div>

                {/* Custom Status Dropdown */}
                <CustomDropdown
                    value={filters.status}
                    onChange={(value) => handleChange('status', value)}
                    options={STATUS_OPTIONS}
                    placeholder="All Statuses"
                    icon="📊"
                    className="min-w-[160px]"
                />

                {/* Custom Category Dropdown */}
                <CustomDropdown
                    value={filters.category}
                    onChange={(value) => handleChange('category', value)}
                    options={categoryOptions}
                    placeholder="All Categories"
                    icon="📁"
                    className="min-w-[160px]"
                />

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={handleClear}
                        className="btn btn-ghost !py-2 text-slate-600 dark:text-slate-300"
                        title="Clear filters (keeps month)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear
                    </button>
                )}
            </div>

            {/* Active Filters Pills */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-dark-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400 self-center mr-1">Active:</span>
                    {filters.status && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                            {filters.status}
                            <button
                                onClick={() => handleChange('status', '')}
                                className="hover:text-primary-900 dark:hover:text-primary-100"
                            >
                                ✕
                            </button>
                        </span>
                    )}
                    {filters.category && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            {filters.category}
                            <button
                                onClick={() => handleChange('category', '')}
                                className="hover:text-purple-900 dark:hover:text-purple-100"
                            >
                                ✕
                            </button>
                        </span>
                    )}
                    {filters.search && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200 dark:bg-dark-600 text-slate-700 dark:text-slate-300">
                            "{filters.search}"
                            <button
                                onClick={() => handleChange('search', '')}
                                className="hover:text-slate-900 dark:hover:text-white"
                            >
                                ✕
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

// Helper function to get category icons
function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        'Utilities': '⚡',
        'Subscription': '📱',
        'SIP': '📈',
        'Rent': '🏠',
        'EMI': '💳',
        'Credit Card Bill': '💳',
        'Insurance': '🛡️',
        'Groceries': '🛒',
        'Transportation': '🚗',
        'Entertainment': '🎬',
        'Healthcare': '🏥',
        'Education': '📚',
    };
    return icons[category] || '📋';
}

export default Filters;
