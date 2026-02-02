import axios from 'axios';
import type { Expense, ExpenseCreate, ExpenseUpdate, ExpenseListResponse, MetricsResponse, TrendsResponse } from '../types';

// API base URL - connects to FastAPI backend
const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Expense API calls
export const expenseApi = {
    // Get all expenses with optional filtering
    getExpenses: async (status?: string, category?: string, billingMonth?: string): Promise<ExpenseListResponse> => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (category) params.append('category', category);
        if (billingMonth) params.append('billing_month', billingMonth);

        const response = await api.get<ExpenseListResponse>(`/expenses?${params.toString()}`);
        return response.data;
    },

    // Get single expense by ID
    getExpense: async (id: number): Promise<Expense> => {
        const response = await api.get<Expense>(`/expenses/${id}`);
        return response.data;
    },

    // Create new expense
    createExpense: async (expense: ExpenseCreate): Promise<Expense> => {
        const response = await api.post<Expense>('/expenses', expense);
        return response.data;
    },

    // Update existing expense
    updateExpense: async (id: number, expense: ExpenseUpdate): Promise<Expense> => {
        const response = await api.put<Expense>(`/expenses/${id}`, expense);
        return response.data;
    },

    // Delete expense
    deleteExpense: async (id: number): Promise<void> => {
        await api.delete(`/expenses/${id}`);
    },

    // Get all unique categories
    getCategories: async (): Promise<string[]> => {
        const response = await api.get<string[]>('/expenses/categories');
        return response.data;
    },

    // Get all unique billing months
    getBillingMonths: async (): Promise<string[]> => {
        const response = await api.get<string[]>('/expenses/months');
        return response.data;
    },

    // Bulk update expense status
    bulkUpdateStatus: async (expenseIds: number[], status: string): Promise<{ updated_count: number }> => {
        const response = await api.put<{ updated_count: number }>('/expenses/bulk/status', {
            expense_ids: expenseIds,
            status: status
        });
        return response.data;
    },

    // Bulk delete expenses
    bulkDelete: async (expenseIds: number[]): Promise<{ deleted_count: number }> => {
        const response = await api.delete<{ deleted_count: number }>('/expenses/bulk', {
            data: { expense_ids: expenseIds }
        });
        return response.data;
    },
};

// Metrics API calls
export const metricsApi = {
    // Get dashboard metrics
    getMetrics: async (billingMonth?: string): Promise<MetricsResponse> => {
        const params = new URLSearchParams();
        if (billingMonth) params.append('billing_month', billingMonth);

        const response = await api.get<MetricsResponse>(`/metrics?${params.toString()}`);
        return response.data;
    },

    // Get spending trends for past N months
    getTrends: async (months: number = 6): Promise<TrendsResponse> => {
        const response = await api.get<TrendsResponse>(`/metrics/trends?months=${months}`);
        return response.data;
    },
};

