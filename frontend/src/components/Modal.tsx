import React from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    children,
    size = 'md',
}) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw] max-h-[90vh]',
    };

    return ReactDOM.createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Container with scroll support and center alignment */}
            <div className="fixed inset-0 z-[101] overflow-y-auto flex justify-center p-4 md:p-8">
                <div
                    className={`w-full ${sizeClasses[size]} bg-white dark:bg-dark-800 rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up my-auto border border-slate-200/50 dark:border-slate-800/80`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || icon) && (
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-dark-600">
                            <div className="flex items-center gap-3">
                                {icon && (
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl shadow-lg shadow-primary-500/30">
                                        {icon}
                                    </div>
                                )}
                                <div>
                                    {title && <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>}
                                    {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[75vh]">
                        {children}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default Modal;
