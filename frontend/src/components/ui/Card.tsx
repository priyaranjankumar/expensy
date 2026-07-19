import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    variant = 'default',
    onClick,
    ...props
}) => {
    const baseStyles = "rounded-3xl transition-all duration-300";

    const variants = {
        default: "bg-white dark:bg-slate-900/30 shadow-sm border border-slate-200 dark:border-slate-800/80 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700/60",
        glass: "bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/40 shadow-glass",
        outlined: "bg-transparent border border-slate-200 dark:border-slate-800"
    };

    return (
        <div
            className={`${baseStyles} ${variants[variant]} ${className} ${onClick ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700' : ''}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};
