import React, { useState, useEffect } from 'react';
import { recurringApi, expenseApi } from '../services/api';
import type { RecurringExpense, RecurringExpenseCreate, RecurringFrequency } from '../types';
import { getCurrentBillingMonth, formatBillingMonth } from '../types';
import CustomDropdown from './CustomDropdown';
import { Checkbox } from './ui/Checkbox';

// Helper function to get category icons
function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        'Utilities': '⚡',
        'Subscription': '📱',
        'SIP': '📈',
        'Rent': '🏠',
        'EMI': '💳',
        'Credit Card Bill': '💳',
        'Insurance': '🛡️',
        'Groceries': '🛒',
        'Transportation': '🚗',
        'Entertainment': '🎬',
        'Healthcare': '🏥',
        'Education': '📚',
    };
    return icons[category] || '📋';
}

interface RecurringExpensesPageProps {
    className?: string;
    onClose?: () => void;
}

const RecurringExpensesPage: React.FC<RecurringExpensesPageProps> = ({ className = '', onClose }) => {
    const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);
    const [generating, setGenerating] = useState<number | null>(null);
    const [categories, setCategories] = useState<string[]>([]);

    const [formData, setFormData] = useState<RecurringExpenseCreate>({
        category: '',
        description: '',
        amount: 0,
        frequency: 'monthly',
        day_of_month: 1,
        is_active: true,
        notes: '',
        start_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [recurringData, categoriesData] = await Promise.all([
                recurringApi.getAll(),
                expenseApi.getCategories()
            ]);
            setRecurring(recurringData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Failed to load recurring expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await recurringApi.update(editingItem.id, formData);
            } else {
                await recurringApi.create(formData);
            }
            setShowModal(false);
            setEditingItem(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to save recurring expense:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this recurring expense? This will not delete already generated expenses.')) return;
        try {
            await recurringApi.delete(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleGenerate = async (id: number) => {
        const month = getCurrentBillingMonth();
        try {
            setGenerating(id);
            await recurringApi.generate(id, month);
            alert(`Expense generated for ${formatBillingMonth(month)}!`);
            loadData();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to generate expense');
        } finally {
            setGenerating(null);
        }
    };

    const handleEdit = (item: RecurringExpense) => {
        setEditingItem(item);
        setFormData({
            category: item.category,
            description: item.description,
            amount: item.amount,
            frequency: item.frequency,
            day_of_month: item.day_of_month,
            is_active: item.is_active,
            notes: item.notes || '',
            start_date: item.start_date,
            end_date: item.end_date
        });
        setShowModal(true);
    };

    const handleToggleActive = async (item: RecurringExpense) => {
        try {
            await recurringApi.update(item.id, { is_active: !item.is_active });
            loadData();
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            category: '',
            description: '',
            amount: 0,
            frequency: 'monthly',
            day_of_month: 1,
            is_active: true,
            notes: '',
            start_date: new Date().toISOString().split('T')[0]
        });
    };

    const openNewModal = () => {
        setEditingItem(null);
        resetForm();
        setShowModal(true);
    };

    const frequencyLabels: Record<RecurringFrequency, string> = {
        'monthly': 'Monthly',
        'weekly': 'Weekly',
        'yearly': 'Yearly'
    };

    const frequencyColors: Record<RecurringFrequency, string> = {
        'monthly': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        'weekly': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        'yearly': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    };

    return (
        <div className={`card p-5 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recurring Expenses</h2>
                    </div>
                </div>
                <button onClick={openNewModal} className="btn-primary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Template
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    ))}
                </div>
            ) : recurring.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Recurring Expenses</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Create templates for bills that repeat every month</p>
                    <button onClick={openNewModal} className="btn-primary">
                        Create Your First Template
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {recurring.map(item => (
                        <div
                            key={item.id}
                            className={`p-4 rounded-xl border transition-all ${item.is_active
                                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{item.description}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${frequencyColors[item.frequency]}`}>
                                            {frequencyLabels[item.frequency]}
                                        </span>
                                        {!item.is_active && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                                Paused
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        {item.day_of_month && (
                                            <span>Day {item.day_of_month} of month</span>
                                        )}
                                        {item.last_generated && (
                                            <span>Last: {formatBillingMonth(item.last_generated)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        ₹{item.amount.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <button
                                            onClick={() => handleGenerate(item.id)}
                                            disabled={generating === item.id || !item.is_active}
                                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
                                            title="Generate expense for this month"
                                        >
                                            {generating === item.id ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(item)}
                                            className={`p-1.5 rounded ${item.is_active ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                                            title={item.is_active ? 'Pause' : 'Resume'}
                                        >
                                            {item.is_active ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl scale-100 transition-transform" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                            {editingItem ? '✏️ Edit Recurring Expense' : '🆕 Create Recurring Expense'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Category *</label>
                                    <CustomDropdown
                                        value={formData.category}
                                        onChange={(val) => setFormData({ ...formData, category: val })}
                                        options={[
                                            ...categories.map(cat => ({ value: cat, label: cat, icon: getCategoryIcon(cat) })),
                                            { value: '__new__', label: '+ New Category', icon: '✨' }
                                        ]}
                                        placeholder="Select category"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Amount *</label>
                                    <input
                                        type="number"
                                        value={formData.amount || ''}
                                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Description *</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="e.g., Netflix subscription"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Frequency *</label>
                                    <CustomDropdown
                                        value={formData.frequency}
                                        onChange={(val) => setFormData({ ...formData, frequency: val as RecurringFrequency })}
                                        options={[
                                            { value: 'monthly', label: 'Monthly', icon: '📅' },
                                            { value: 'weekly', label: 'Weekly', icon: '📆' },
                                            { value: 'yearly', label: 'Yearly', icon: '🗓️' }
                                        ]}
                                        placeholder="Select frequency"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Day of Month</label>
                                    <input
                                        type="number"
                                        value={formData.day_of_month || ''}
                                        onChange={e => setFormData({ ...formData, day_of_month: parseInt(e.target.value) || undefined })}
                                        className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        min="1"
                                        max="31"
                                        placeholder="1-31"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Start Date *</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.end_date || ''}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value || undefined })}
                                        className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                    rows={2}
                                />
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-3xl">
                                <Checkbox
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    label="Active (will generate expenses)"
                                    description="Pause anytime to stop automatic generation"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-3xl font-medium hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all">
                                    {editingItem ? 'Update' : 'Create'} Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecurringExpensesPage;
