import axios from 'axios';
import type { Expense, ExpenseCreate, ExpenseUpdate, ExpenseListResponse, MetricsResponse } from '../types';

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
};

export default api;
