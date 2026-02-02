import { useEffect, useCallback } from 'react';

interface KeyboardShortcutHandlers {
    onNewExpense?: () => void;
    onFocusSearch?: () => void;
    onCloseModal?: () => void;
    onShowHelp?: () => void;
    onExport?: () => void;
    isModalOpen?: boolean;
}

/**
 * Custom hook for global keyboard shortcuts.
 * 
 * Shortcuts:
 * - N: New expense (when no modal is open)
 * - F or /: Focus search
 * - Escape: Close current modal
 * - ?: Show keyboard shortcuts help
 * - E: Export (when no modal is open)
 */
export function useKeyboardShortcuts({
    onNewExpense,
    onFocusSearch,
    onCloseModal,
    onShowHelp,
    onExport,
    isModalOpen = false,
}: KeyboardShortcutHandlers) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in inputs
        const target = event.target as HTMLElement;
        const isInputFocused =
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable;

        // Escape always works (even in inputs)
        if (event.key === 'Escape') {
            if (onCloseModal) {
                event.preventDefault();
                onCloseModal();
            }
            return;
        }

        // Don't process other shortcuts if typing in input
        if (isInputFocused) return;

        // Don't process shortcuts when a modifier key is pressed (except for ?)
        if (event.metaKey || event.ctrlKey || event.altKey) return;

        switch (event.key.toLowerCase()) {
            case 'n':
                if (!isModalOpen && onNewExpense) {
                    event.preventDefault();
                    onNewExpense();
                }
                break;
            case 'f':
            case '/':
                if (!isModalOpen && onFocusSearch) {
                    event.preventDefault();
                    onFocusSearch();
                }
                break;
            case '?':
                if (!isModalOpen && onShowHelp) {
                    event.preventDefault();
                    onShowHelp();
                }
                break;
            case 'e':
                if (!isModalOpen && onExport) {
                    event.preventDefault();
                    onExport();
                }
                break;
        }
    }, [onNewExpense, onFocusSearch, onCloseModal, onShowHelp, onExport, isModalOpen]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

// Shortcut descriptions for help modal
export const KEYBOARD_SHORTCUTS = [
    { key: 'N', description: 'Add new expense' },
    { key: 'F or /', description: 'Focus search' },
    { key: 'E', description: 'Export data' },
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'Esc', description: 'Close modal' },
] as const;
