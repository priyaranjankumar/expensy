import React from 'react';

interface QuickAddWidgetProps {
    onOpenModal: () => void;
    className?: string;
}

const QuickAddWidget: React.FC<QuickAddWidgetProps> = ({
    onOpenModal,
    className = ''
}) => {
    return (
        <button
            onClick={onOpenModal}
            className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-40 ${className}`}
            aria-label="Add Expense"
        >
            <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
            </svg>
        </button>
    );
};

export default QuickAddWidget;
