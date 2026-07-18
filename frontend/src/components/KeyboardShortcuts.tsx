import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';

interface ShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ShortcutItem {
    key: string;
    description: string;
    category: string;
}

const SHORTCUTS: ShortcutItem[] = [
    // Navigation
    { key: '/', category: 'Navigation', description: 'Focus search' },
    { key: 'g e', category: 'Navigation', description: 'Go to Expenses' },
    { key: 'g r', category: 'Navigation', description: 'Go to Recurring' },
    { key: 'g i', category: 'Navigation', description: 'Go to Income' },
    { key: 'g t', category: 'Navigation', description: 'Go to Tags' },
    { key: 'g a', category: 'Navigation', description: 'Go to Analytics' },
    { key: 'g o', category: 'Navigation', description: 'Go to Organize' },

    // Actions
    { key: 'n', category: 'Actions', description: 'New expense' },
    { key: 'Escape', category: 'Actions', description: 'Close modal / Cancel' },
    { key: '?', category: 'Actions', description: 'Show this help' },

    // Selection
    { key: 'Space', category: 'Selection', description: 'Toggle expense selection' },
    { key: 'Ctrl+A', category: 'Selection', description: 'Select all expenses' },

    // Batch Actions
    { key: 'Delete', category: 'Batch Actions', description: 'Delete selected' },
    { key: 'p', category: 'Batch Actions', description: 'Mark selected as paid' },
    { key: 'u', category: 'Batch Actions', description: 'Mark selected as unpaid' },

    // General
    { key: 'Ctrl+/', category: 'General', description: 'Toggle dark mode' },
    { key: 'Ctrl+S', category: 'General', description: 'Save form' },
];

export const KeyboardShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const categories = [...new Set(SHORTCUTS.map(s => s.category))];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="⌨️ Keyboard Shortcuts"
            size="lg"
        >
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories.map(category => (
                        <div key={category}>
                            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{category}</h3>
                            <div className="space-y-1">
                                {SHORTCUTS.filter(s => s.category === category).map(shortcut => (
                                    <div key={shortcut.key} className="flex justify-between items-center py-1">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {shortcut.description}
                                        </span>
                                        <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-xs font-mono">
                                            {shortcut.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-gray-500 mt-6 text-center">
                    Press <kbd className="px-1 bg-gray-100 dark:bg-gray-800 rounded">?</kbd> anytime to show this help
                </p>
            </div>
        </Modal>
    );
};

// Custom hook for keyboard shortcuts
interface KeyboardHandlers {
    onNavigate?: (tab: string) => void;
    onNewExpense?: () => void;
    onSearch?: () => void;
    onToggleDarkMode?: () => void;
    onShowHelp?: () => void;
    onSelectAll?: () => void;
    onDeleteSelected?: () => void;
    onMarkPaid?: () => void;
    onMarkUnpaid?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardHandlers) => {
    const [pendingKey, setPendingKey] = useState<string | null>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in inputs
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            if (e.key === 'Escape') {
                target.blur();
            }
            return;
        }

        // Handle pending 'g' navigation keys
        if (pendingKey === 'g') {
            setPendingKey(null);
            switch (e.key) {
                case 'e': handlers.onNavigate?.('expenses'); break;
                case 'r': handlers.onNavigate?.('recurring'); break;
                case 'i': handlers.onNavigate?.('income'); break;
                case 't': handlers.onNavigate?.('tags'); break;
                case 'a': handlers.onNavigate?.('analytics'); break;
                case 'o': handlers.onNavigate?.('organize'); break;
            }
            return;
        }

        // Start 'g' sequence
        if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
            setPendingKey('g');
            setTimeout(() => setPendingKey(null), 1000); // Reset after 1 second
            return;
        }

        // Single key shortcuts
        switch (e.key) {
            case '/':
                e.preventDefault();
                handlers.onSearch?.();
                break;
            case 'n':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    handlers.onNewExpense?.();
                }
                break;
            case '?':
                e.preventDefault();
                handlers.onShowHelp?.();
                break;
            case 'p':
                if (!e.ctrlKey && !e.metaKey) handlers.onMarkPaid?.();
                break;
            case 'u':
                if (!e.ctrlKey && !e.metaKey) handlers.onMarkUnpaid?.();
                break;
            case 'Delete':
            case 'Backspace':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    handlers.onDeleteSelected?.();
                }
                break;
        }

        // Ctrl/Cmd shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '/':
                    e.preventDefault();
                    handlers.onToggleDarkMode?.();
                    break;
                case 'a':
                    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        handlers.onSelectAll?.();
                    }
                    break;
            }
        }
    }, [pendingKey, handlers]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return { pendingKey };
};

export default KeyboardShortcutsHelp;