// Export API calls
export const exportApi = {
    // Download expenses as CSV
    downloadCSV: async (billingMonth?: string): Promise<void> => {
        const params = new URLSearchParams();
        if (billingMonth) params.append('billing_month', billingMonth);

        const response = await api.get(`/export/csv?${params.toString()}`, {
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Get filename from Content-Disposition header or generate one
        const contentDisposition = response.headers['content-disposition'];
        let filename = billingMonth ? `expenses_${billingMonth}.csv` : 'expenses.csv';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename=(.+)/);
            if (match) filename = match[1];
        }

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // Download expenses as JSON backup
    downloadJSON: async (billingMonth?: string): Promise<void> => {
        const params = new URLSearchParams();
        if (billingMonth) params.append('billing_month', billingMonth);

        const response = await api.get(`/export/json?${params.toString()}`);

        // Create download
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `expenses_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};

// Recurring Expenses API
export const recurringApi = {
    getAll: async (activeOnly = false): Promise<import('../types').RecurringExpense[]> => {
        const response = await api.get(`/recurring?active_only=${activeOnly}`);
        return response.data;
    },

    get: async (id: number): Promise<import('../types').RecurringExpense> => {
        const response = await api.get(`/recurring/${id}`);
        return response.data;
    },

    create: async (data: import('../types').RecurringExpenseCreate): Promise<import('../types').RecurringExpense> => {
        const response = await api.post('/recurring', data);
        return response.data;
    },

    update: async (id: number, data: Partial<import('../types').RecurringExpenseCreate>): Promise<import('../types').RecurringExpense> => {
        const response = await api.put(`/recurring/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/recurring/${id}`);
    },

    generate: async (id: number, billingMonth: string): Promise<import('../types').Expense> => {
        const response = await api.post(`/recurring/${id}/generate?billing_month=${billingMonth}`);
        return response.data;
    }
};

// Tags API
export const tagsApi = {
    getAll: async (): Promise<import('../types').Tag[]> => {
        const response = await api.get('/tags');
        return response.data;
    },

    create: async (data: import('../types').TagCreate): Promise<import('../types').Tag> => {
        const response = await api.post('/tags', data);
        return response.data;
    },

    update: async (id: number, data: Partial<import('../types').TagCreate>): Promise<import('../types').Tag> => {
        const response = await api.put(`/tags/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/tags/${id}`);
    },

    addToExpense: async (tagId: number, expenseId: number): Promise<void> => {
        await api.post(`/tags/${tagId}/expenses/${expenseId}`);
    },

    removeFromExpense: async (tagId: number, expenseId: number): Promise<void> => {
        await api.delete(`/tags/${tagId}/expenses/${expenseId}`);
    }
};

// Category Budgets API
export const budgetsApi = {
    getAll: async (billingMonth?: string): Promise<import('../types').CategoryBudget[]> => {
        const params = billingMonth ? `?billing_month=${billingMonth}` : '';
        const response = await api.get(`/budgets${params}`);
        return response.data;
    },

    create: async (data: import('../types').CategoryBudgetCreate): Promise<import('../types').CategoryBudget> => {
        const response = await api.post('/budgets', data);
        return response.data;
    },

    update: async (id: number, data: Partial<import('../types').CategoryBudgetCreate>): Promise<import('../types').CategoryBudget> => {
        const response = await api.put(`/budgets/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/budgets/${id}`);
    }
};

// Income API
export const incomeApi = {
    getAll: async (billingMonth?: string): Promise<import('../types').Income[]> => {
        const params = billingMonth ? `?billing_month=${billingMonth}` : '';
        const response = await api.get(`/income${params}`);
        return response.data;
    },

    getSummary: async (billingMonth?: string): Promise<import('../types').IncomeSummary> => {
        const params = billingMonth ? `?billing_month=${billingMonth}` : '';
        const response = await api.get(`/income/summary${params}`);
        return response.data;
    },

    create: async (data: import('../types').IncomeCreate): Promise<import('../types').Income> => {
        const response = await api.post('/income', data);
        return response.data;
    },

    update: async (id: number, data: Partial<import('../types').IncomeCreate>): Promise<import('../types').Income> => {
        const response = await api.put(`/income/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/income/${id}`);
    }
};

// Reminders API
export const remindersApi = {
    getAll: async (daysAhead = 7, billingMonth?: string): Promise<import('../types').RemindersResponse> => {
        const params = new URLSearchParams({ days_ahead: daysAhead.toString() });
        if (billingMonth) params.append('billing_month', billingMonth);
        const response = await api.get(`/reminders?${params.toString()}`);
        return response.data;
    },

    getCount: async (): Promise<import('../types').ReminderCount> => {
        const response = await api.get('/reminders/count');
        return response.data;
    }
};

// Analytics API
export const analyticsApi = {
    getMonthComparison: async (months = 6): Promise<import('../types').MonthComparisonResponse> => {
        const response = await api.get(`/analytics/month-comparison?months=${months}`);
        return response.data;
    },

    getForecast: async (forecastMonths = 3): Promise<import('../types').ForecastResponse> => {
        const response = await api.get(`/analytics/forecast?forecast_months=${forecastMonths}`);
        return response.data;
    },

    getAnomalies: async (sensitivity = 1.5): Promise<import('../types').AnomaliesResponse> => {
        const response = await api.get(`/analytics/anomalies?sensitivity=${sensitivity}`);
        return response.data;
    },

    getCategoryTrends: async (category: string, months = 12) => {
        const response = await api.get(`/analytics/category-trends?category=${encodeURIComponent(category)}&months=${months}`);
        return response.data;
    }
};

// Payees API
export const payeesApi = {
    getAll: async (): Promise<import('../types').Payee[]> => {
        const response = await api.get('/payees');
        return response.data;
    },

    create: async (data: import('../types').PayeeCreate): Promise<import('../types').Payee> => {
        const response = await api.post('/payees', data);
        return response.data;
    },

    update: async (id: number, data: Partial<import('../types').PayeeCreate>): Promise<import('../types').Payee> => {
        const response = await api.put(`/payees/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/payees/${id}`);
    }
};

// SubCategories API
export const subcategoriesApi = {
    getAll: async (parentCategory?: string): Promise<import('../types').SubCategory[]> => {
        const params = parentCategory ? `?parent_category=${encodeURIComponent(parentCategory)}` : '';
        const response = await api.get(`/subcategories${params}`);
        return response.data;
    },

    getHierarchy: async (): Promise<import('../types').CategoryHierarchy[]> => {
        const response = await api.get('/subcategories/hierarchy');
        return response.data;
    },

    create: async (data: import('../types').SubCategoryCreate): Promise<import('../types').SubCategory> => {
        const response = await api.post('/subcategories', data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/subcategories/${id}`);
    }
};

