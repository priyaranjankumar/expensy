import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import type { Expense, ExpenseCreate, ExpenseUpdate, ExpenseStatus } from '../types';
import { paymentMethodsApi } from '../services/api';
import MonthPicker from './MonthPicker';
import CustomDropdown from './CustomDropdown';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (expense: ExpenseCreate | ExpenseUpdate) => void;
    expense: Partial<Expense> | null;
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
        paid_amount: 0,
        status: 'Unpaid',
        notes: '',
        billing_month: currentBillingMonth,
        payment_method_id: null,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState('');

    // Credit card picker state
    const [creditCards, setCreditCards] = useState<{ id: number; name: string; last_four?: string }[]>([]);
    const [showAddCard, setShowAddCard] = useState(false);
    const [newCardName, setNewCardName] = useState('');
    const [addingCard, setAddingCard] = useState(false);

    const isCreditCardBill = (showCustomCategory ? customCategory : formData.category) === 'Credit Card Bill';

    // Fetch credit cards (payment methods with method_type = 'card')
    const fetchCreditCards = useCallback(async () => {
        try {
            const methods = await paymentMethodsApi.getAll();
            const cards = methods
                .filter((m: any) => m.method_type === 'card')
                .map((m: any) => ({ id: m.id, name: m.name, last_four: m.last_four }));
            setCreditCards(cards);
        } catch (err) {
            console.error('Failed to fetch credit cards:', err);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchCreditCards();
        }
    }, [isOpen, fetchCreditCards]);

    // Add a new credit card inline
    const handleAddCard = async () => {
        const trimmed = newCardName.trim();
        if (!trimmed) return;
        setAddingCard(true);
        try {
            const created = await paymentMethodsApi.create({
                name: trimmed,
                method_type: 'card',
                icon: '💳',
            });
            setCreditCards(prev => [...prev, { id: created.id, name: created.name, last_four: created.last_four }]);
            // Auto-select the newly created card
            setFormData(prev => ({ ...prev, description: created.name, payment_method_id: created.id }));
            setShowAddCard(false);
            setNewCardName('');
            if (errors.description) {
                setErrors(prev => ({ ...prev, description: '' }));
            }
        } catch (err) {
            console.error('Failed to create credit card:', err);
        } finally {
            setAddingCard(false);
        }
    };

    const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])].sort();

    const categoryOptions = [
        ...allCategories.map(cat => ({ value: cat, label: cat, icon: getCategoryIcon(cat) })),
        { value: '__custom__', label: '+ Add custom category', icon: '✨' },
    ];

    useEffect(() => {
        if (expense) {
            setFormData({
                category: expense.category || '',
                description: expense.description || '',
                amount: expense.amount || 0,
                paid_amount: expense.paid_amount || 0,
                status: expense.status || 'Unpaid',
                notes: expense.notes || '',
                billing_month: expense.billing_month || currentBillingMonth,
                payment_method_id: expense.payment_method_id || null,
            });
            setShowCustomCategory(expense.category ? !allCategories.includes(expense.category) : false);
            if (expense.category && !allCategories.includes(expense.category)) {
                setCustomCategory(expense.category);
            }
        } else {
            setFormData({
                category: '',
                description: '',
                amount: 0,
                paid_amount: 0,
                status: 'Unpaid',
                notes: '',
                billing_month: currentBillingMonth,
                payment_method_id: null,
            });
            setShowCustomCategory(false);
            setCustomCategory('');
        }
        setShowAddCard(false);
        setNewCardName('');
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
        if (formData.paid_amount !== undefined && formData.paid_amount < 0) {
            newErrors.paid_amount = 'Paid amount cannot be negative';
        }
        if (formData.paid_amount !== undefined && formData.paid_amount > formData.amount) {
            newErrors.paid_amount = 'Paid amount cannot exceed total amount';
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
            setFormData((prev) => ({ ...prev, category: '', description: '', payment_method_id: null }));
        } else {
            setShowCustomCategory(false);
            // Clear description & payment_method_id when switching categories
            setFormData((prev) => ({ ...prev, category: value, description: '', payment_method_id: null }));
        }
        setShowAddCard(false);
        setNewCardName('');
        if (errors.category) {
            setErrors((prev) => ({ ...prev, category: '' }));
        }
        if (errors.description) {
            setErrors((prev) => ({ ...prev, description: '' }));
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fade-in" 
                onClick={onClose}
            />

            {/* Modal Container with scroll support and center alignment */}
            <div className="fixed inset-0 z-[101] overflow-y-auto flex justify-center p-4 md:p-8">
                {/* Modal Panel */}
                <div
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden animate-slide-up border border-slate-200 dark:border-slate-800 my-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/10 dark:to-purple-950/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/25 transform rotate-3">
                                {expense ? '✏️' : '✨'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    {expense ? 'Edit Expense' : 'New Expense'}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    {expense ? 'Update payment details' : 'Add a new transaction'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="ml-auto w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-8 py-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                            {/* Billing Month */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                                    📅 Billing Month
                                </label>
                                <MonthPicker
                                    value={formData.billing_month || ''}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, billing_month: value }));
                                        if (errors.billing_month) {
                                            setErrors(prev => ({ ...prev, billing_month: '' }));
                                        }
                                    }}
                                    className="w-full"
                                />
                                {errors.billing_month && (
                                    <p className="text-sm text-red-500 mt-1 ml-1">{errors.billing_month}</p>
                                )}
                            </div>

                            {/* Category - Custom Dropdown */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                                    📁 Category
                                </label>
                                {!showCustomCategory ? (
                                    <CustomDropdown
                                        value={formData.category}
                                        onChange={handleCategoryChange}
                                        options={categoryOptions}
                                        placeholder="Select category"
                                        className="w-full"
                                    />
                                ) : (
                                    <div className="flex gap-3">
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
                                            className="flex-1 px-5 py-3 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCustomCategory(false);
                                                setCustomCategory('');
                                            }}
                                            className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                {errors.category && (
                                    <p className="text-sm text-red-500 mt-1 ml-1">{errors.category}</p>
                                )}
                            </div>

                            {/* Description / Credit Card Picker */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1" htmlFor="description">
                                    {isCreditCardBill ? '💳 Credit Card' : '📝 Description'}
                                </label>

                                {isCreditCardBill ? (
                                    /* Credit Card Picker */
                                    <div className="space-y-2">
                                        {!showAddCard ? (
                                            <>
                                                <CustomDropdown
                                                    value={formData.description}
                                                    onChange={(value) => {
                                                        if (value === '__add_card__') {
                                                            setShowAddCard(true);
                                                        } else if (value === '__custom_desc__') {
                                                            // Switch to free-text mode by clearing payment_method_id
                                                            setFormData(prev => ({ ...prev, description: '', payment_method_id: null }));
                                                            // Temporarily use a flag - we'll handle this below
                                                        } else {
                                                            const card = creditCards.find(c => c.name === value);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                description: value,
                                                                payment_method_id: card?.id || null,
                                                            }));
                                                        }
                                                        if (errors.description) {
                                                            setErrors(prev => ({ ...prev, description: '' }));
                                                        }
                                                    }}
                                                    options={[
                                                        ...creditCards.map(card => ({
                                                            value: card.name,
                                                            label: card.last_four ? `${card.name} (••${card.last_four})` : card.name,
                                                            icon: '💳',
                                                        })),
                                                        { value: '__add_card__', label: '＋ Add new card', icon: '✨' },
                                                    ]}
                                                    placeholder="Select credit card"
                                                    className="w-full"
                                                />
                                                {creditCards.length === 0 && (
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                                                        No saved cards yet. Click the dropdown to add one.
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            /* Inline Add Card */
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={newCardName}
                                                    onChange={(e) => setNewCardName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddCard();
                                                        }
                                                    }}
                                                    placeholder="e.g., ICICI AMAZON"
                                                    className="flex-1 px-5 py-3 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                                    autoFocus
                                                    disabled={addingCard}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddCard}
                                                    disabled={addingCard || !newCardName.trim()}
                                                    className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                                >
                                                    {addingCard ? '...' : 'Save'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAddCard(false);
                                                        setNewCardName('');
                                                    }}
                                                    className="px-3 py-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium text-sm transition-colors flex-shrink-0"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Regular Description Input */
                                    <input
                                        type="text"
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="e.g., Grocery shopping"
                                        className={`w-full px-5 py-3.5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border outline-none transition-all font-medium ${errors.description
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                            }`}
                                    />
                                )}

                                {errors.description && (
                                    <p className="text-sm text-red-500 mt-1 ml-1">{errors.description}</p>
                                )}
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1" htmlFor="amount">
                                    💰 Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                                    <input
                                        type="number"
                                        id="amount"
                                        name="amount"
                                        value={formData.amount || ''}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        className={`w-full pl-12 pr-5 py-3.5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border outline-none transition-all font-bold text-lg ${errors.amount
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                            }`}
                                    />
                                </div>
                                {errors.amount && (
                                    <p className="text-sm text-red-500 mt-1 ml-1">{errors.amount}</p>
                                )}
                            </div>

                            {/* Paid Amount */}
                            <div>
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300" htmlFor="paid_amount">
                                        💳 Paid Amount
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ 
                                                ...prev, 
                                                paid_amount: prev.amount,
                                                status: 'Completely Paid'
                                            }));
                                            if (errors.paid_amount) {
                                                setErrors(prev => ({ ...prev, paid_amount: '' }));
                                            }
                                        }}
                                        className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 py-1 rounded-lg transition-colors border border-indigo-200/40"
                                    >
                                        Mark Fully Paid
                                    </button>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                                    <input
                                        type="number"
                                        id="paid_amount"
                                        name="paid_amount"
                                        value={formData.paid_amount === 0 ? '' : formData.paid_amount}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setFormData(prev => {
                                                let nextStatus: ExpenseStatus = 'Paid';
                                                if (val <= 0) nextStatus = 'Unpaid';
                                                else if (val >= prev.amount) nextStatus = 'Completely Paid';
                                                return {
                                                    ...prev,
                                                    paid_amount: val,
                                                    status: nextStatus
                                                };
                                            });
                                            if (errors.paid_amount) {
                                                setErrors(prev => ({ ...prev, paid_amount: '' }));
                                            }
                                        }}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        className={`w-full pl-12 pr-5 py-3.5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border outline-none transition-all font-bold text-lg ${errors.paid_amount
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                            }`}
                                    />
                                </div>
                                {errors.paid_amount && (
                                    <p className="text-sm text-red-500 mt-1 ml-1">{errors.paid_amount}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1">
                                    📊 Payment Status
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {STATUS_OPTIONS.map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setFormData(prev => {
                                                let nextPaidAmt = prev.paid_amount || 0;
                                                if (status === 'Unpaid') nextPaidAmt = 0;
                                                else if (status === 'Completely Paid') nextPaidAmt = prev.amount;
                                                else if (status === 'Paid' && (nextPaidAmt === 0 || nextPaidAmt >= prev.amount)) {
                                                    nextPaidAmt = prev.amount / 2;
                                                }
                                                return {
                                                    ...prev,
                                                    status,
                                                    paid_amount: nextPaidAmt
                                                };
                                            })}
                                            className={`py-3 px-2 rounded-2xl text-sm font-bold transition-all duration-300 transform active:scale-95 ${formData.status === status
                                                ? status === 'Unpaid'
                                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                                                    : status === 'Paid'
                                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                                                        : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {status === 'Paid' ? 'Partially Paid' : status.replace('Completely ', '')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1" htmlFor="notes">
                                    📄 Notes <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes || ''}
                                    onChange={handleChange}
                                    placeholder="Add any extra details here..."
                                    rows={2}
                                    className="w-full px-5 py-3 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-3xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        {expense ? 'Update Expense' : 'Add Expense'}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>,
        document.body
    );
};

export default ExpenseModal;
