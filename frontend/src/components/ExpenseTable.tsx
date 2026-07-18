import React, { useState, useMemo } from 'react';
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
    FileText 
} from 'lucide-react';
import type { Expense } from '../types';
import Modal from './Modal';
import EmptyState from './EmptyState';

interface ExpenseTableProps {
    expenses: Expense[];
    loading: boolean;
    onEdit: (expense: Expense) => void;
    onDelete: (id: number) => void;
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

const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, loading, onEdit, onDelete }) => {
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [categoryModal, setCategoryModal] = useState<CategoryModalData | null>(null);

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
                {/* Category Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedCategories.map((category) => {
                        const group = groupedExpenses[category];
                        const style = getCategoryStyle(category);

                        return (
                            <button
                                key={category}
                                onClick={() => handleCategoryClick(category)}
                                className="card border-0 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] text-left group"
                            >
                                {/* Category Header */}
                                <div className={`p-4 bg-gradient-to-br ${style.bg} text-white`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                                                {style.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">{category}</h3>
                                                <p className="text-xs text-white/80">
                                                    {group.expenses.length} item{group.expenses.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-white">{formatCurrency(group.total)}</p>
                                            {group.unpaidTotal > 0 && (
                                                <p className="text-xs text-white/80">
                                                    {formatCurrency(group.unpaidTotal)} unpaid
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Items */}
                                <div className="p-3 bg-slate-50 dark:bg-dark-800/50">
                                    <div className="flex flex-wrap gap-2">
                                        {group.expenses.slice(0, 3).map((expense) => (
                                            <div
                                                key={expense.id}
                                                className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-dark-700 rounded-xl border border-slate-200 dark:border-dark-600 text-xs"
                                            >
                                                <span className={`w-2 h-2 rounded-full ${getStatusClasses(expense.status)}`}></span>
                                                <span className="text-slate-700 dark:text-slate-200 truncate max-w-[80px]">{expense.description}</span>
                                            </div>
                                        ))}
                                        {group.expenses.length > 3 && (
                                            <div className="flex items-center px-2.5 py-1.5 bg-slate-100 dark:bg-dark-600 rounded-lg text-xs text-slate-500 dark:text-slate-400">
                                                +{group.expenses.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-2 group-hover:text-primary-500 transition-colors">
                                        Click to view all →
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400 pt-4">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/30"></span> Unpaid
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30"></span> Paid
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/30"></span> Completely Paid
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
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-dark-700 rounded-xl">
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(categoryModal.total)}</p>
                            </div>
                            {categoryModal.unpaidTotal > 0 && (
                                <div className="flex-1 border-l border-slate-200 dark:border-dark-600 pl-4">
                                    <p className="text-sm text-red-500">Unpaid</p>
                                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(categoryModal.unpaidTotal)}</p>
                                </div>
                            )}
                        </div>

                        {/* Expense List */}
                        <div className="space-y-2">
                            {categoryModal.expenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="flex items-center justify-between p-4 bg-white dark:bg-dark-700 rounded-xl border border-slate-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-500/50 hover:shadow-md transition-all duration-200 group"
                                >
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <span className={`w-4 h-4 rounded-full flex-shrink-0 shadow-lg ${getStatusClasses(expense.status)}`}></span>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-slate-800 dark:text-white">{expense.description}</p>
                                            {expense.notes && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{expense.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(expense.amount)}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{expense.status}</p>
                                        </div>
                                        {deleteConfirm === expense.id ? (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => handleConfirmDelete(expense.id, e)}
                                                    className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 font-medium shadow-lg shadow-red-500/30"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                                                    className="px-3 py-1.5 bg-slate-200 dark:bg-dark-600 text-slate-700 dark:text-slate-300 text-xs rounded-lg hover:bg-slate-300 dark:hover:bg-dark-500 font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEdit(expense); setCategoryModal(null); }}
                                                    className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteClick(expense.id, e)}
                                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
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
