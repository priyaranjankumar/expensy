import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BarChart3, Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { MetricsResponse } from '../types';
import Modal from './Modal';

interface DashboardProps {
    metrics: MetricsResponse | null;
    loading: boolean;
}

// Format currency in INR
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

// Custom colors for the chart
const CHART_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#f97316', '#eab308',
    '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
];

// Custom Tooltip Component for Bar Chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-dark-800 px-4 py-3 rounded-xl shadow-2xl border border-slate-200 dark:border-dark-600">
                <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">{label}</p>
                <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(payload[0].value)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {payload[0].payload.count} expense{payload[0].payload.count !== 1 ? 's' : ''}
                </p>
            </div>
        );
    }
    return null;
};

// Custom Tooltip Component for Pie Chart
const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="bg-white dark:bg-dark-800 px-4 py-3 rounded-xl shadow-2xl border border-slate-200 dark:border-dark-600">
                <div className="flex items-center gap-2 mb-1">
                    <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: data.payload.color }}
                    ></span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{data.name}</p>
                </div>
                <p className="text-lg font-bold" style={{ color: data.payload.color }}>
                    {formatCurrency(data.value)}
                </p>
            </div>
        );
    }
    return null;
};

const Dashboard: React.FC<DashboardProps> = ({ metrics, loading }) => {
    const [expandedChart, setExpandedChart] = useState<'bar' | 'pie' | null>(null);

    if (loading) {
        return (
            <div className="grid grid-cols-3 gap-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-28 bg-slate-200 dark:bg-dark-700 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    if (!metrics) {
        return null;
    }

    // Pie chart data for paid vs unpaid
    const pieData = [
        { name: 'Unpaid', value: metrics.total_unpaid, color: '#ef4444' },
        { name: 'Paid', value: metrics.total_paid, color: '#22c55e' },
    ].filter(d => d.value > 0);

    const chartData = metrics.category_totals
        .filter(cat => cat.total > 0)
        .sort((a, b) => b.total - a.total);

    const topChartData = chartData.slice(0, 6);

    const overdueUnpaid = metrics.overdue_unpaid ?? 0;
    const totalIncome = metrics.total_income ?? 0;
    const netSavings = metrics.net_savings ?? 0;

    return (
        <>
            <div className="space-y-5">
                {/* Overdue Warning Banner */}
                {overdueUnpaid > 0 && (
                    <div className="p-4 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-650 dark:text-red-400 flex items-center justify-between shadow-sm animate-pulse-slow">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider">Outstanding Overdue Bills</h4>
                                <p className="text-[10px] font-semibold opacity-90 mt-0.5">You have {formatCurrency(overdueUnpaid)} in unpaid expenses outstanding from previous months.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                toast.success("Tip: Select previous months from the filter to view and resolve outstanding bills.");
                            }}
                            className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] shadow-sm transition-all active:scale-[0.97]"
                        >
                            Resolve Bills
                        </button>
                    </div>
                )}

                {/* Summary Cards - 5 cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total */}
                    <div className="card p-5 group hover:shadow-xl transition-all duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Expenses</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(metrics.total_amount)}</p>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <BarChart3 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-[10px] font-semibold text-slate-450 dark:text-slate-505">
                            <span className="font-bold text-slate-700 dark:text-slate-350">{metrics.expense_count}</span> entries tracked
                        </div>
                    </div>

                    {/* Remaining */}
                    <div className="card p-5 group hover:shadow-xl transition-all duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Remaining Budget</p>
                                <p className={`text-2xl font-bold mt-1 ${metrics.remaining < 0
                                        ? 'text-red-500 dark:text-red-450'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                    {formatCurrency(metrics.remaining)}
                                </p>
                            </div>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg ${metrics.remaining < 0
                                    ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20'
                                    : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20'
                                }`}>
                                <Wallet className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${metrics.remaining < 0 ? 'bg-red-500' : 'bg-emerald-500'
                                    }`}
                                style={{
                                    width: `${Math.min((metrics.total_amount / metrics.budget) * 100, 100)}%`
                                }}
                            />
                        </div>
                        <div className="mt-2 text-[10px] font-semibold text-slate-450 dark:text-slate-505">
                            of {formatCurrency(metrics.budget)} budget used
                        </div>
                    </div>

                    {/* Net Savings */}
                    <div className="card p-5 group hover:shadow-xl transition-all duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Net Savings</p>
                                <p className={`text-2xl font-bold mt-1 ${netSavings < 0
                                        ? 'text-red-500 dark:text-red-450'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                    {formatCurrency(netSavings)}
                                </p>
                            </div>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg ${netSavings < 0
                                    ? 'bg-gradient-to-br from-red-500 to-red-650'
                                    : 'bg-gradient-to-br from-emerald-500 to-green-600'
                                }`}>
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-slate-450 dark:text-slate-505">
                            Income: <span className="font-bold text-emerald-600 dark:text-emerald-450">{formatCurrency(totalIncome)}</span>
                        </div>
                    </div>

                    {/* Unpaid */}
                    <div className="relative overflow-hidden card p-5 group hover:shadow-xl transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent dark:from-red-500/10"></div>
                        <div className="relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wider">Unpaid Bills</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(metrics.total_unpaid)}</p>
                                </div>
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-650 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                                    <Clock className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 bg-red-100 dark:bg-red-950/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                                    style={{ width: `${metrics.total_amount > 0 ? Math.min((metrics.total_unpaid / metrics.total_amount) * 100, 100) : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Paid */}
                    <div className="relative overflow-hidden card p-5 group hover:shadow-xl transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent dark:from-green-500/10"></div>
                        <div className="relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wider">Paid Bills</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(metrics.total_paid)}</p>
                                </div>
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 bg-green-100 dark:bg-green-950/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-green-650 rounded-full transition-all duration-500"
                                    style={{ width: `${metrics.total_amount > 0 ? Math.min((metrics.total_paid / metrics.total_amount) * 100, 100) : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Category Bar Chart */}
                    <button
                        onClick={() => setExpandedChart('bar')}
                        className="card p-5 text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.01] group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Top Categories</h3>
                            <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-primary-500 transition-colors">
                                Click to expand →
                            </span>
                        </div>
                        <div className="h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topChartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                        tickLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="category"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        width={95}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        content={<CustomBarTooltip />}
                                        cursor={{ fill: 'rgba(99, 102, 241, 0.1)', radius: 8 }}
                                    />
                                    <Bar dataKey="total" radius={[0, 8, 8, 0]} animationDuration={800}>
                                        {topChartData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </button>

                    {/* Payment Status Pie */}
                    <button
                        onClick={() => setExpandedChart('pie')}
                        className="card p-5 text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.01] group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Payment Status</h3>
                            <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-primary-500 transition-colors">
                                Click to expand →
                            </span>
                        </div>
                        <div className="h-44 flex items-center">
                            <div className="w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={65}
                                            paddingAngle={4}
                                            dataKey="value"
                                            animationDuration={800}
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-1/2 space-y-3">
                                {pieData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full shadow-sm"
                                                style={{ backgroundColor: item.color }}
                                            ></span>
                                            <span className="text-sm text-slate-600 dark:text-slate-300">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-800 dark:text-white">
                                            {formatCurrency(item.value)}
                                        </span>
                                    </div>
                                ))}
                                <div className="pt-3 border-t border-slate-100 dark:border-dark-600">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{metrics.expense_count} expenses</span>
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                            {metrics.total_amount > 0
                                                ? `${Math.round((metrics.total_paid / metrics.total_amount) * 100)}% paid`
                                                : '0% paid'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Expanded Bar Chart Modal */}
            <Modal
                isOpen={expandedChart === 'bar'}
                onClose={() => setExpandedChart(null)}
                title="Category Breakdown"
                subtitle={`${chartData.length} categories • ${formatCurrency(metrics.total_amount)} total`}
                icon="📊"
                size="xl"
            >
                <div className="p-6">
                    <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(v) => formatCurrency(v)}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tickLine={{ stroke: '#e2e8f0' }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="category"
                                    tick={{ fontSize: 13, fill: '#334155' }}
                                    width={140}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    content={<CustomBarTooltip />}
                                    cursor={{ fill: 'rgba(99, 102, 241, 0.1)', radius: 8 }}
                                />
                                <Bar dataKey="total" radius={[0, 10, 10, 0]} animationDuration={800} barSize={30}>
                                    {chartData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Modal>

            {/* Expanded Pie Chart Modal */}
            <Modal
                isOpen={expandedChart === 'pie'}
                onClose={() => setExpandedChart(null)}
                title="Payment Status Overview"
                subtitle={`${metrics.expense_count} expenses • ${formatCurrency(metrics.total_amount)} total`}
                icon="📈"
                size="lg"
            >
                <div className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/2 h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={140}
                                        paddingAngle={4}
                                        dataKey="value"
                                        animationDuration={800}
                                        stroke="none"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: '#64748b' }}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                style={{ filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))' }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/2 space-y-4">
                            {pieData.map((item) => (
                                <div key={item.name} className="p-4 bg-slate-50 dark:bg-dark-700 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="w-4 h-4 rounded-full shadow-lg"
                                                style={{ backgroundColor: item.color }}
                                            ></span>
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                                        </div>
                                        <span className="text-xl font-bold" style={{ color: item.color }}>
                                            {formatCurrency(item.value)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-200 dark:bg-dark-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${(item.value / metrics.total_amount) * 100}%`,
                                                backgroundColor: item.color,
                                            }}
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {((item.value / metrics.total_amount) * 100).toFixed(1)}% of total
                                    </p>
                                </div>
                            ))}
                            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Progress</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {metrics.total_amount > 0
                                        ? `${Math.round((metrics.total_paid / metrics.total_amount) * 100)}%`
                                        : '0%'
                                    }
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">of expenses are paid</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Dashboard;
