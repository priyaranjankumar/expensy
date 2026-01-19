import { useState, useEffect } from 'react';
import type { Expense, ExpenseCreate, ExpenseUpdate, ExpenseStatus } from '../types';
import MonthPicker from './MonthPicker';
import CustomDropdown from './CustomDropdown';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (expense: ExpenseCreate | ExpenseUpdate) => void;
    expense: Expense | null;
    categories: string[];
    billingMonths: string[];
    currentBillingMonth: string;
    loading: boolean;
}

const STATUS_OPTIONS: ExpenseStatus[] = ['Unpaid', 'Paid', 'Completely Paid'];

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
        'Other': '📋',
    };
    return icons[category] || '📋';
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    expense,
    categories,
    currentBillingMonth,
    loading,
}) => {
    const [formData, setFormData] = useState<ExpenseCreate>({
        category: '',
        description: '',
        amount: 0,
        status: 'Unpaid',
        notes: '',
        billing_month: currentBillingMonth,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');

    const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])].sort();

    const categoryOptions = [
        ...allCategories.map(cat => ({ value: cat, label: cat, icon: getCategoryIcon(cat) })),
        { value: '__custom__', label: '+ Add custom category', icon: '✨' },
    ];

    useEffect(() => {
        if (expense) {
            setFormData({
                category: expense.category,
                description: expense.description,
                amount: expense.amount,
                status: expense.status,
                notes: expense.notes || '',
                billing_month: expense.billing_month,
            });
            setShowCustomCategory(!allCategories.includes(expense.category));
            if (!allCategories.includes(expense.category)) {
                setCustomCategory(expense.category);
            }
        } else {
            setFormData({
                category: '',
                description: '',
                amount: 0,
                status: 'Unpaid',
                notes: '',
                billing_month: currentBillingMonth,
            });
            setShowCustomCategory(false);
            setCustomCategory('');
        }
        setErrors({});
    }, [expense, isOpen, currentBillingMonth]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        const categoryToValidate = showCustomCategory ? customCategory : formData.category;
        if (!categoryToValidate.trim()) {
            newErrors.category = 'Category is required';
        }
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }
        if (formData.amount < 0) {
            newErrors.amount = 'Amount cannot be negative';
        }
        if (!formData.billing_month) {
            newErrors.billing_month = 'Billing month is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const submitData = {
                ...formData,
                category: showCustomCategory ? customCategory : formData.category,
            };
            onSubmit(submitData);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) || 0 : value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleCategoryChange = (value: string) => {
        if (value === '__custom__') {
            setShowCustomCategory(true);
            setFormData((prev) => ({ ...prev, category: '' }));
        } else {
            setShowCustomCategory(false);
            setFormData((prev) => ({ ...prev, category: value }));
        }
        if (errors.category) {
            setErrors((prev) => ({ ...prev, category: '' }));
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="modal-backdrop" onClick={onClose} />

            {/* Modal */}
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-panel">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-dark-600 bg-gradient-to-r from-primary-500/10 to-transparent dark:from-primary-500/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl shadow-lg shadow-primary-500/30">
                                {expense ? '✏️' : '➕'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                    {expense ? 'Edit Expense' : 'Add New Expense'}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {expense ? 'Update the expense details' : 'Fill in the expense details'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                            {/* Billing Month */}
                            <div>
                                <label className="label">
                                    📅 Billing Month <span className="text-danger-500">*</span>
                                </label>
                                <MonthPicker
                                    value={formData.billing_month || ''}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, billing_month: value }));
                                        if (errors.billing_month) {
                                            setErrors(prev => ({ ...prev, billing_month: '' }));
                                        }
                                    }}
                                />
                                {errors.billing_month && (
                                    <p className="text-sm text-danger-500 mt-1">{errors.billing_month}</p>
                                )}
                            </div>

                            {/* Category - Custom Dropdown */}
                            <div>
                                <label className="label">
                                    📁 Category <span className="text-danger-500">*</span>
                                </label>
                                {!showCustomCategory ? (
                                    <CustomDropdown
                                        value={formData.category}
                                        onChange={handleCategoryChange}
                                        options={categoryOptions}
                                        placeholder="Select a category"
                                        icon="📁"
                                    />
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={customCategory}
                                            onChange={(e) => {
                                                setCustomCategory(e.target.value);
                                                if (errors.category) {
                                                    setErrors((prev) => ({ ...prev, category: '' }));
                                                }
                                            }}
                                            placeholder="Enter custom category name"
                                            className={`input ${errors.category ? 'input-error' : ''}`}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCustomCategory(false);
                                                setCustomCategory('');
                                            }}
                                            className="btn btn-ghost"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                                {errors.category && (
                                    <p className="text-sm text-danger-500 mt-1">{errors.category}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="label" htmlFor="description">
                                    📝 Description <span className="text-danger-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="e.g., Monthly Electricity Bill"
                                    className={`input ${errors.description ? 'input-error' : ''}`}
                                />
                                {errors.description && (
                                    <p className="text-sm text-danger-500 mt-1">{errors.description}</p>
                                )}
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="label" htmlFor="amount">
                                    💰 Amount (₹)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">₹</span>
                                    <input
                                        type="number"
                                        id="amount"
                                        name="amount"
                                        value={formData.amount || ''}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        className={`input pl-8 ${errors.amount ? 'input-error' : ''}`}
                                    />
                                </div>
                                {errors.amount && (
                                    <p className="text-sm text-danger-500 mt-1">{errors.amount}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="label">
                                    📊 Payment Status
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {STATUS_OPTIONS.map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, status }))}
                                            className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${formData.status === status
                                                    ? status === 'Unpaid'
                                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                        : status === 'Paid'
                                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                            : 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                                    : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-600'
                                                }`}
                                        >
                                            {status === 'Unpaid' && '⏳ '}
                                            {status === 'Paid' && '✓ '}
                                            {status === 'Completely Paid' && '✅ '}
                                            {status.replace('Completely ', '')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="label" htmlFor="notes">
                                    📄 Notes <span className="text-slate-400 dark:text-slate-500">(optional)</span>
                                </label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes || ''}
                                    onChange={handleChange}
                                    placeholder="e.g., 8 Pending EMI"
                                    rows={2}
                                    className="input resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-dark-600 bg-slate-50 dark:bg-dark-700/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-secondary"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="animate-spin">⏳</span> Saving...
                                    </>
                                ) : expense ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Update Expense
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Expense
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ExpenseModal;
