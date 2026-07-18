import React, { useState, useMemo, useEffect } from 'react';
import { 
    Receipt, 
    Zap, 
    Smartphone, 
    TrendingUp, 
    Home, 
    Building, 
    CreditCard, 
    Shield, 
    ShoppingCart, 
    Car, 
    FileText,
    Edit2,
    Trash2
} from 'lucide-react';
import type { Expense } from '../types';
import Modal from './Modal';
import EmptyState from './EmptyState';

interface ExpenseTableProps {
    expenses: Expense[];
    loading: boolean;
    onEdit: (expense: Partial<Expense>) => void;
    onDelete: (id: number) => void;
    onStatusToggle?: (id: number, currentStatus: string) => void;
    searchTerm?: string;
}

// Format currency in INR (compact)
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Get status badge classes
const getStatusClasses = (status: string): string => {
    switch (status) {
        case 'Unpaid':
            return 'bg-red-500 shadow-red-500/30';
        case 'Paid':
            return 'bg-blue-500 shadow-blue-500/30';
        case 'Completely Paid':
            return 'bg-green-500 shadow-green-500/30';
        default:
            return 'bg-slate-400';
    }
};

// Get category colors
const getCategoryStyle = (category: string) => {
    const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
        'Utilities': { bg: 'from-amber-500 to-orange-600', icon: <Zap className="w-5 h-5 text-white" /> },
        'Subscription': { bg: 'from-purple-500 to-violet-600', icon: <Smartphone className="w-5 h-5 text-white" /> },
        'SIP': { bg: 'from-emerald-500 to-green-600', icon: <TrendingUp className="w-5 h-5 text-white" /> },
        'Rent': { bg: 'from-cyan-500 to-teal-600', icon: <Home className="w-5 h-5 text-white" /> },
        'EMI': { bg: 'from-fuchsia-500 to-pink-600', icon: <Building className="w-5 h-5 text-white" /> },
        'Credit Card Bill': { bg: 'from-blue-500 to-indigo-600', icon: <CreditCard className="w-5 h-5 text-white" /> },
        'Insurance': { bg: 'from-teal-500 to-cyan-600', icon: <Shield className="w-5 h-5 text-white" /> },
        'Groceries': { bg: 'from-lime-500 to-green-600', icon: <ShoppingCart className="w-5 h-5 text-white" /> },
        'Transportation': { bg: 'from-sky-500 to-blue-600', icon: <Car className="w-5 h-5 text-white" /> },
    };
    return styles[category] || { bg: 'from-slate-500 to-slate-600', icon: <FileText className="w-5 h-5 text-white" /> };
};

interface GroupedExpenses {
    [category: string]: {
        expenses: Expense[];
        total: number;
        unpaidTotal: number;
    };
}

interface CategoryModalData {
    category: string;
    expenses: Expense[];
    total: number;
    unpaidTotal: number;
}

