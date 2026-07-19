import { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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
                className="w-full flex items-center justify-between gap-3 px-5 h-11 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-3xl text-left transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 shadow-sm"
            >
                <div className="flex items-center gap-2.5">
                    <CalendarDays className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        {value ? formatBillingMonth(value) : 'Select Month'}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-800/60 overflow-hidden animate-fade-in">
                    {/* Year Selector */}
                    <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
                        <button
                            type="button"
                            onClick={() => handleYearChange(-1)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-xs tracking-wide">{selectedYear}</span>
                        <button
                            type="button"
                            onClick={() => handleYearChange(1)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
                        >
                            <ChevronRight className="w-4 h-4" />
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
                                    className={`px-2 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 ${isSelected
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                        : isCurrent
                                            ? 'bg-primary-105 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-750'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {month.slice(0, 3)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="px-3 pb-2 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date();
                                const monthStr = String(now.getMonth() + 1).padStart(2, '0');
                                onChange(`${now.getFullYear()}-${monthStr}`);
                                setSelectedYear(now.getFullYear());
                                setIsOpen(false);
                            }}
                            className="w-full py-1.5 text-[11px] font-bold text-primary-650 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-xl transition-colors"
                        >
                            Current Month
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthPicker;
