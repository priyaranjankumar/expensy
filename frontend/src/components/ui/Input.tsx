import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    leftIcon,
    id,
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="label">
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={id}
                    className={`
                        w-full px-5 py-2.5 text-sm rounded-2xl border transition-all duration-200
                        bg-slate-50/50 dark:bg-slate-900/30 
                        border-slate-200 dark:border-slate-800/80 
                        text-slate-900 dark:text-white 
                        placeholder-slate-400 dark:placeholder-slate-500
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                        disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-500
                        ${leftIcon ? 'pl-10' : ''}
                        ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};
