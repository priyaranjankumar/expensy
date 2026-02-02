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
    const baseStyles = "rounded-2xl transition-all duration-300";

    const variants = {
        default: "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md",
        glass: "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-glass",
        outlined: "bg-transparent border border-slate-200 dark:border-slate-700"
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
