import React from 'react';
import Modal from './Modal';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Keyboard Shortcuts"
            subtitle="Navigate faster with these shortcuts"
            icon="⌨️"
            size="sm"
        >
            <div className="p-6">
                <div className="space-y-3">
                    {KEYBOARD_SHORTCUTS.map(({ key, description }) => (
                        <div
                            key={key}
                            className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-dark-700 last:border-0"
                        >
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                {description}
                            </span>
                            <kbd className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-dark-700 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-dark-600 shadow-sm">
                                {key}
                            </kbd>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        Press <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-dark-700 rounded">?</kbd> anytime to show this help
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default KeyboardShortcutsHelp;
