import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';
import { analyticsApi } from '../services/api';
import type {
    MonthComparisonResponse,
    ForecastResponse,
    AnomaliesResponse
} from '../types';
import { formatBillingMonth } from '../types';

interface AnalyticsDashboardProps {
    className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
    const [comparison, setComparison] = useState<MonthComparisonResponse | null>(null);
    const [forecast, setForecast] = useState<ForecastResponse | null>(null);
    const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'overview' | 'forecast' | 'anomalies'>('overview');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [compData, forecastData, anomalyData] = await Promise.all([
                analyticsApi.getMonthComparison(6),
                analyticsApi.getForecast(3),
                analyticsApi.getAnomalies(1.5)
            ]);
            setComparison(compData);
            setForecast(forecastData);
            setAnomalies(anomalyData);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = (change?: number) => {
        if (change === undefined || change === null) return null;
        if (change > 5) return <span className="text-red-500">↑</span>;
        if (change < -5) return <span className="text-green-500">↓</span>;
        return <span className="text-gray-400">→</span>;
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'warning': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    if (loading) {
        return (
            <div className={`card p-6 ${className}`}>
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Section Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-200/40 dark:border-slate-800/50 rounded-2xl w-fit">
                {[
                    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                    { id: 'forecast', label: 'Forecast', icon: <Sparkles className="w-3.5 h-3.5" /> },
                    { id: 'anomalies', label: 'Anomalies', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as typeof activeSection)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                            activeSection === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Section */}
            {activeSection === 'overview' && comparison && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="card p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                            <p className="text-sm opacity-80">Average Monthly</p>
                            <p className="text-2xl font-bold">₹{comparison.average_monthly.toLocaleString()}</p>
                            <p className="text-xs opacity-70 mt-1">Last 6 months</p>
                        </div>
                        {comparison.highest_month && (
                            <div className="card p-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Highest Month</p>
                                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                                    ₹{comparison.highest_month.total.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">{formatBillingMonth(comparison.highest_month.billing_month)}</p>
                            </div>
                        )}
                        {comparison.lowest_month && (
                            <div className="card p-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Lowest Month</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                    ₹{comparison.lowest_month.total.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">{formatBillingMonth(comparison.lowest_month.billing_month)}</p>
                            </div>
                        )}
                    </div>

                    {/* Month-over-Month Chart */}
                    <div className="card p-5">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <span>📈</span> Month-over-Month Comparison
                        </h3>
                        <div className="space-y-3">
                            {comparison.months.map((month) => (
                                <div key={month.billing_month} className="flex items-center gap-4">
                                    <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                                        {formatBillingMonth(month.billing_month).split(' ')[0].slice(0, 3)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg transition-all"
                                                style={{ width: `${Math.min(100, (month.total / (comparison.highest_month?.total || 1)) * 100)}%` }}
                                            />
                                            <div className="absolute inset-0 flex items-center px-3">
                                                <span className="text-sm font-medium text-white drop-shadow">
                                                    ₹{month.total.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-20 text-right text-sm">
                                        {month.mom_change_percent !== undefined && (
                                            <span className={`flex items-center justify-end gap-1 ${month.mom_change_percent > 0 ? 'text-red-500' : 'text-green-500'
                                                }`}>
                                                {getTrendIcon(month.mom_change_percent)}
                                                {Math.abs(month.mom_change_percent)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Forecast Section */}
            {activeSection === 'forecast' && forecast && (
                <div className="space-y-6">
                    {/* Velocity Card */}
                    <div className="card p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <span>⚡</span> Current Month Velocity
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Daily Rate</p>
                                <p className="text-lg font-bold">₹{forecast.current_month_velocity.daily_rate.toLocaleString()}/day</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Spent So Far</p>
                                <p className="text-lg font-bold">₹{forecast.current_month_velocity.current_spending.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Days Remaining</p>
                                <p className="text-lg font-bold">{forecast.current_month_velocity.days_remaining}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Projected Total</p>
                                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                    ₹{forecast.current_month_velocity.projected_total.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Trend & Forecast */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <span>🔮</span> Spending Forecast
                            </h3>
                            <span className={`text-sm px-3 py-1 rounded-full ${forecast.trend_direction === 'increasing'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : forecast.trend_direction === 'decreasing'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                {forecast.trend_direction === 'increasing' ? '📈 Trending Up' :
                                    forecast.trend_direction === 'decreasing' ? '📉 Trending Down' : '➡️ Stable'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-medium text-gray-500 uppercase">Historical</p>
                            {forecast.historical.slice(-3).map(h => (
                                <div key={h.billing_month} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                                    <span className="text-sm">{formatBillingMonth(h.billing_month)}</span>
                                    <span className="font-medium">₹{h.total.toLocaleString()}</span>
                                </div>
                            ))}

                            <p className="text-xs font-medium text-gray-500 uppercase mt-4">Forecast</p>
                            {forecast.forecast.map(f => (
                                <div key={f.billing_month} className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-gray-700">
                                    <span className="text-sm text-indigo-600 dark:text-indigo-400">
                                        {formatBillingMonth(f.billing_month)}
                                    </span>
                                    <div className="text-right">
                                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                            ~₹{f.predicted_total.toLocaleString()}
                                        </span>
                                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${f.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {f.confidence}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Anomalies Section */}
            {activeSection === 'anomalies' && anomalies && (
                <div className="space-y-6">
                    <div className={`card p-5 ${anomalies.total_anomalies > 0
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        }`}>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{anomalies.total_anomalies > 0 ? '⚠️' : '✅'}</span>
                            <div>
                                <h3 className="font-semibold">
                                    {anomalies.total_anomalies > 0
                                        ? `${anomalies.total_anomalies} Spending Anomalies Detected`
                                        : 'No Anomalies Detected'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    For {formatBillingMonth(anomalies.billing_month)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {anomalies.category_anomalies.length > 0 && (
                        <div className="card p-5">
                            <h3 className="font-semibold mb-4">📊 Category Anomalies</h3>
                            <div className="space-y-3">
                                {anomalies.category_anomalies.map((anomaly, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{anomaly.category}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(anomaly.severity)}`}>
                                                        {anomaly.severity}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {anomaly.type === 'high' ? 'Higher' : 'Lower'} than usual
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${anomaly.type === 'high' ? 'text-red-600' : 'text-green-600'}`}>
                                                    {anomaly.deviation_percent > 0 ? '+' : ''}{anomaly.deviation_percent}%
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    ₹{anomaly.current_month_spending.toLocaleString()} vs ₹{anomaly.historical_average.toLocaleString()} avg
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {anomalies.expense_outliers.length > 0 && (
                        <div className="card p-5">
                            <h3 className="font-semibold mb-4">📌 Unusual Expenses</h3>
                            <div className="space-y-2">
                                {anomalies.expense_outliers.map(outlier => (
                                    <div key={outlier.expense_id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div>
                                            <p className="font-medium">{outlier.description}</p>
                                            <p className="text-sm text-gray-500">{outlier.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">₹{outlier.amount.toLocaleString()}</p>
                                            <p className="text-xs text-red-500">+{outlier.deviation_from_avg}% above avg</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
