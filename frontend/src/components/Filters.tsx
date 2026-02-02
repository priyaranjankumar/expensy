import type { FilterState } from '../types';
import { formatBillingMonth } from '../types';
import MonthPicker from './MonthPicker';
import CustomDropdown from './CustomDropdown';
import { useState, RefObject } from 'react';

interface FiltersProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    categories: string[];
    billingMonths: string[];
    onExportCSV?: () => void;
    onExportJSON?: () => void;
    searchInputRef?: RefObject<HTMLInputElement>;
}

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses', icon: '📋' },
    { value: 'Unpaid', label: 'Unpaid', icon: '⏳' },
    { value: 'Paid', label: 'Paid', icon: '✓' },
    { value: 'Completely Paid', label: 'Completely Paid', icon: '✅' },
];

const Filters: React.FC<FiltersProps> = ({ filters, onFilterChange, categories, billingMonths, onExportCSV, onExportJSON, searchInputRef }) => {
    const [showExportMenu, setShowExportMenu] = useState(false);

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
        <div className="card p-4 animate-fade-in space-y-4 relative z-20">
            {/* Top Row: Title, Filters, Actions */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Title (passed purely for layout alignment if needed, or we assume it's external. 
                    Wait, user asked "Keep Recent transaction text... in single row". 
                    So we should render it here or accept it as children/prop)
                */}
                <h2 className="text-lg font-semibold dark:text-white mr-2">Recent Transactions</h2>

                {/* Month Picker */}
                <MonthPicker
                    value={filters.billing_month}
                    onChange={(value) => handleChange('billing_month', value)}
                    className="w-48"
                />

                {/* Quick month buttons - hidden on very small screens to save space */}
                {billingMonths.length > 0 && (
                    <div className="hidden xl:flex gap-1">
                        {billingMonths.slice(0, 3).map((month) => (
                            <button
                                key={month}
                                onClick={() => handleChange('billing_month', month)}
                                className={`px-4 h-11 text-xs font-semibold rounded-3xl transition-all duration-200 whitespace-nowrap flex items-center ${filters.billing_month === month
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                    : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-600'
                                    }`}
                            >
                                {formatBillingMonth(month).split(' ')[0]}
                            </button>
                        ))}
                    </div>
                )}

                {/* Status Dropdown */}
                <CustomDropdown
                    value={filters.status}
                    onChange={(value) => handleChange('status', value)}
                    options={STATUS_OPTIONS}
                    placeholder="All Statuses"
                    icon="📊"
                    className="w-48"
                />

                {/* Category Dropdown */}
                <CustomDropdown
                    value={filters.category}
                    onChange={(value) => handleChange('category', value)}
                    options={categoryOptions}
                    placeholder="All Categories"
                    icon="📁"
                    className="w-56"
                />

                {/* Export Menu */}
                {(onExportCSV || onExportJSON) && (
                    <div className="relative z-10 ml-auto">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            onBlur={() => setTimeout(() => setShowExportMenu(false), 200)}
                            className="h-11 px-6 bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300 rounded-3xl hover:bg-slate-200 dark:hover:bg-dark-600 transition-colors flex items-center gap-2 font-medium text-sm"
                            title="Export data"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="hidden sm:inline">Export</span>
                            <svg className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-800 rounded-3xl shadow-xl border border-slate-200 dark:border-dark-700 overflow-hidden animate-fade-in">
                                {onExportCSV && (
                                    <button
                                        onMouseDown={() => onExportCSV()}
                                        className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700 flex items-center gap-3 transition-colors"
                                    >
                                        <span className="text-lg">📊</span> Export as CSV
                                    </button>
                                )}
                                {onExportJSON && (
                                    <button
                                        onMouseDown={() => onExportJSON()}
                                        className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700 flex items-center gap-3 transition-colors border-t border-slate-100 dark:border-dark-700"
                                    >
                                        <span className="text-lg">💾</span> Export as JSON
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Row 2: Search (Full Width) */}
            <div className="relative w-full">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search expenses by description, category, or notes... (Press F)"
                    value={filters.search}
                    onChange={(e) => handleChange('search', e.target.value)}
                    className="input h-11 pl-10 pr-4 w-full rounded-3xl"
                />
            </div>

            {/* Active Filters Pills */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-dark-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400 self-center mr-1">Active:</span>
                    {filters.status && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                            {filters.status}
                            <button onClick={() => handleChange('status', '')} className="hover:text-primary-900 dark:hover:text-primary-100">✕</button>
                        </span>
                    )}
                    {filters.category && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            {filters.category}
                            <button onClick={() => handleChange('category', '')} className="hover:text-purple-900 dark:hover:text-purple-100">✕</button>
                        </span>
                    )}
                    <button
                        onClick={handleClear}
                        className="text-xs text-red-500 hover:text-red-700 underline ml-auto"
                    >
                        Clear All
                    </button>
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
