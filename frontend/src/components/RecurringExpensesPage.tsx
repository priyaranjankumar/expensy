import React, { useState, useEffect } from 'react';
import { 
    RefreshCw, 
    Plus, 
    Trash2, 
    Edit2, 
    Play, 
    Pause, 
    ArrowLeft, 
    CalendarDays,
    Loader2,
    Film,
    Heart,
    BookOpen
} from 'lucide-react';
import { recurringApi, expenseApi } from '../services/api';
import type { RecurringExpense, RecurringExpenseCreate, RecurringFrequency } from '../types';
import { getCurrentBillingMonth, formatBillingMonth } from '../types';
import CustomDropdown from './CustomDropdown';
import Modal from './Modal';
import MonthPicker from './MonthPicker';

// Helper function to get category icons (React components instead of emojis)
import {
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

const DEFAULT_CATEGORIES = [
    'Utilities',
    'Subscription',
    'SIP',
    'Rent',
    'EMI',
    'Credit Card Bill',
    'Insurance',
    'Groceries',
    'Transportation',
    'Entertainment',
    'Healthcare',
    'Education',
    'Other',
];

function getCategoryIcon(category: string): React.ReactNode {
    const icons: Record<string, React.ReactNode> = {
        'Utilities': <Zap className="w-4 h-4 text-amber-500" />,
        'Subscription': <Smartphone className="w-4 h-4 text-purple-500" />,
        'SIP': <TrendingUp className="w-4 h-4 text-emerald-500" />,
        'Rent': <Home className="w-4 h-4 text-cyan-500" />,
        'EMI': <Building className="w-4 h-4 text-fuchsia-500" />,
        'Credit Card Bill': <CreditCard className="w-4 h-4 text-blue-500" />,
        'Insurance': <Shield className="w-4 h-4 text-teal-500" />,
        'Groceries': <ShoppingCart className="w-4 h-4 text-lime-500" />,
        'Transportation': <Car className="w-4 h-4 text-sky-500" />,
        'Entertainment': <Film className="w-4 h-4 text-red-500" />,
        'Healthcare': <Heart className="w-4 h-4 text-rose-500" />,
        'Education': <BookOpen className="w-4 h-4 text-indigo-500" />,
    };
    return icons[category] || <FileText className="w-4 h-4 text-slate-400" />;
}

// Simple label helper for dropdown config
function getCategoryIconLabel(category: string): string {
    const icons: Record<string, string> = {
        'Utilities': '⚡',
        'Subscription': '📱',
        'SIP': '📈',
        'Rent': '🏠',
        'EMI': '🏦',
        'Credit Card Bill': '💳',
        'Insurance': '🛡️',
        'Groceries': '🛒',
        'Transportation': '🚗',
        'Entertainment': '🎬',
        'Healthcare': '🏥',
        'Education': '📚',
        'Other': '📋',
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

    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');

    const [showMonthSelectModal, setShowMonthSelectModal] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [generateMonth, setGenerateMonth] = useState(getCurrentBillingMonth());

    const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])].sort();

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

    const handleCategoryChange = (value: string) => {
        if (value === '__new__') {
            setShowCustomCategory(true);
            setFormData(prev => ({ ...prev, category: '' }));
        } else {
            setShowCustomCategory(false);
            setFormData(prev => ({ ...prev, category: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const categoryToSubmit = showCustomCategory ? customCategory.trim() : formData.category;
        if (!categoryToSubmit) {
            alert('Category is required');
            return;
        }

        const dataToSubmit = {
            ...formData,
            category: categoryToSubmit
        };

        try {
            if (editingItem) {
                await recurringApi.update(editingItem.id, dataToSubmit);
            } else {
                await recurringApi.create(dataToSubmit);
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

    const handleGenerateClick = (id: number) => {
        setSelectedTemplateId(id);
        setGenerateMonth(getCurrentBillingMonth());
        setShowMonthSelectModal(true);
    };

    const handleGenerateConfirm = async () => {
        if (!selectedTemplateId) return;
        try {
            setGenerating(selectedTemplateId);
            await recurringApi.generate(selectedTemplateId, generateMonth);
            alert(`Expense generated for ${formatBillingMonth(generateMonth)}!`);
            setShowMonthSelectModal(false);
            setSelectedTemplateId(null);
            loadData();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to generate expense');
        } finally {
            setGenerating(null);
        }
    };

    const handleEdit = (item: RecurringExpense) => {
        const allCats = [...new Set([...DEFAULT_CATEGORIES, ...categories])].sort();
        const isCustom = !allCats.includes(item.category);

        setEditingItem(item);
        setFormData({
            category: isCustom ? '' : item.category,
            description: item.description,
            amount: item.amount,
            frequency: item.frequency,
            day_of_month: item.day_of_month,
            is_active: item.is_active,
            notes: item.notes || '',
            start_date: item.start_date,
            end_date: item.end_date
        });
        setShowCustomCategory(isCustom);
        setCustomCategory(isCustom ? item.category : '');
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
        setShowCustomCategory(false);
        setCustomCategory('');
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
        'monthly': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200/30 dark:border-blue-800/30',
        'weekly': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200/30 dark:border-green-800/30',
        'yearly': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200/30 dark:border-purple-800/30'
    };

    return (
        <div className={`card p-6 card-hover ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {onClose && (
                        <button 
                            onClick={onClose} 
                            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-200"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Recurring Templates</h2>
                    </div>
                </div>
                <button 
                    onClick={openNewModal} 
                    className="btn btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" /> Add Template
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="animate-pulse space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800/80 rounded-2xl"></div>
                    ))}
                </div>
            ) : recurring.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl p-6">
                    <RefreshCw className="w-10 h-10 mx-auto mb-3.5 text-slate-300 dark:text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No Templates Yet</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Create templates for bills, subscriptions, or SIPs that repeat</p>
                    <button onClick={openNewModal} className="btn btn-primary text-xs py-2">
                        Create Your First Template
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {recurring.map(item => (
                        <div
                            key={item.id}
                            className={`p-5 rounded-3xl border transition-all ${
                                item.is_active
                                    ? 'bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80 hover:shadow-md'
                                    : 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-200/50 dark:border-slate-800/40 opacity-60'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex-shrink-0">
                                        {getCategoryIcon(item.category)}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">{item.description}</h4>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${frequencyColors[item.frequency]}`}>
                                                {frequencyLabels[item.frequency]}
                                            </span>
                                            {!item.is_active && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                    Paused
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 dark:text-slate-400">{item.category}</p>
                                        <div className="flex items-center gap-3.5 mt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                            {item.day_of_month && (
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays className="w-3.5 h-3.5" /> Day {item.day_of_month} of month
                                                </span>
                                            )}
                                            {item.last_generated && (
                                                <span>Last: {formatBillingMonth(item.last_generated)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-base font-bold text-slate-800 dark:text-white font-mono leading-none">
                                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-3">
                                        <button
                                            onClick={() => handleGenerateClick(item.id)}
                                            disabled={generating === item.id || !item.is_active}
                                            className="p-1.5 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all border border-green-200/20 dark:border-green-800/20"
                                            title="Generate expense for this month"
                                        >
                                            {generating === item.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Plus className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(item)}
                                            className={`p-1.5 rounded-lg hover:scale-105 active:scale-95 transition-all border ${
                                                item.is_active 
                                                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200/20 dark:border-amber-800/20' 
                                                    : 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200/20 dark:border-green-800/20'
                                            }`}
                                            title={item.is_active ? 'Pause' : 'Resume'}
                                        >
                                            {item.is_active ? (
                                                <Pause className="w-3.5 h-3.5" />
                                            ) : (
                                                <Play className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:scale-105 active:scale-95 transition-all border border-indigo-200/20 dark:border-indigo-800/20"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-500 hover:text-red-700 rounded-lg hover:scale-105 active:scale-95 transition-all border border-red-200/20 dark:border-red-800/20"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingItem ? '✏️ Edit Template' : '🆕 Add Template'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Category *</label>
                            {!showCustomCategory ? (
                                <CustomDropdown
                                    value={formData.category}
                                    onChange={handleCategoryChange}
                                    options={[
                                        ...allCategories.map(cat => ({ value: cat, label: cat, icon: getCategoryIconLabel(cat) })),
                                        { value: '__new__', label: '+ New Category', icon: '✨' }
                                    ]}
                                    placeholder="Select category"
                                    className="w-full"
                                />
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customCategory}
                                        onChange={(e) => setCustomCategory(e.target.value)}
                                        placeholder="Enter category name"
                                        className="input text-sm flex-1"
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCustomCategory(false);
                                            setCustomCategory('');
                                        }}
                                        className="btn btn-secondary text-xs px-3"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="label">Amount (₹) *</label>
                            <input
                                type="number"
                                value={formData.amount || ''}
                                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                className="input text-sm"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="label">Description *</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="input text-sm"
                            placeholder="e.g., Netflix Subscription, House Rent"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Frequency</label>
                            <select
                                value={formData.frequency}
                                onChange={e => setFormData({ ...formData, frequency: e.target.value as RecurringFrequency })}
                                className="input text-sm h-11"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Day of Month</label>
                            <input
                                type="number"
                                value={formData.day_of_month || ''}
                                onChange={e => setFormData({ ...formData, day_of_month: parseInt(e.target.value) || 1 })}
                                className="input text-sm"
                                min="1"
                                max="31"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Start Date *</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                className="input text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">End Date (Optional)</label>
                            <input
                                type="date"
                                value={formData.end_date || ''}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value || undefined })}
                                className="input text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="label">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="input text-sm h-20 resize-none py-2"
                            placeholder="Add any extra notes or payment method instructions..."
                        />
                    </div>
                    <div className="flex gap-4 pt-3">
                        <button 
                            type="button" 
                            onClick={() => {
                                setShowModal(false);
                                setEditingItem(null);
                                resetForm();
                            }} 
                            className="btn btn-secondary flex-1 py-2.5 text-xs"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary flex-1 py-2.5 text-xs"
                        >
                            {editingItem ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Month Selection Modal */}
            <Modal
                isOpen={showMonthSelectModal}
                onClose={() => {
                    setShowMonthSelectModal(false);
                    setSelectedTemplateId(null);
                }}
                title="📅 Select Billing Month"
                size="sm"
            >
                <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Select the billing month for which you want to generate this expense.
                    </p>
                    <MonthPicker
                        value={generateMonth}
                        onChange={(value) => setGenerateMonth(value)}
                        className="w-full"
                    />
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowMonthSelectModal(false);
                                setSelectedTemplateId(null);
                            }}
                            className="btn btn-secondary flex-1 py-2 text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleGenerateConfirm}
                            className="btn btn-primary flex-1 py-2 text-xs"
                            disabled={generating !== null}
                        >
                            {generating !== null ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                            ) : (
                                'Generate'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default RecurringExpensesPage;