// Expense Groups API
export const groupsApi = {
    getAll: async (): Promise<import('../types').ExpenseGroup[]> => {
        const response = await api.get('/groups');
        return response.data;
    },

    create: async (data: import('../types').ExpenseGroupCreate): Promise<import('../types').ExpenseGroup> => {
        const response = await api.post('/groups', data);
        return response.data;
    },

    update: async (id: number, data: Partial<import('../types').ExpenseGroupCreate>): Promise<import('../types').ExpenseGroup> => {
        const response = await api.put(`/groups/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/groups/${id}`);
    },

    addExpense: async (groupId: number, expenseId: number): Promise<void> => {
        await api.post(`/groups/${groupId}/expenses/${expenseId}`);
    },

    removeExpense: async (groupId: number, expenseId: number): Promise<void> => {
        await api.delete(`/groups/${groupId}/expenses/${expenseId}`);
    },

    getExpenses: async (groupId: number) => {
        const response = await api.get(`/groups/${groupId}/expenses`);
        return response.data;
    }
};

// Split Expenses API
export const splitsApi = {
    getSplits: async (expenseId: number): Promise<import('../types').SplitExpense[]> => {
        const response = await api.get(`/splits/${expenseId}`);
        return response.data;
    },

    createSplits: async (expenseId: number, data: import('../types').SplitRequest): Promise<import('../types').SplitExpense[]> => {
        const response = await api.post(`/splits/${expenseId}`, data);
        return response.data;
    },

    updateSplits: async (expenseId: number, data: import('../types').SplitRequest): Promise<import('../types').SplitExpense[]> => {
        const response = await api.put(`/splits/${expenseId}`, data);
        return response.data;
    },

    deleteSplits: async (expenseId: number): Promise<void> => {
        await api.delete(`/splits/${expenseId}`);
    }
};

