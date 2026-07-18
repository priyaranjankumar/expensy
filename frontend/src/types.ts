// Type definitions for the expense tracker

export type ExpenseStatus = 'Unpaid' | 'Paid' | 'Completely Paid';

export interface Expense {
    id: number;
    category: string;
    description: string;
    amount: number;
    status: ExpenseStatus;
    notes: string | null;
    billing_month: string;
    created_at: string;
    updated_at: string;
}

export interface ExpenseCreate {
    category: string;
    description: string;
    amount: number;
    status: ExpenseStatus;
    notes?: string | null;
    billing_month?: string;
}

export interface ExpenseUpdate {
    category?: string;
    description?: string;
    amount?: number;
    status?: ExpenseStatus;
    notes?: string | null;
    billing_month?: string;
}

export interface ExpenseListResponse {
    expenses: Expense[];
    total: number;
}

export interface CategoryTotal {
    category: string;
    total: number;
    count: number;
    budget?: number;
}

export interface MetricsResponse {
    total_amount: number;
    total_paid: number;
    total_unpaid: number;
    budget: number;
    remaining: number;
    category_totals: CategoryTotal[];
    expense_count: number;
    current_month: string;
    total_income?: number;
    net_savings?: number;
    overdue_unpaid?: number;
}

export interface MonthlyTotal {
    billing_month: string;
    total_amount: number;
    total_paid: number;
    total_unpaid: number;
    expense_count: number;
}

export interface TrendsResponse {
    months: MonthlyTotal[];
    average_monthly: number;
}

export interface FilterState {
    status: string;
    category: string;
    search: string;
    billing_month: string;
}

export interface SortState {
    field: 'amount' | 'status' | 'created_at';
    direction: 'asc' | 'desc';
}

// User types
export interface User {
    id: number;
    username: string;
    name: string;
    monthly_budget: number;
    created_at: string;
}

// Recurring Expense types
export type RecurringFrequency = 'monthly' | 'weekly' | 'yearly';

export interface RecurringExpense {
    id: number;
    category: string;
    description: string;
    amount: number;
    frequency: RecurringFrequency;
    day_of_month?: number;
    is_active: boolean;
    notes?: string;
    start_date: string;
    end_date?: string;
    last_generated?: string;
    created_at: string;
    updated_at: string;
}

export interface RecurringExpenseCreate {
    category: string;
    description: string;
    amount: number;
    frequency: RecurringFrequency;
    day_of_month?: number;
    is_active?: boolean;
    notes?: string;
    start_date: string;
    end_date?: string;
}

// Tag types
export interface Tag {
    id: number;
    name: string;
    color: string;
    created_at: string;
}

export interface TagCreate {
    name: string;
    color?: string;
}

// Category Budget types
export interface CategoryBudget {
    id: number;
    category: string;
    budget_amount: number;
    billing_month?: string;
    spent?: number;
    remaining?: number;
    created_at: string;
    updated_at: string;
}

export interface CategoryBudgetCreate {
    category: string;
    budget_amount: number;
    billing_month?: string;
}

// Income types
export interface Income {
    id: number;
    source: string;
    description?: string;
    amount: number;
    billing_month: string;
    received_date?: string;
    is_recurring: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface IncomeCreate {
    source: string;
    description?: string;
    amount: number;
    billing_month: string;
    received_date?: string;
    is_recurring?: boolean;
    notes?: string;
}

export interface IncomeSummary {
    total_income: number;
    income_count: number;
    by_source: { source: string; total: number; count: number }[];
}

// Reminder types
export interface ExpenseReminder {
    expense_id: number;
    category: string;
    description: string;
    amount: number;
    due_date: string;
    days_until_due: number;
    is_overdue: boolean;
    status: string;
}

export interface RemindersResponse {
    upcoming: ExpenseReminder[];
    overdue: ExpenseReminder[];
    total_overdue_amount: number;
}

export interface ReminderCount {
    overdue_count: number;
    upcoming_count: number;
    total_pending: number;
}

// Analytics types
export interface MonthComparison {
    billing_month: string;
    total: number;
    expense_count: number;
    category_breakdown: { category: string; amount: number }[];
    mom_change_percent?: number;
}

export interface MonthComparisonResponse {
    months: MonthComparison[];
    average_monthly: number;
    highest_month: MonthComparison | null;
    lowest_month: MonthComparison | null;
}

export interface SpendingVelocity {
    daily_rate: number;
    days_elapsed: number;
    days_remaining: number;
    current_spending: number;
    projected_total: number;
}

export interface ForecastMonth {
    billing_month: string;
    predicted_total: number;
    confidence: string;
}

export interface ForecastResponse {
    historical: { billing_month: string; total: number }[];
    forecast: ForecastMonth[];
    average_monthly: number;
    trend_direction: 'increasing' | 'decreasing' | 'stable';
    monthly_trend_amount: number;
    current_month_velocity: SpendingVelocity;
}

export interface CategoryAnomaly {
    category: string;
    current_month_spending: number;
    historical_average: number;
    deviation_percent: number;
    type: 'high' | 'low';
    severity: 'critical' | 'warning' | 'notice';
}

export interface ExpenseOutlier {
    expense_id: number;
    category: string;
    description: string;
    amount: number;
    deviation_from_avg: number;
}

export interface AnomaliesResponse {
    billing_month: string;
    category_anomalies: CategoryAnomaly[];
    expense_outliers: ExpenseOutlier[];
    total_anomalies: number;
    summary: {
        has_high_spending_categories: boolean;
        has_unusual_expenses: boolean;
    };
}


// ============ PHASE 4: ORGANIZATION TYPES ============

export interface Payee {
    id: number;
    name: string;
    category?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface PayeeCreate {
    name: string;
    category?: string;
    notes?: string;
}

export interface SubCategory {
    id: number;
    parent_category: string;
    name: string;
    description?: string;
    created_at: string;
}

export interface SubCategoryCreate {
    parent_category: string;
    name: string;
    description?: string;
}

export interface CategoryHierarchy {
    category: string;
    subcategories: { id: number; name: string; description?: string }[];
}

export interface ExpenseGroup {
    id: number;
    name: string;
    description?: string;
    color: string;
    expense_count: number;
    total_amount: number;
    created_at: string;
}

export interface ExpenseGroupCreate {
    name: string;
    description?: string;
    color?: string;
}

export interface SplitExpense {
    id: number;
    parent_expense_id: number;
    category: string;
    sub_category?: string;
    description: string;
    amount: number;
    notes?: string;
    created_at: string;
}

export interface SplitExpenseCreate {
    category: string;
    sub_category?: string;
    description: string;
    amount: number;
    notes?: string;
}

export interface SplitRequest {
    splits: SplitExpenseCreate[];
}


// Helper function to format billing month for display
export function formatBillingMonth(billingMonth: string): string {
    const [year, month] = billingMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Get current billing month in YYYY-MM format
export function getCurrentBillingMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Generate a range of months for the selector (6 months before and 6 months after)
export function generateMonthRange(): string[] {
    const months: string[] = [];
    const now = new Date();

    // 6 months back
    for (let i = 6; i >= 1; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }

    // Current month
    months.push(getCurrentBillingMonth());

    // 6 months forward
    for (let i = 1; i <= 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }

    return months;
}
