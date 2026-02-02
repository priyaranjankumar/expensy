import { useState, useRef, useEffect } from 'react';
import { formatBillingMonth } from '../types';

interface MonthPickerProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState(() => {
        if (value) return parseInt(value.split('-')[0]);
        return new Date().getFullYear();
    });
    const containerRef = useRef<HTMLDivElement>(null);

    const currentMonth = value ? parseInt(value.split('-')[1]) - 1 : new Date().getMonth();
    const currentYear = value ? parseInt(value.split('-')[0]) : new Date().getFullYear();

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMonthSelect = (monthIndex: number) => {
        const monthStr = String(monthIndex + 1).padStart(2, '0');
        onChange(`${selectedYear}-${monthStr}`);
        setIsOpen(false);
    };

    const handleYearChange = (delta: number) => {
        setSelectedYear(prev => prev + delta);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 px-6 h-11 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-200 dark:border-primary-700 rounded-3xl text-left transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <span className="font-semibold text-primary-700 dark:text-primary-300 text-sm">
                        {value ? formatBillingMonth(value) : 'Select Month'}
                    </span>
                </div>
                <svg
                    className={`w-5 h-5 text-primary-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white dark:bg-dark-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-dark-600 overflow-hidden animate-fade-in">
                    {/* Year Selector */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                        <button
                            type="button"
                            onClick={() => handleYearChange(-1)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="font-bold text-lg">{selectedYear}</span>
                        <button
                            type="button"
                            onClick={() => handleYearChange(1)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-3 gap-1 p-3">
                        {MONTHS.map((month, index) => {
                            const isSelected = selectedYear === currentYear && index === currentMonth;
                            const isCurrent = selectedYear === new Date().getFullYear() && index === new Date().getMonth();

                            return (
                                <button
                                    key={month}
                                    type="button"
                                    onClick={() => handleMonthSelect(index)}
                                    className={`px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${isSelected
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                        : isCurrent
                                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-700'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700'
                                        }`}
                                >
                                    {month.slice(0, 3)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-dark-700">
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date();
                                const monthStr = String(now.getMonth() + 1).padStart(2, '0');
                                onChange(`${now.getFullYear()}-${monthStr}`);
                                setSelectedYear(now.getFullYear());
                                setIsOpen(false);
                            }}
                            className="w-full py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                            Go to Current Month
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthPicker;
