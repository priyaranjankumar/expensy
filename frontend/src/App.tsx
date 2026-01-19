import { useState, useEffect, useCallback, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import ExpenseTable from './components/ExpenseTable';
import ExpenseModal from './components/ExpenseModal';
import Filters from './components/Filters';
import DarkModeToggle from './components/DarkModeToggle';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import UserProfile from './components/UserProfile';
import { expenseApi, metricsApi } from './services/api';
import type { Expense, ExpenseCreate, ExpenseUpdate, MetricsResponse, FilterState, User } from './types';
import { getCurrentBillingMonth, formatBillingMonth } from './types';

function App() {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');
    const [showProfile, setShowProfile] = useState(false);

    // Check for existing auth on mount
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');
        if (token && savedUser) {
            setIsAuthenticated(true);
            setUser(JSON.parse(savedUser));
        }
    }, []);

    // Handle login/signup success
    const handleAuth = (token: string, userData: User) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
        setIsAuthenticated(false);
        setShowProfile(false);
    };

    // Handle user profile update
    const handleUserUpdate = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    };

    // Show login/signup if not authenticated
    if (!isAuthenticated) {
        if (authPage === 'signup') {
            return (
                <SignupPage
                    onSignup={handleAuth}
                    onSwitchToLogin={() => setAuthPage('login')}
                />
            );
        }
        return (
            <LoginPage
                onLogin={handleAuth}
                onSwitchToSignup={() => setAuthPage('signup')}
            />
        );
    }

    // Main App (authenticated)
    return (
        <AuthenticatedApp
            user={user!}
            onLogout={handleLogout}
            onUserUpdate={handleUserUpdate}
            showProfile={showProfile}
            setShowProfile={setShowProfile}
        />
    );
}

// Separate component for authenticated app
interface AuthenticatedAppProps {
    user: User;
    onLogout: () => void;
    onUserUpdate: (user: User) => void;
    showProfile: boolean;
    setShowProfile: (show: boolean) => void;
}