// Templates API
export const templatesApi = {
    getAll: async () => {
        const response = await api.get('/templates');
        return response.data;
    },

    create: async (data: { name: string; category: string; description: string; default_amount?: number; notes?: string }) => {
        const response = await api.post('/templates', data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/templates/${id}`);
    },

    use: async (id: number, amount?: number, billingMonth?: string) => {
        const params = new URLSearchParams();
        if (amount !== undefined) params.append('amount', amount.toString());
        if (billingMonth) params.append('billing_month', billingMonth);
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await api.post(`/templates/${id}/use${query}`);
        return response.data;
    }
};

// Batch Operations API
export const batchApi = {
    markPaid: async (ids: number[]) => {
        const response = await api.post('/batch/mark-paid', { ids });
        return response.data;
    },

    markUnpaid: async (ids: number[]) => {
        const response = await api.post('/batch/mark-unpaid', { ids });
        return response.data;
    },

    delete: async (ids: number[]) => {
        const response = await api.post('/batch/delete', { ids });
        return response.data;
    },

    updateStatus: async (ids: number[], status: string) => {
        const response = await api.post('/batch/update-status', { ids, status });
        return response.data;
    },

    updateCategory: async (ids: number[], category: string) => {
        const response = await api.post('/batch/update-category', { ids, category });
        return response.data;
    },

    assignGroup: async (ids: number[], groupId: number) => {
        const response = await api.post('/batch/assign-group', { ids, group_id: groupId });
        return response.data;
    },

    removeFromGroup: async (ids: number[]) => {
        const response = await api.post('/batch/remove-from-group', { ids });
        return response.data;
    },

    duplicate: async (ids: number[], billingMonth: string) => {
        const response = await api.post(`/batch/duplicate?billing_month=${billingMonth}`, { ids });
        return response.data;
    }
};

// Accounts API
export const accountsApi = {
    getAll: async (includeInactive = false) => {
        const response = await api.get(`/accounts?include_inactive=${includeInactive}`);
        return response.data;
    },

    getSummary: async () => {
        const response = await api.get('/accounts/summary');
        return response.data;
    },

    create: async (data: { name: string; account_type: string; balance?: number; currency?: string; color?: string; icon?: string }) => {
        const response = await api.post('/accounts', data);
        return response.data;
    },

    update: async (id: number, data: any) => {
        const response = await api.put(`/accounts/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await api.delete(`/accounts/${id}`);
    },

    transfer: async (fromId: number, toId: number, amount: number) => {
        const response = await api.post(`/accounts/${fromId}/transfer?to_account_id=${toId}&amount=${amount}`);
        return response.data;
    }
};

// Savings Goals API
export const savingsApi = {
    getAll: async (includeCompleted = false) => {
        const response = await api.get(`/savings?include_completed=${includeCompleted}`);
        return response.data;
    },

    getSummary: async () => {
        const response = await api.get('/savings/summary');
        return response.data;
    },

    create: async (data: { name: string; target_amount: number; current_amount?: number; target_date?: string; color?: string; icon?: string }) => {
        const response = await api.post('/savings', data);
        return response.data;
    },

    update: async (id: number, data: any) => {
        const response = await api.put(`/savings/${id}`, data);
        return response.data;
    },

    contribute: async (id: number, amount: number) => {
        const response = await api.post(`/savings/${id}/contribute?amount=${amount}`);
        return response.data;
    },

    delete: async (id: number) => {
        await api.delete(`/savings/${id}`);
    }
};

// Payment Methods API
export const paymentMethodsApi = {
    getAll: async () => {
        const response = await api.get('/payment-methods');
        return response.data;
    },

    create: async (data: { name: string; method_type: string; last_four?: string; icon?: string; is_default?: boolean }) => {
        const response = await api.post('/payment-methods', data);
        return response.data;
    },

    setDefault: async (id: number) => {
        const response = await api.put(`/payment-methods/${id}/default`);
        return response.data;
    },

    delete: async (id: number) => {
        await api.delete(`/payment-methods/${id}`);
    }
};

// Currency API
export const currencyApi = {
    getList: async () => {
        const response = await api.get('/currency/list');
        return response.data;
    },

    getRates: async () => {
        const response = await api.get('/currency/rates');
        return response.data;
    },

    setRate: async (fromCurrency: string, toCurrency: string, rate: number) => {
        const response = await api.post('/currency/rates', { from_currency: fromCurrency, to_currency: toCurrency, rate });
        return response.data;
    },

    convert: async (amount: number, fromCurrency: string, toCurrency: string) => {
        const response = await api.get(`/currency/convert?amount=${amount}&from_currency=${fromCurrency}&to_currency=${toCurrency}`);
        return response.data;
    },

    deleteRate: async (id: number) => {
        await api.delete(`/currency/rates/${id}`);
    }
};

// Reports API
export const reportsApi = {
    getMonthlyReport: async (billingMonth: string) => {
        const response = await api.get(`/reports/monthly/${billingMonth}`, {
            responseType: 'blob'
        });
        return response.data;
    },

    getSummary: async (startMonth?: string, endMonth?: string) => {
        const params = new URLSearchParams();
        if (startMonth) params.append('start_month', startMonth);
        if (endMonth) params.append('end_month', endMonth);
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await api.get(`/reports/summary${query}`);
        return response.data;
    }
};

// Data Import API
export const importApi = {
    importCSV: async (file: File, billingMonth?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        const params = billingMonth ? `?billing_month=${billingMonth}` : '';
        const response = await api.post(`/import/csv${params}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    importJSON: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/import/json', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    getTemplate: async () => {
        const response = await api.get('/import/template/csv');
        return response.data;
    }
};

// Family API
export const familyApi = {
    getMyFamilies: async () => {
        const response = await api.get('/family');
        return response.data;
    },

    create: async (name: string) => {
        const response = await api.post('/family', { name });
        return response.data;
    },

    join: async (inviteCode: string) => {
        const response = await api.post(`/family/join?invite_code=${inviteCode}`);
        return response.data;
    },

    getMembers: async (familyId: number) => {
        const response = await api.get(`/family/${familyId}/members`);
        return response.data;
    },

    updatePermissions: async (familyId: number, memberId: number, canView: boolean, canEdit: boolean) => {
        const response = await api.put(`/family/${familyId}/members/${memberId}/permissions?can_view=${canView}&can_edit=${canEdit}`);
        return response.data;
    },

    getBudgets: async (familyId: number, billingMonth?: string) => {
        const params = billingMonth ? `?billing_month=${billingMonth}` : '';
        const response = await api.get(`/family/${familyId}/budgets${params}`);
        return response.data;
    },

    createBudget: async (familyId: number, data: { name: string; budget_amount: number; billing_month: string; category?: string }) => {
        const response = await api.post(`/family/${familyId}/budgets`, data);
        return response.data;
    },

    addSpending: async (familyId: number, budgetId: number, amount: number) => {
        const response = await api.post(`/family/${familyId}/budgets/${budgetId}/spend?amount=${amount}`);
        return response.data;
    },

    leave: async (familyId: number) => {
        const response = await api.delete(`/family/${familyId}/leave`);
        return response.data;
    }
};

export default api;
