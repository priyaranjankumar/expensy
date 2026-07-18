import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    label,
    description,
    className = '',
    checked,
    onChange,
    disabled,
    id,
    ...props
}) => {
    // Generate a random ID if none provided to link label correctly
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`flex ${description ? 'items-start' : 'items-center'} gap-3 ${className}`}>
            <div className={`relative flex items-center ${description ? 'mt-1' : ''}`}>
                <input
                    type="checkbox"
                    id={inputId}
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className="peer sr-only" // Hide the native checkbox
                    {...props}
                />
                <div
                    className={`
                        w-5 h-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center cursor-pointer
                        peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-indigo-500/50
                        ${checked
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent shadow-md transform scale-105'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-400 shadow-sm'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                    `}
                    onClick={() => !disabled && document.getElementById(inputId)?.click()}
                >
                    <svg
                        className={`w-3 h-3 text-white transition-all duration-200 ${checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>
            {label && (
                <div className="flex flex-col">
                    <label
                        htmlFor={inputId}
                        className={`text-sm font-medium transition-colors cursor-pointer select-none ${disabled ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}
                    >
                        {label}
                    </label>
                    {description && (
                        <p className={`text-xs mt-0.5 ${disabled ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
