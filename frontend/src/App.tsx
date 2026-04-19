import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TrendChart from './components/TrendChart';
import ExpenseTable from './components/ExpenseTable';
import ExpenseModal from './components/ExpenseModal';
import Filters from './components/Filters';
import DarkModeToggle from './components/DarkModeToggle';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import UserProfile from './components/UserProfile';
import RemindersWidget from './components/RemindersWidget';
import IncomeDashboard from './components/IncomeDashboard';
import RecurringExpensesPage from './components/RecurringExpensesPage';
import TagsManager from './components/TagsManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import OrganizationPage from './components/OrganizationPage';
import QuickAddWidget from './components/QuickAddWidget';
import FinancePage from './components/FinancePage';
import DataPage from './components/DataPage';
import { expenseApi, metricsApi, exportApi } from './services/api';
import type { Expense, ExpenseCreate, ExpenseUpdate, MetricsResponse, FilterState, User } from './types';
import { getCurrentBillingMonth, formatBillingMonth } from './types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';

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
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const [activeTab, setActiveTab] = useState<'expenses' | 'recurring' | 'income' | 'tags' | 'analytics' | 'organize' | 'finance' | 'data'>('expenses');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onNewExpense: () => handleOpenModal(),
        onFocusSearch: () => searchInputRef.current?.focus(),
        onCloseModal: () => {
            if (showShortcutsHelp) setShowShortcutsHelp(false);
            else if (showProfile) setShowProfile(false);
            else if (isModalOpen) handleCloseModal();
        },
        onShowHelp: () => setShowShortcutsHelp(true),
        onExport: () => exportApi.downloadCSV(filters.billing_month),
        isModalOpen: isModalOpen || showProfile || showShortcutsHelp,
    });

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
                toast.success('Expense updated successfully!');
            } else {
                await expenseApi.createExpense(expenseWithMonth as ExpenseCreate);
                toast.success('Expense added successfully!');
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#a855f7', '#ec4899']
                });
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

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
            <Toaster position="bottom-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white' }} />
            {/* Sidebar Navigation */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={(tab: any) => setActiveTab(tab)}
                user={user}
                onLogout={onLogout}
                setShowProfile={setShowProfile}
                isCollapsed={!isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Main Content Area */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'}`}>
                {/* Header / Top Bar */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-500 capitalize">
                        {activeTab === 'recurring' ? 'Recurring Expenses' :
                            activeTab === 'data' ? 'Data & Sharing' : activeTab}
                    </h2>

                    <div className="flex items-center gap-4">
                        <DarkModeToggle />
                        <button
                            onClick={() => setShowShortcutsHelp(true)}
                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Keyboard Shortcuts (Ctrl+/)"
                        >
                            ⌨️
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6 max-w-7xl mx-auto space-y-6">
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-3">
                                <span className="text-red-500 text-xl">⚠️</span>
                                <p className="text-red-700 dark:text-red-400">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="space-y-6">
                            <Dashboard metrics={metrics} loading={loading.metrics} />

                            <Filters
                                filters={filters}
                                onFilterChange={setFilters}
                                categories={categories}
                                billingMonths={billingMonths}
                                onExportCSV={() => exportApi.downloadCSV(filters.billing_month)}
                                onExportJSON={() => exportApi.downloadJSON(filters.billing_month)}
                                searchInputRef={searchInputRef}
                            />

                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="lg:w-3/4 space-y-6">
                                    <ExpenseTable
                                        expenses={filteredExpenses}
                                        loading={loading.expenses}
                                        onEdit={handleOpenModal}
                                        onDelete={handleDeleteExpense}
                                    />
                                </div>
                                <div className="lg:w-1/4 space-y-6">
                                    <TrendChart />
                                    <div className="card p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg">
                                        <h3 className="font-bold text-lg mb-1">Monthly Focus</h3>
                                        <p className="opacity-90 text-sm">Viewing data for {currentMonthDisplay}</p>
                                    </div>
                                    <RemindersWidget />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'recurring' && <RecurringExpensesPage />}
                    {activeTab === 'income' && <IncomeDashboard billingMonth={filters.billing_month} />}
                    {activeTab === 'tags' && <TagsManager />}

                    {activeTab === 'analytics' && (
                        <div className="max-w-5xl mx-auto">
                            <AnalyticsDashboard />
                        </div>
                    )}

                    {activeTab === 'organize' && <OrganizationPage />}
                    {activeTab === 'finance' && <FinancePage />}
                    {activeTab === 'data' && <DataPage />}
                </div>
            </main>

            {/* Quick Add Widget (FAB) */}
            <QuickAddWidget
                onOpenModal={() => handleOpenModal()}
            />

            {/* Modals */}
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

            {showProfile && (
                <UserProfile
                    isOpen={showProfile}
                    onClose={() => setShowProfile(false)}
                    user={user}
                    onUpdate={onUserUpdate}
                    onLogout={onLogout}
                />
            )}

            {showShortcutsHelp && (
                <KeyboardShortcutsHelp
                    isOpen={showShortcutsHelp}
                    onClose={() => setShowShortcutsHelp(false)}
                />
            )}
        </div>
    );
}

export default App;