const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, loading, onEdit, onDelete, onStatusToggle, searchTerm }) => {
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [categoryModal, setCategoryModal] = useState<CategoryModalData | null>(null);
    const [viewMode, setViewMode] = useState<'category' | 'chrono'>(() => {
        return (localStorage.getItem('expense-view-mode') as 'category' | 'chrono') || 'category';
    });

    const handleViewModeChange = (mode: 'category' | 'chrono') => {
        setViewMode(mode);
        localStorage.setItem('expense-view-mode', mode);
    };

    // Group expenses by category
    const groupedExpenses = useMemo(() => {
        const groups: GroupedExpenses = {};

        expenses.forEach((expense) => {
            if (!groups[expense.category]) {
                groups[expense.category] = { expenses: [], total: 0, unpaidTotal: 0 };
            }
            groups[expense.category].expenses.push(expense);
            groups[expense.category].total += expense.amount;
            if (expense.status === 'Unpaid') {
                groups[expense.category].unpaidTotal += expense.amount;
            }
        });

        Object.values(groups).forEach((group) => {
            group.expenses.sort((a, b) => b.amount - a.amount);
        });

        return groups;
    }, [expenses]);

    // Get sorted category names (by unpaid total descending)
    const sortedCategories = useMemo(() => {
        return Object.keys(groupedExpenses).sort(
            (a, b) => groupedExpenses[b].unpaidTotal - groupedExpenses[a].unpaidTotal
        );
    }, [groupedExpenses]);

    const handleDeleteClick = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirm(id);
    };

    const handleConfirmDelete = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(id);
        setDeleteConfirm(null);
    };

    const handleCategoryClick = (category: string) => {
        const group = groupedExpenses[category];
        setCategoryModal({
            category,
            expenses: group.expenses,
            total: group.total,
            unpaidTotal: group.unpaidTotal,
        });
    };

    // Update internal modal lists if main expenses change
    useEffect(() => {
        if (categoryModal) {
            const activeGroup = groupedExpenses[categoryModal.category];
            if (activeGroup) {
                setCategoryModal({
                    category: categoryModal.category,
                    expenses: activeGroup.expenses,
                    total: activeGroup.total,
                    unpaidTotal: activeGroup.unpaidTotal
                });
            } else {
                setCategoryModal(null);
            }
        }
    }, [expenses, groupedExpenses]);

    const highlightMatch = (text: string, search?: string) => {
        if (!search || !text) return <span>{text}</span>;
        const cleanSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const parts = text.split(new RegExp(`(${cleanSearch})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === search.toLowerCase() 
                        ? <mark key={i} className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 px-0.5 rounded font-semibold">{part}</mark> 
                        : part
                )}
            </span>
        );
    };

    const renderStatusCheckbox = (expense: Expense) => {
        const isPaid = expense.status === 'Paid' || expense.status === 'Completely Paid';
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onStatusToggle) {
                        onStatusToggle(expense.id, expense.status);
                    }
                }}
                className="flex-shrink-0 focus:outline-none transition-all active:scale-90"
                title={isPaid ? "Mark as Unpaid" : "Mark as Paid"}
            >
                {isPaid ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-slate-350 dark:border-slate-655 hover:border-emerald-500 dark:hover:border-emerald-500 flex items-center justify-center text-transparent hover:text-emerald-500 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                )}
            </button>
        );
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-200 dark:bg-dark-700 rounded-3xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (expenses.length === 0) {
        return (
            <div className="card">
                <EmptyState
                    icon={Receipt}
                    title="No expenses found"
                    description="Try adjusting your filters or add a new expense to get started."
                />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {/* View Switcher Row */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
                    <div className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 tracking-tight">Ledger Layout</h3>
                    </div>
                    
                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/20">
                        <button
                            type="button"
                            onClick={() => handleViewModeChange('category')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                viewMode === 'category'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            Categories Grid
                        </button>
                        <button
                            type="button"
                            onClick={() => handleViewModeChange('chrono')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                viewMode === 'chrono'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            Chrono Stream
                        </button>
                    </div>
                </div>

                {viewMode === 'category' ? (
                    /* Category Cards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedCategories.map((category) => {
                            const group = groupedExpenses[category];
                            const style = getCategoryStyle(category);
                            return (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryClick(category)}
                                    className="card p-5 text-left hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group border border-slate-200 dark:border-slate-800/60 relative overflow-hidden"
                                >
                                    {/* Subtle Gradient Backglow */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} opacity-[0.02] dark:opacity-[0.04]`}></div>
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.bg} flex items-center justify-center shadow-lg shadow-indigo-500/10`}>
                                                {style.icon}
                                            </div>
                                            {group.unpaidTotal > 0 && (
                                                <span className="px-2.5 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full text-[10px] font-bold border border-red-200/30 dark:border-red-900/30">
                                                    Unpaid: {formatCurrency(group.unpaidTotal)}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-base truncate mb-1">{category}</h4>
                                        <div className="flex justify-between items-baseline mt-2">
                                            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">
                                                {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}
                                            </p>
                                            <p className="font-extrabold text-slate-900 dark:text-white text-lg">
                                                {formatCurrency(group.total)}
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/30 flex items-center justify-between gap-1">
                                            <div className="flex -space-x-1 overflow-hidden">
                                                {group.expenses.slice(0, 3).map((expense) => (
                                                    <div
                                                        key={expense.id}
                                                        className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-800/30 text-[9px] font-semibold text-slate-655 dark:text-slate-350"
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusClasses(expense.status)}`}></span>
                                                        <span className="truncate max-w-[50px]">{expense.description}</span>
                                                    </div>
                                                ))}
                                                {group.expenses.length > 3 && (
                                                    <div className="flex items-center px-1.5 py-1 bg-slate-100 dark:bg-slate-850 rounded-lg text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                                        +{group.expenses.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 group-hover:text-primary-500 transition-colors">
                                                View all →
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    /* Chrono Stream View */
                    <div className="space-y-2.5 animate-fade-in">
                        {expenses.map((expense) => {
                            return (
                                <div
                                    key={expense.id}
                                    className="flex items-center justify-between p-4 bg-white dark:bg-[#0f172a]/70 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-primary-400/50 dark:hover:border-primary-500/50 hover:shadow-md transition-all duration-200 group relative"
                                >
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        {/* Status Checkbox toggle */}
                                        {renderStatusCheckbox(expense)}
                                        
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                                                    {highlightMatch(expense.description, searchTerm)}
                                                </p>
                                                <span className="text-[9px] font-extrabold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 rounded-full flex items-center gap-1 border border-slate-200/20 dark:border-slate-800/20">
                                                    {highlightMatch(expense.category, searchTerm)}
                                                </span>
                                            </div>
                                            {expense.notes && (
                                                <p className="text-xs text-slate-450 dark:text-slate-450 truncate mt-0.5">
                                                    {highlightMatch(expense.notes, searchTerm)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="font-extrabold text-slate-900 dark:text-white text-base">
                                                {formatCurrency(expense.amount)}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                                {expense.billing_month}
                                            </p>
                                        </div>
                                        
                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => onEdit(expense)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            {deleteConfirm === expense.id ? (
                                                <div className="flex gap-1 items-center">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleConfirmDelete(expense.id, e)}
                                                        className="px-2 py-1 bg-red-500 text-white text-[10px] rounded-lg hover:bg-red-650 font-bold shadow-sm"
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-655 dark:text-slate-350 text-[10px] rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-bold"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteClick(expense.id, e)}
                                                    className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-slate-450 dark:text-slate-500 pt-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/30"></span> Unpaid
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30"></span> Paid
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/30"></span> Completely Paid
                    </div>
                </div>
            </div>

            {/* Category Detail Modal */}
            {categoryModal && (
                <Modal
                    isOpen={true}
                    onClose={() => setCategoryModal(null)}
                    title={categoryModal.category}
                    subtitle={`${categoryModal.expenses.length} expenses • ${formatCurrency(categoryModal.total)}`}
                    icon={getCategoryStyle(categoryModal.category).icon}
                    size="lg"
                >
                    <div className="p-4 space-y-3">
                        {/* Summary Bar */}
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-850 rounded-2xl">
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-slate-500">Category Spent</p>
                                <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{formatCurrency(categoryModal.total)}</p>
                            </div>
                            {categoryModal.unpaidTotal > 0 && (
                                <div className="flex-1 border-l border-slate-200 dark:border-slate-800/40 pl-4">
                                    <p className="text-xs font-semibold text-red-500">Pending Dues</p>
                                    <p className="text-xl font-extrabold text-red-600 dark:text-red-400 mt-0.5">{formatCurrency(categoryModal.unpaidTotal)}</p>
                                </div>
                            )}
                        </div>

                        {/* Expense List */}
                        <div className="space-y-2">
                            {categoryModal.expenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-500/50 hover:shadow-md transition-all duration-200 group"
                                >
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        {/* Status Checkbox toggle */}
                                        {renderStatusCheckbox(expense)}
                                        
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">
                                                {highlightMatch(expense.description, searchTerm)}
                                            </p>
                                            {expense.notes && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                    {highlightMatch(expense.notes, searchTerm)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(expense.amount)}</p>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{expense.status}</p>
                                        </div>
                                        {deleteConfirm === expense.id ? (
                                            <div className="flex gap-1 items-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleConfirmDelete(expense.id, e)}
                                                    className="px-2 py-1 bg-red-500 text-white text-[10px] rounded-lg hover:bg-red-600 font-bold shadow-sm"
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                                                    className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-bold"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); onEdit(expense); setCategoryModal(null); }}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteClick(expense.id, e)}
                                                    className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default ExpenseTable;
