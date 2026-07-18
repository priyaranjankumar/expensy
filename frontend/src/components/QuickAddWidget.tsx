import React, { useState } from 'react';
import { Plus, Sparkles, Home, Zap, Smartphone } from 'lucide-react';
import type { Expense } from '../types';

interface QuickAddWidgetProps {
    onOpenModal: (defaultValues?: Partial<Expense>) => void;
    className?: string;
}

const QuickAddWidget: React.FC<QuickAddWidgetProps> = ({
    onOpenModal,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const quickTemplates = [
        { icon: <Home className="w-4 h-4" />, label: "Rent", bg: "from-cyan-500 to-teal-650", data: { category: "Rent", description: "Apartment Rent", status: "Unpaid" as const } },
        { icon: <Zap className="w-4 h-4" />, label: "Bills", bg: "from-amber-500 to-orange-600", data: { category: "Utilities", description: "Utility Bill", status: "Unpaid" as const } },
        { icon: <Smartphone className="w-4 h-4" />, label: "Subs", bg: "from-purple-500 to-violet-600", data: { category: "Subscription", description: "Subscription renewal", status: "Unpaid" as const } },
    ];

    return (
        <div className={`fixed bottom-6 right-6 z-40 flex flex-col items-center ${className}`}>
            {/* Quick Actions Radial/Vertical Menu */}
            {isOpen && (
                <div className="flex flex-col items-center gap-2 mb-3 animate-slide-up">
                    {quickTemplates.map((template, idx) => (
                        <div key={idx} className="flex items-center gap-2 group">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-[9px] font-bold px-2 py-1 rounded-lg pointer-events-none shadow-md">
                                {template.label}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    onOpenModal(template.data);
                                    setIsOpen(false);
                                }}
                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${template.bg} text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95`}
                                title={template.label}
                            >
                                {template.icon}
                            </button>
                        </div>
                    ))}
                    {/* Add Custom Trigger */}
                    <div className="flex items-center gap-2 group">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-[9px] font-bold px-2 py-1 rounded-lg pointer-events-none shadow-md">
                            Custom
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                onOpenModal();
                                setIsOpen(false);
                            }}
                            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-slate-200/50 dark:border-slate-800/40"
                            title="Add Custom"
                        >
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-650 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                aria-label="Add Expense Menu"
            >
                <Plus className={`w-7 h-7 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
            </button>
        </div>
    );
};

export default QuickAddWidget;
