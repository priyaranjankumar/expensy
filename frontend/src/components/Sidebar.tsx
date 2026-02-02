import React from 'react';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    user: any;
    onLogout: () => void;
    setShowProfile: (show: boolean) => void;
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

const MENU_ITEMS = [
    { id: 'expenses', label: 'Dashboard', icon: '📊' },
    { id: 'recurring', label: 'Recurring', icon: '🔄' },
    { id: 'income', label: 'Income', icon: '💰' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'finance', label: 'Finance', icon: '🏦' },
    { id: 'data', label: 'Data & Sharing', icon: '💾' },
    { id: 'organize', label: 'Organize', icon: '📁' },
    { id: 'tags', label: 'Tags', icon: '🏷️' },
];

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    onTabChange,
    user,
    onLogout,
    setShowProfile,
    isCollapsed,
    toggleSidebar
}) => {

    return (
        <aside className={`
            fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
            transition-all duration-300 z-50 flex flex-col
            ${isCollapsed ? 'w-20' : 'w-64'}
        `}>
            {/* Logo Section */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
                {!isCollapsed && (
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-700">
                        Expensy
                    </h1>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                    {isCollapsed ? '➡️' : '⬅️'}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {MENU_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                            ${activeTab === item.id
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                        `}
                        title={isCollapsed ? item.label : undefined}
                    >
                        <span className="text-xl">{item.icon}</span>
                        {!isCollapsed && <span>{item.label}</span>}
                    </button>
                ))}
            </nav>

            {/* User Profile Section */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <div
                    onClick={() => setShowProfile(true)}
                    className={`
                        flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
                >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>

                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <button
                        onClick={onLogout}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                    >
                        <span>🚪</span> Sign Out
                    </button>
                )}
            </div>
        </aside>
    );
};
