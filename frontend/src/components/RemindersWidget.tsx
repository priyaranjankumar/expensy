import React, { useState, useEffect } from 'react';
import { remindersApi } from '../services/api';
import type { RemindersResponse, ExpenseReminder, ReminderCount } from '../types';

interface RemindersWidgetProps {
    className?: string;
    onExpenseClick?: (expenseId: number) => void;
}

const RemindersWidget: React.FC<RemindersWidgetProps> = ({ className = '', onExpenseClick }) => {
    const [reminders, setReminders] = useState<RemindersResponse | null>(null);
    const [count, setCount] = useState<ReminderCount | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadReminders();
    }, []);

    const loadReminders = async () => {
        try {
            setLoading(true);
            const [remindersData, countData] = await Promise.all([
                remindersApi.getAll(7),
                remindersApi.getCount()
            ]);
            setReminders(remindersData);
            setCount(countData);
        } catch (error) {
            console.error('Failed to load reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDueDate = (_dueDate: string, daysUntilDue: number) => {
        if (daysUntilDue === 0) return 'Today';
        if (daysUntilDue === 1) return 'Tomorrow';
        if (daysUntilDue === -1) return 'Yesterday';
        if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} days overdue`;
        return `In ${daysUntilDue} days`;
    };

    const ReminderItem: React.FC<{ reminder: ExpenseReminder }> = ({ reminder }) => (
        <div
            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${reminder.is_overdue
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}
            onClick={() => onExpenseClick?.(reminder.expense_id)}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{reminder.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{reminder.category}</p>
                </div>
                <div className="text-right ml-2">
                    <p className="font-semibold text-sm">₹{reminder.amount.toLocaleString()}</p>
                    <p className={`text-xs font-medium ${reminder.is_overdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                        {formatDueDate(reminder.due_date, reminder.days_until_due)}
                    </p>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className={`card p-4 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3"></div>
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    const totalPending = count?.total_pending || 0;
    const hasReminders = totalPending > 0;

    return (
        <div className={`card p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Reminders</h3>
                    {hasReminders && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {totalPending}
                        </span>
                    )}
                </div>
                {hasReminders && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        {expanded ? 'Show less' : 'Show all'}
                    </button>
                )}
            </div>

            {/* Content */}
            {!hasReminders ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <svg className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">All caught up! No pending payments.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Overdue Section */}
                    {reminders?.overdue && reminders.overdue.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1 uppercase">
                                Overdue ({reminders.overdue.length})
                            </p>
                            <div className="space-y-2">
                                {(expanded ? reminders.overdue : reminders.overdue.slice(0, 2)).map(r => (
                                    <ReminderItem key={r.expense_id} reminder={r} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Section */}
                    {reminders?.upcoming && reminders.upcoming.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 uppercase">
                                Due Soon ({reminders.upcoming.length})
                            </p>
                            <div className="space-y-2">
                                {(expanded ? reminders.upcoming : reminders.upcoming.slice(0, 2)).map(r => (
                                    <ReminderItem key={r.expense_id} reminder={r} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Total Overdue Amount */}
                    {reminders?.total_overdue_amount && reminders.total_overdue_amount > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Total Overdue:</span>
                                <span className="font-bold text-red-600 dark:text-red-400">
                                    ₹{reminders.total_overdue_amount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RemindersWidget;
