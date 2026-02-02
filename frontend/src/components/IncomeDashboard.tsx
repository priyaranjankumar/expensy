import React, { useState, useEffect } from 'react';
import { incomeApi } from '../services/api';
import type { Income, IncomeCreate, IncomeSummary } from '../types';
import { getCurrentBillingMonth, formatBillingMonth } from '../types';
import CustomDropdown from './CustomDropdown';
import { Checkbox } from './ui/Checkbox';

interface IncomeDashboardProps {
    className?: string;
    billingMonth?: string;
}

const IncomeDashboard: React.FC<IncomeDashboardProps> = ({ className = '', billingMonth }) => {
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [summary, setSummary] = useState<IncomeSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const currentMonth = billingMonth || getCurrentBillingMonth();

    // Form state
    const [formData, setFormData] = useState<IncomeCreate>({
        source: '',
        description: '',
        amount: 0,
        billing_month: currentMonth,
        is_recurring: false,
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, [currentMonth]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [incomesData, summaryData] = await Promise.all([
                incomeApi.getAll(currentMonth),
                incomeApi.getSummary(currentMonth)
            ]);
            setIncomes(incomesData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Failed to load income data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingIncome) {
                await incomeApi.update(editingIncome.id, formData);
            } else {
                await incomeApi.create({ ...formData, billing_month: currentMonth });
            }
            setShowModal(false);
            setEditingIncome(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to save income:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this income entry?')) return;
        try {
            await incomeApi.delete(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete income:', error);
        }
    };

    const handleEdit = (income: Income) => {
        setEditingIncome(income);
        setFormData({
            source: income.source,
            description: income.description || '',
            amount: income.amount,
            billing_month: income.billing_month,
            received_date: income.received_date,
            is_recurring: income.is_recurring,
            notes: income.notes || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            source: '',
            description: '',
            amount: 0,
            billing_month: currentMonth,
            is_recurring: false,
            notes: ''
        });
    };

    const openNewModal = () => {
        setEditingIncome(null);
        resetForm();
        setShowModal(true);
    };

    // Source color mapping
    const sourceColors: Record<string, string> = {
        'Salary': 'bg-green-500',
        'Freelance': 'bg-blue-500',
        'Investment': 'bg-purple-500',
        'Rental': 'bg-orange-500',
        'Business': 'bg-indigo-500',
        'Other': 'bg-gray-500'
    };

    const getSourceColor = (source: string) => {
        return sourceColors[source] || 'bg-gray-500';
    };

    return (
        <div className={`card p-5 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Income - {formatBillingMonth(currentMonth)}
                    </h2>
                </div>
                <button
                    onClick={openNewModal}
                    className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Income
                </button>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-3">
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                            <p className="text-sm opacity-80">Total Income</p>
                            <p className="text-2xl font-bold">₹{summary?.total_income.toLocaleString() || 0}</p>
                            <p className="text-xs opacity-70 mt-1">{summary?.income_count || 0} entries</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">By Source</p>
                            <div className="mt-2 space-y-1">
                                {summary?.by_source.slice(0, 3).map(item => (
                                    <div key={item.source} className="flex justify-between text-xs">
                                        <span className="flex items-center gap-1">
                                            <span className={`w-2 h-2 rounded-full ${getSourceColor(item.source)}`}></span>
                                            {item.source}
                                        </span>
                                        <span className="font-medium">₹{item.total.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Income List */}
                    {incomes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>No income recorded for this month</p>
                            <button onClick={openNewModal} className="text-indigo-600 dark:text-indigo-400 text-sm mt-2 hover:underline">
                                Add your first income
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {incomes.map(income => (
                                <div
                                    key={income.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${getSourceColor(income.source)}`}></div>
                                        <div>
                                            <p className="font-medium text-sm">{income.source}</p>
                                            {income.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{income.description}</p>
                                            )}
                                        </div>
                                        {income.is_recurring && (
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                                Recurring
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            +₹{income.amount.toLocaleString()}
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEdit(income)}
                                                className="p-1 text-gray-400 hover:text-indigo-600"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(income.id)}
                                                className="p-1 text-gray-400 hover:text-red-600"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl scale-100 transition-transform" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                            {editingIncome ? '✏️ Edit Income' : '💰 Add Income'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Source *</label>
                                <CustomDropdown
                                    value={formData.source}
                                    onChange={(val) => setFormData({ ...formData, source: val })}
                                    options={[
                                        { value: 'Salary', label: 'Salary', icon: '💼' },
                                        { value: 'Freelance', label: 'Freelance', icon: '👨‍💻' },
                                        { value: 'Investment', label: 'Investment', icon: '📈' },
                                        { value: 'Rental', label: 'Rental', icon: '🏠' },
                                        { value: 'Business', label: 'Business', icon: '🏢' },
                                        { value: 'Other', label: 'Other', icon: '📦' }
                                    ]}
                                    placeholder="Select source"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                    placeholder="e.g., Monthly salary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Amount *</label>
                                    <input
                                        type="number"
                                        value={formData.amount || ''}
                                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Date</label>
                                    <input
                                        type="date"
                                        value={formData.received_date || ''}
                                        onChange={e => setFormData({ ...formData, received_date: e.target.value })}
                                        className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-3xl">
                                <Checkbox
                                    id="is_recurring"
                                    checked={formData.is_recurring}
                                    onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })}
                                    label="This is recurring income"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 ml-1 text-gray-700 dark:text-gray-300">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none"
                                    rows={2}
                                    placeholder="Any additional notes..."
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-3xl font-medium hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all">
                                    {editingIncome ? 'Update' : 'Add'} Income
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomeDashboard;
