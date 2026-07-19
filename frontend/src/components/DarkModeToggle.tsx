import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface DarkModeToggleProps {
    className?: string;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ className = '' }) => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme');
            if (stored) return stored === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 hover:scale-105 active:scale-[0.95] focus:outline-none ${
                isDark
                    ? 'bg-slate-900/60 text-yellow-500 hover:bg-slate-800/60 border border-slate-800/50'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            } ${className}`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {isDark ? (
                <Sun className="w-4.5 h-4.5 animate-fade-in" />
            ) : (
                <Moon className="w-4.5 h-4.5 animate-fade-in" />
            )}
        </button>
    );
};

export default DarkModeToggle;
