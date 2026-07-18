import React, { useState, useEffect } from 'react';
import { 
    Coins, 
    Plus, 
    Edit2, 
    Trash2, 
    Check
} from 'lucide-react';
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
        'Salary': 'bg-emerald-500',
        'Freelance': 'bg-indigo-500',
        'Investment': 'bg-purple-500',
        'Rental': 'bg-orange-500',
        'Business': 'bg-pink-500',
        'Other': 'bg-slate-500'
    };

    const getSourceColor = (source: string) => {
        return sourceColors[source] || 'bg-slate-500';
    };

    return (
        <div className={`card p-6 card-hover ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        <Coins className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                        Income Ledger — <span className="font-semibold text-slate-500 dark:text-slate-400">{formatBillingMonth(currentMonth)}</span>
                    </h2>
                </div>
                <button
                    onClick={openNewModal}
                    className="btn btn-primary text-xs py-2 px-3 flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/10 focus:ring-emerald-500 border-none"
                >
                    <Plus className="w-4 h-4" /> Add Income
                </button>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-slate-200 dark:bg-slate-800/80 rounded-2xl"></div>
                        <div className="h-20 bg-slate-200 dark:bg-slate-800/80 rounded-2xl"></div>
                    </div>
                    <div className="h-44 bg-slate-200 dark:bg-slate-800/80 rounded-2xl"></div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/10 flex flex-col justify-between h-28">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider opacity-85">Total Monthly Income</p>
                                <p className="text-2xl font-bold font-mono mt-1">₹{summary?.total_income.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                            </div>
                            <p className="text-[10px] font-semibold opacity-75">{summary?.income_count || 0} credited entries</p>
                        </div>
                        
                        <div className="glass border border-slate-250/60 dark:border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between h-28">
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Top Sources</p>
                            <div className="space-y-1.5 mt-2">
                                {summary?.by_source.length === 0 ? (
                                    <p className="text-xs text-slate-400 dark:text-slate-600">No income data yet</p>
                                ) : (
                                    summary?.by_source.slice(0, 2).map(item => (
                                        <div key={item.source} className="flex justify-between items-center text-xs">
                                            <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
                                                <span className={`w-2 h-2 rounded-full ${getSourceColor(item.source)}`}></span>
                                                {item.source}
                                            </span>
                                            <span className="font-bold text-slate-800 dark:text-white font-mono">₹{item.total.toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Income List */}
                    {incomes.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-slate-250 dark:border-slate-800/80 rounded-3xl p-6">
                            <Coins className="w-10 h-10 mx-auto mb-3.5 text-slate-350 dark:text-slate-650" />
                            <h3 className="text-sm font-bold text-slate-850 dark:text-white mb-1">No Income Credited</h3>
                            <p className="text-xs text-slate-450 dark:text-slate-505 mb-4">Record salary, freelance work, or rental income for this month</p>
                            <button onClick={openNewModal} className="btn btn-primary text-xs py-2 bg-gradient-to-r from-emerald-500 to-green-600 border-none shadow-emerald-500/10">
                                Add Your First Income
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {incomes.map(income => (
                                <div
                                    key={income.id}
                                    className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700/60 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${getSourceColor(income.source)}`}></div>
                                        <div>
                                            <p className="font-bold text-slate-850 dark:text-white text-xs leading-snug">{income.source}</p>
                                            {income.description && (
                                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-none mt-1">{income.description}</p>
                                            )}
                                        </div>
                                        {income.is_recurring && (
                                            <span className="text-[9px] font-extrabold bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-200/20 dark:border-blue-800/20 tracking-wider uppercase">
                                                Recurring
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                                            +₹{income.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEdit(income)}
                                                className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-650 rounded-lg border border-slate-200 dark:border-slate-750 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(income.id)}
                                                className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 dark:border-slate-750 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3 h-3" />
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
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" 
                    onClick={() => setShowModal(false)}
                >
                    <div 
                        className="bg-white dark:bg-[#0f172a] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl scale-100 transition-transform" 
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                            {editingIncome ? '✏️ Edit Income' : '💰 Add Income'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Source *</label>
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
                                <label className="label">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="input text-sm"
                                    placeholder="e.g., Monthly salary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Amount (₹) *</label>
                                    <input
                                        type="number"
                                        value={formData.amount || ''}
                                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className="input text-sm"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Date</label>
                                    <input
                                        type="date"
                                        value={formData.received_date || ''}
                                        onChange={e => setFormData({ ...formData, received_date: e.target.value })}
                                        className="input text-sm"
                                    />
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl">
                                <Checkbox
                                    id="is_recurring"
                                    checked={formData.is_recurring}
                                    onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })}
                                    label="This is recurring income"
                                />
                            </div>
                            <div>
                                <label className="label">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="input text-sm h-20 resize-none py-2"
                                    placeholder="Any additional notes..."
                                />
                            </div>
                            <div className="flex gap-4 pt-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    className="btn btn-secondary flex-1 py-2.5 text-xs"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary flex-1 py-2.5 text-xs bg-gradient-to-r from-emerald-500 to-green-600 border-none shadow-emerald-500/10 focus:ring-emerald-500"
                                >
                                    <Check className="w-4 h-4" /> {editingIncome ? 'Update' : 'Add'} Income
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
