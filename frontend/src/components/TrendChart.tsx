import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { metricsApi } from '../services/api';
import type { TrendsResponse } from '../types';

interface TrendChartProps {
    className?: string;
}

// Format currency in INR
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

// Format month for display (e.g., "Jan '24")
const formatMonth = (billingMonth: string): string => {
    const [year, month] = billingMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' }) + " '" + year.slice(2);
};

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white dark:bg-dark-800 px-4 py-3 rounded-xl shadow-2xl border border-slate-200 dark:border-dark-600">
                <p className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                    {formatMonth(data.billing_month)}
                </p>
                <div className="space-y-1">
                    <p className="text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Total: </span>
                        <span className="font-bold text-primary-600 dark:text-primary-400">
                            {formatCurrency(data.total_amount)}
                        </span>
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                        Paid: {formatCurrency(data.total_paid)}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400">
                        Unpaid: {formatCurrency(data.total_unpaid)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {data.expense_count} expense{data.expense_count !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const TrendChart: React.FC<TrendChartProps> = ({ className = '' }) => {
    const [trends, setTrends] = useState<TrendsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                setLoading(true);
                const data = await metricsApi.getTrends(6);
                setTrends(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch trends:', err);
                setError('Failed to load trends');
            } finally {
                setLoading(false);
            }
        };

        fetchTrends();
    }, []);

    if (loading) {
        return (
            <div className={`card p-5 ${className}`}>
                <div className="h-48 bg-slate-200 dark:bg-dark-700 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    if (error || !trends) {
        return null;
    }

    // Prepare chart data
    const chartData = trends.months.map(m => ({
        ...m,
        displayMonth: formatMonth(m.billing_month)
    }));



    return (
        <div className={`card p-5 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Spending Trends
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Last 6 months • Avg: {formatCurrency(trends.average_monthly)}/month
                    </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                        <span className="text-slate-500 dark:text-slate-400">Total</span>
                    </div>
                </div>
            </div>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="displayMonth"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                            y={trends.average_monthly}
                            stroke="#94a3b8"
                            strokeDasharray="3 3"
                            label={{ value: 'Avg', fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total_amount"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            animationDuration={800}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrendChart;
