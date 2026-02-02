import { useState, useRef, useEffect } from 'react';

interface DropdownOption {
    value: string;
    label: string;
    icon?: string;
}

interface CustomDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: DropdownOption[];
    placeholder?: string;
    className?: string;
    icon?: string;
    direction?: 'up' | 'down';
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select option',
    className = '',
    icon,
    direction = 'down',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

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

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 px-6 h-11 bg-white dark:bg-dark-700 border rounded-3xl text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${isOpen
                    ? 'border-primary-500 ring-2 ring-primary-500/20'
                    : 'border-slate-200 dark:border-dark-600 hover:border-slate-300 dark:hover:border-dark-500'
                    }`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {icon && <span className="text-sm">{icon}</span>}
                    <span className={`text-sm truncate ${selectedOption ? 'text-slate-800 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                        {selectedOption?.label || placeholder}
                    </span>
                </div>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`absolute z-[100] left-0 right-0 bg-white dark:bg-dark-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-dark-600 overflow-hidden animate-fade-in max-h-72 overflow-y-auto ${direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                    }`}>
                    {options.map((option, index) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-6 py-2.5 text-left transition-all duration-150 ${option.value === value
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700'
                                } ${index === 0 ? 'rounded-t-3xl' : ''} ${index === options.length - 1 ? 'rounded-b-3xl' : ''}`}
                        >
                            {option.icon && <span className="text-sm">{option.icon}</span>}
                            <span className="text-sm font-medium">{option.label}</span>
                            {option.value === value && (
                                <svg className="w-4 h-4 ml-auto text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
