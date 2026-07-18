import React, { useState, useEffect } from 'react';
import { accountsApi, savingsApi, paymentMethodsApi } from '../services/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import CustomDropdown from './CustomDropdown';
import { getAssetLogo } from './ui/BankIcons';

type ActiveTab = 'accounts' | 'savings' | 'payment-methods';

interface Account {
    id: number;
    name: string;
    account_type: string;
    balance: number;
    currency: string;
    color: string;
    icon: string;
    is_active: boolean;
}

interface SavingsGoal {
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date?: string;
    color: string;
    icon: string;
    is_completed: boolean;
    progress_percent: number;
}

interface PaymentMethod {
    id: number;
    name: string;
    method_type: string;
    last_four?: string;
    icon: string;
    is_default: boolean;
}

const ACCOUNT_TYPES = [
    { value: 'bank', label: '🏦 Bank Account' },
    { value: 'wallet', label: '👛 Digital Wallet' },
    { value: 'credit_card', label: '💳 Credit Card' },
    { value: 'cash', label: '💵 Cash' },
];

const PAYMENT_TYPES = [
    { value: 'card', label: '💳 Card' },
    { value: 'upi', label: '📱 UPI' },
    { value: 'cash', label: '💵 Cash' },
    { value: 'net_banking', label: '🏦 Net Banking' },
    { value: 'other', label: '📋 Other' },
];

const CardChip: React.FC = () => (
    <svg className="w-8 h-6 rounded bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 opacity-90 shadow-sm border border-yellow-200/40" viewBox="0 0 24 18">
        <rect x="2" y="2" width="20" height="14" rx="2" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
        <line x1="8" y1="2" x2="8" y2="16" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
        <line x1="16" y1="2" x2="16" y2="16" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
        <line x1="2" y1="9" x2="22" y2="9" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
    </svg>
);

const FinancePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('accounts');
    const [loading, setLoading] = useState(false);

    // Accounts state
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [accountForm, setAccountForm] = useState({ name: '', account_type: 'bank', balance: 0, currency: 'INR' });

    // Savings state
    const [savings, setSavings] = useState<SavingsGoal[]>([]);
    const [showSavingsModal, setShowSavingsModal] = useState(false);
    const [savingsForm, setSavingsForm] = useState({ name: '', target_amount: 0, current_amount: 0, target_date: '' });
    const [contributeGoalId, setContributeGoalId] = useState<number | null>(null);
    const [contributeAmount, setContributeAmount] = useState('');

    // Payment methods state
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ name: '', method_type: 'card', last_four: '', is_default: false });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'accounts') {
                const data = await accountsApi.getAll();
                setAccounts(data);
            } else if (activeTab === 'savings') {
                const data = await savingsApi.getAll();
                setSavings(data);
            } else if (activeTab === 'payment-methods') {
                const data = await paymentMethodsApi.getAll();
                setPaymentMethods(data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Account handlers
    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await accountsApi.create(accountForm);
        setShowAccountModal(false);
        setAccountForm({ name: '', account_type: 'bank', balance: 0, currency: 'INR' });
        loadData();
    };

    const handleDeleteAccount = async (id: number) => {
        if (!confirm('Deactivate this account?')) return;
        await accountsApi.delete(id);
        loadData();
    };

    // Savings handlers
    const handleSavingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await savingsApi.create(savingsForm);
        setShowSavingsModal(false);
        setSavingsForm({ name: '', target_amount: 0, current_amount: 0, target_date: '' });
        loadData();
    };

    const handleContribute = async () => {
        if (!contributeGoalId || !contributeAmount) return;
        await savingsApi.contribute(contributeGoalId, parseFloat(contributeAmount));
        setContributeGoalId(null);
        setContributeAmount('');
        loadData();
    };

    // Payment method handlers
    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await paymentMethodsApi.create(paymentForm);
        setShowPaymentModal(false);
        setPaymentForm({ name: '', method_type: 'card', last_four: '', is_default: false });
        loadData();
    };

    const handleSetDefault = async (id: number) => {
        await paymentMethodsApi.setDefault(id);
        loadData();
    };

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const totalSaved = savings.reduce((sum, s) => sum + s.current_amount, 0);
    const totalTarget = savings.reduce((sum, s) => sum + s.target_amount, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
                    <p className="text-sm opacity-80">Total Balance</p>
                    <p className="text-2xl font-bold">₹{totalBalance.toLocaleString()}</p>
                    <p className="text-xs opacity-70">{accounts.length} accounts</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-lg">
                    <p className="text-sm opacity-80">Total Saved</p>
                    <p className="text-2xl font-bold">₹{totalSaved.toLocaleString()}</p>
                    <p className="text-xs opacity-70">{savings.length} goals • {totalTarget > 0 ? Math.round(totalSaved / totalTarget * 100) : 0}% progress</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-lg">
                    <p className="text-sm opacity-80">Payment Methods</p>
                    <p className="text-2xl font-bold">{paymentMethods.length}</p>
                    <p className="text-xs opacity-70">{paymentMethods.find(p => p.is_default)?.name || 'No default set'}</p>
                </Card>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-1">
                {[
                    { id: 'accounts', label: '🏦 Accounts' },
                    { id: 'savings', label: '🎯 Savings Goals' },
                    { id: 'payment-methods', label: '💳 Payment Methods' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as ActiveTab)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-500'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading && (
                <Card className="p-12 flex justify-center items-center">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                </Card>
            )}

            {/* Accounts Tab */}
            {!loading && activeTab === 'accounts' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold dark:text-white">Your Accounts</h2>
                        <Button onClick={() => setShowAccountModal(true)}>
                            + Add Account
                        </Button>
                    </div>

                    {accounts.length === 0 ? (
                        <Card className="p-12 text-center text-gray-500 border-dashed">
                            No accounts yet. Add your bank, wallet, or cash accounts!
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {accounts.map(account => (
                                <div 
                                    key={account.id} 
                                    className="relative h-44 rounded-3xl p-6 text-white overflow-hidden shadow-lg shadow-black/10 group transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                                    style={{ 
                                        background: `linear-gradient(135deg, ${account.color || '#4f46e5'} 0%, #0f172a 100%)` 
                                    }}
                                >
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
                                    <div className="flex flex-col h-full justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1 bg-white/10 rounded-xl backdrop-blur-sm">
                                                    {getAssetLogo(account.name)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-base leading-tight tracking-wide text-white/95">{account.name}</h3>
                                                    <p className="text-[10px] text-white/70 uppercase tracking-widest font-medium">{account.account_type.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAccount(account.id)}
                                                className="p-1.5 rounded-full bg-white/0 hover:bg-white/10 text-white/40 hover:text-red-400 transition-all duration-200"
                                                title="Delete Account"
                                            >
                                                <span className="sr-only">Delete</span>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="my-1.5 self-start">
                                            <CardChip />
                                        </div>
                                        <div className="flex items-baseline justify-between">
                                            <div>
                                                <span className="text-[9px] uppercase tracking-wider text-white/60 font-semibold block">Balance</span>
                                                <p className="text-2xl font-bold tracking-tight text-white font-mono leading-none">
                                                    ₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl opacity-20 group-hover:opacity-40 transition-opacity select-none">{account.icon}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Savings Tab */}
            {!loading && activeTab === 'savings' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold dark:text-white">Savings Goals</h2>
                        <Button onClick={() => setShowSavingsModal(true)}>
                            + New Goal
                        </Button>
                    </div>

                    {savings.length === 0 ? (
                        <Card className="p-12 text-center text-gray-500 border-dashed">
                            No savings goals yet. Set your first financial goal!
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {savings.map(goal => (
                                <Card key={goal.id} className="p-5 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                                                {goal.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{goal.name}</h3>
                                                {goal.target_date && (
                                                    <p className="text-xs text-gray-500">Target: {new Date(goal.target_date).toLocaleDateString()}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant={goal.is_completed ? 'success' : 'neutral'}>
                                            {goal.progress_percent}%
                                        </Badge>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                                        <div
                                            className="h-full rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${Math.min(goal.progress_percent, 100)}%`, backgroundColor: goal.color }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-sm mb-4">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">₹{goal.current_amount.toLocaleString()}</span>
                                        <span className="text-gray-500">of ₹{goal.target_amount.toLocaleString()}</span>
                                    </div>

                                    {!goal.is_completed && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => setContributeGoalId(goal.id)}
                                            className="w-full justify-center"
                                            size="sm"
                                        >
                                            + Add Money
                                        </Button>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Payment Methods Tab */}
            {!loading && activeTab === 'payment-methods' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold dark:text-white">Payment Methods</h2>
                        <Button onClick={() => setShowPaymentModal(true)}>
                            + Add Method
                        </Button>
                    </div>

                    {paymentMethods.length === 0 ? (
                        <Card className="p-12 text-center text-gray-500 border-dashed">
                            No payment methods yet. Add your cards, UPI, etc.
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {paymentMethods.map(method => (
                                <div 
                                    key={method.id} 
                                    className="relative h-44 rounded-3xl p-6 text-white overflow-hidden shadow-lg shadow-black/10 group transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                                    style={{ 
                                        background: method.is_default 
                                            ? 'linear-gradient(135deg, #1e1b4b 0%, #030712 100%)' 
                                            : 'linear-gradient(135deg, #334155 0%, #0f172a 100%)'
                                    }}
                                >
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
                                    <div className="flex flex-col h-full justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1 bg-white/10 rounded-xl backdrop-blur-sm">
                                                    {getAssetLogo(method.name)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-base leading-tight tracking-wide text-white/95">{method.name}</h3>
                                                    <p className="text-[10px] text-white/70 uppercase tracking-widest font-medium">
                                                        {method.method_type.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {method.is_default ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                                        Default
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSetDefault(method.id)}
                                                        className="px-2.5 py-1 rounded-lg text-[9px] font-semibold bg-white/10 hover:bg-white/20 text-white transition-all"
                                                    >
                                                        Set Default
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="my-1.5 self-start">
                                            <CardChip />
                                        </div>
                                        <div className="flex items-baseline justify-between">
                                            <div>
                                                {method.last_four ? (
                                                    <p className="text-xl font-mono tracking-widest text-white/90">
                                                        ••••  ••••  ••••  <span className="font-bold">{method.last_four}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-white/60 tracking-wider font-mono">DIGITAL WALLET</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl opacity-20 group-hover:opacity-40 transition-opacity select-none">{method.icon}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Account Modal */}
            {showAccountModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <Card className="p-6 w-full max-w-md animate-slide-up">
                        <h3 className="text-lg font-semibold mb-4">Add Account</h3>
                        <form onSubmit={handleAccountSubmit} className="space-y-4">
                            <Input
                                label="Account Name"
                                value={accountForm.name}
                                onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                                required
                                placeholder="e.g., HDFC Savings"
                            />
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Account Type *</label>
                                <CustomDropdown
                                    value={accountForm.account_type}
                                    onChange={(val) => setAccountForm({ ...accountForm, account_type: val })}
                                    options={ACCOUNT_TYPES}
                                    placeholder="Select Type"
                                    className="w-full"
                                />
                            </div>
                            <Input
                                label="Current Balance"
                                type="number"
                                value={accountForm.balance}
                                onChange={e => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) || 0 })}
                                step="0.01"
                            />
                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setShowAccountModal(false)}>Cancel</Button>
                                <Button type="submit">Add Account</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Savings Modal */}
            {showSavingsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <Card className="p-6 w-full max-w-md animate-slide-up">
                        <h3 className="text-lg font-semibold mb-4">New Savings Goal</h3>
                        <form onSubmit={handleSavingsSubmit} className="space-y-4">
                            <Input
                                label="Goal Name"
                                value={savingsForm.name}
                                onChange={e => setSavingsForm({ ...savingsForm, name: e.target.value })}
                                required
                                placeholder="e.g., Vacation Fund"
                            />
                            <Input
                                label="Target Amount"
                                type="number"
                                value={savingsForm.target_amount || ''}
                                onChange={e => setSavingsForm({ ...savingsForm, target_amount: parseFloat(e.target.value) || 0 })}
                                required
                                min="1"
                            />
                            <Input
                                label="Target Date"
                                type="date"
                                value={savingsForm.target_date}
                                onChange={e => setSavingsForm({ ...savingsForm, target_date: e.target.value })}
                            />
                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setShowSavingsModal(false)}>Cancel</Button>
                                <Button type="submit">Create Goal</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Contribute Modal */}
            {contributeGoalId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <Card className="p-6 w-full max-w-sm animate-slide-up">
                        <h3 className="text-lg font-semibold mb-4">Add Money</h3>
                        <div className="space-y-4">
                            <Input
                                label="Amount to Add"
                                type="number"
                                value={contributeAmount}
                                onChange={e => setContributeAmount(e.target.value)}
                                placeholder="Enter amount"
                                min="1"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" onClick={() => setContributeGoalId(null)}>Cancel</Button>
                                <Button onClick={handleContribute}>Add Money</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Payment Method Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <Card className="p-6 w-full max-w-md animate-slide-up">
                        <h3 className="text-lg font-semibold mb-4">Add Payment Method</h3>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <Input
                                label="Name"
                                value={paymentForm.name}
                                onChange={e => setPaymentForm({ ...paymentForm, name: e.target.value })}
                                required
                                placeholder="e.g., HDFC Debit Card"
                            />
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Type *</label>
                                <CustomDropdown
                                    value={paymentForm.method_type}
                                    onChange={(val) => setPaymentForm({ ...paymentForm, method_type: val })}
                                    options={PAYMENT_TYPES}
                                    placeholder="Select Type"
                                    className="w-full"
                                />
                            </div>
                            {paymentForm.method_type === 'card' && (
                                <Input
                                    label="Last 4 Digits"
                                    value={paymentForm.last_four}
                                    onChange={e => setPaymentForm({ ...paymentForm, last_four: e.target.value.slice(0, 4) })}
                                    maxLength={4}
                                    placeholder="1234"
                                />
                            )}
                            <div className="flex items-center gap-2 my-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={paymentForm.is_default}
                                    onChange={e => setPaymentForm({ ...paymentForm, is_default: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <label htmlFor="isDefault" className="text-sm cursor-pointer select-none">Set as default payment method</label>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                                <Button type="submit">Add Method</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default FinancePage;