function AuthenticatedApp({ user, onLogout, onUserUpdate, showProfile, setShowProfile }: AuthenticatedAppProps) {
    // State
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [billingMonths, setBillingMonths] = useState<string[]>([]);
    const [filters, setFilters] = useState<FilterState>({
        status: '',
        category: '',
        search: '',
        billing_month: getCurrentBillingMonth()
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState({
        expenses: true,
        metrics: true,
        modal: false,
    });
    const [error, setError] = useState<string | null>(null);

    // Fetch expenses
    const fetchExpenses = useCallback(async () => {
        try {
            setLoading((prev) => ({ ...prev, expenses: true }));
            const response = await expenseApi.getExpenses(
                filters.status || undefined,
                filters.category || undefined,
                filters.billing_month || undefined
            );
            setExpenses(response.expenses);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch expenses:', err);
            setError('Failed to load expenses. Please ensure the backend server is running.');
        } finally {
            setLoading((prev) => ({ ...prev, expenses: false }));
        }
    }, [filters.status, filters.category, filters.billing_month]);

    // Fetch metrics
    const fetchMetrics = useCallback(async () => {
        try {
            setLoading((prev) => ({ ...prev, metrics: true }));
            const data = await metricsApi.getMetrics(filters.billing_month || undefined);
            setMetrics(data);
        } catch (err) {
            console.error('Failed to fetch metrics:', err);
        } finally {
            setLoading((prev) => ({ ...prev, metrics: false }));
        }
    }, [filters.billing_month]);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const data = await expenseApi.getCategories();
            setCategories(data);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    }, []);

    // Fetch billing months
    const fetchBillingMonths = useCallback(async () => {
        try {
            const data = await expenseApi.getBillingMonths();
            setBillingMonths(data);
            if (data.length > 0 && !data.includes(filters.billing_month)) {
                setFilters(prev => ({ ...prev, billing_month: data[0] }));
            }
        } catch (err) {
            console.error('Failed to fetch billing months:', err);
        }
    }, []);

    // Initial data load
    useEffect(() => {
        fetchBillingMonths();
        fetchCategories();
    }, []);

    // Refetch when billing month changes
    useEffect(() => {
        fetchExpenses();
        fetchMetrics();
    }, [filters.billing_month, filters.status, filters.category]);

    // Filter expenses by search (client-side)
    const filteredExpenses = useMemo(() => {
        if (!filters.search) return expenses;
        const searchLower = filters.search.toLowerCase();
        return expenses.filter(
            (expense) =>
                expense.description.toLowerCase().includes(searchLower) ||
                expense.category.toLowerCase().includes(searchLower) ||
                expense.notes?.toLowerCase().includes(searchLower)
        );
    }, [expenses, filters.search]);

    // Handle add/edit expense
    const handleOpenModal = (expense?: Expense) => {
        setEditingExpense(expense || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    const handleSubmitExpense = async (expense: ExpenseCreate | ExpenseUpdate) => {
        try {
            setLoading((prev) => ({ ...prev, modal: true }));

            const expenseWithMonth = {
                ...expense,
                billing_month: expense.billing_month || filters.billing_month || getCurrentBillingMonth()
            };

            if (editingExpense) {
                await expenseApi.updateExpense(editingExpense.id, expenseWithMonth);
            } else {
                await expenseApi.createExpense(expenseWithMonth as ExpenseCreate);
            }

            handleCloseModal();
            fetchExpenses();
            fetchMetrics();
            fetchCategories();
            fetchBillingMonths();
        } catch (err) {
            console.error('Failed to save expense:', err);
            setError('Failed to save expense. Please try again.');
        } finally {
            setLoading((prev) => ({ ...prev, modal: false }));
        }
    };

    // Handle delete expense
    const handleDeleteExpense = async (id: number) => {
        try {
            await expenseApi.deleteExpense(id);
            fetchExpenses();
            fetchMetrics();
            fetchCategories();
            fetchBillingMonths();
        } catch (err) {
            console.error('Failed to delete expense:', err);
            setError('Failed to delete expense. Please try again.');
        }
    };

    const currentMonthDisplay = filters.billing_month
        ? formatBillingMonth(filters.billing_month)
        : 'All Time';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-dark-900 dark:via-dark-900 dark:to-dark-950 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-dark-700/50 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl shadow-lg shadow-primary-500/30 animate-pulse-soft">
                                💰
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                                    Expense Tracker
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {currentMonthDisplay} • Budget: ₹{user.monthly_budget.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <DarkModeToggle />
                            {/* User Profile Button */}
                            <button
                                onClick={() => setShowProfile(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 transition-colors"
                            >
                                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
                                    {user.name.split(' ')[0]}
                                </span>
                            </button>
                            <button
                                onClick={() => handleOpenModal()}
                                className="btn btn-primary"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Expense
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-xl flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-3">
                            <span className="text-danger-500 text-xl">⚠️</span>
                            <p className="text-danger-700 dark:text-danger-400">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-danger-400 hover:text-danger-600 dark:hover:text-danger-300"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Dashboard */}
                <section className="mb-8">
                    <Dashboard metrics={metrics} loading={loading.metrics} />
                </section>

                {/* Filters */}
                <section className="mb-6">
                    <Filters
                        filters={filters}
                        onFilterChange={setFilters}
                        categories={categories}
                        billingMonths={billingMonths}
                    />
                </section>

                {/* Expense Table */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                            Expense List
                            {filteredExpenses.length > 0 && (
                                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                                    ({filteredExpenses.length} item{filteredExpenses.length !== 1 ? 's' : ''})
                                </span>
                            )}
                        </h2>
                    </div>
                    <ExpenseTable
                        expenses={filteredExpenses}
                        loading={loading.expenses}
                        onEdit={handleOpenModal}
                        onDelete={handleDeleteExpense}
                    />
                </section>
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-dark-700 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm">
                <p>Personal Expense Tracker © {new Date().getFullYear()}</p>
            </footer>

            {/* Expense Modal */}
            <ExpenseModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitExpense}
                expense={editingExpense}
                categories={categories}
                billingMonths={billingMonths}
                currentBillingMonth={filters.billing_month || getCurrentBillingMonth()}
                loading={loading.modal}
            />

            {/* User Profile Modal */}
            <UserProfile
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                user={user}
                onUpdate={onUserUpdate}
                onLogout={onLogout}
            />
        </div>
    );
}

export default App;
