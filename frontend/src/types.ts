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
