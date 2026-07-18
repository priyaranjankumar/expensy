import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction
}) => {
    return (
        <div className="relative overflow-hidden flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in rounded-3xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/40 shadow-inner">
            {/* Glowing Backdrop */}
            <div className="absolute -top-10 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-2xl flex items-center justify-center mb-5 border border-indigo-500/20 dark:border-indigo-500/30 shadow-md">
                <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>

            <h3 className="relative text-lg font-bold text-slate-800 dark:text-slate-100 mb-1.5 tracking-tight">
                {title}
            </h3>

            <p className="relative text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed font-medium">
                {description}
            </p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="relative btn btn-primary py-2 px-5 text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
