import React from 'react';
import {
    LayoutDashboard,
    RefreshCw,
    Coins,
    LineChart,
    Wallet,
    HardDrive,
    FolderOpen,
    Tag,
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    user: any;
    onLogout: () => void;
    setShowProfile: (show: boolean) => void;
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const MENU_ITEMS: MenuItem[] = [
    { id: 'expenses', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'recurring', label: 'Recurring', icon: RefreshCw },
    { id: 'income', label: 'Income', icon: Coins },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'finance', label: 'Finance', icon: Wallet },
    { id: 'data', label: 'Data & Sharing', icon: HardDrive },
    { id: 'organize', label: 'Organize', icon: FolderOpen },
    { id: 'tags', label: 'Tags', icon: Tag },
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
            fixed left-0 top-0 h-screen bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-xl border-r border-slate-200/40 dark:border-slate-800/40
            transition-all duration-300 z-50 flex flex-col
            ${isCollapsed ? 'w-20' : 'w-64'}
        `}>
            {/* Collapsible Trigger */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3.5 top-8 p-1.5 rounded-full bg-white dark:bg-[#0f172a] border border-slate-200/60 dark:border-slate-800/60 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-[0.95] z-50"
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Logo Section */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800/60">
                {!isCollapsed ? (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
                            E
                        </div>
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">
                            Expensy<span className="text-indigo-500 font-extrabold">.</span>
                        </h1>
                    </div>
                ) : (
                    <div className="w-full flex justify-center">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
                            E
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
                {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`
                                w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold tracking-wide transition-all group relative
                                ${isActive
                                    ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/5 text-indigo-600 dark:text-indigo-400 border-l-[3px] border-indigo-600 dark:border-indigo-400 pl-3'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'}
                            `}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                            {!isCollapsed && <span>{item.label}</span>}
                            
                            {isActive && (
                                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500/80 animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* User Profile Section */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/20">
                <div
                    onClick={() => setShowProfile(true)}
                    className={`
                        flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/30 hover:shadow-sm transition-all
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
                >
                    <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-80 blur-[1px]" />
                        <div className="relative w-9 h-9 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold border-2 border-white dark:border-slate-900 shadow-inner">
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                    </div>

                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate leading-snug">{user?.full_name}</p>
                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">{user?.email}</p>
                        </div>
                    )}
                </div>

                {!isCollapsed ? (
                    <button
                        onClick={onLogout}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 dark:bg-red-950/10 dark:hover:bg-red-900/20 rounded-xl transition-all hover:shadow-sm"
                    >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                ) : (
                    <button
                        onClick={onLogout}
                        className="mt-3 w-full flex items-center justify-center p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50/50 dark:bg-red-950/10 rounded-xl transition-all"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </div>
        </aside>
    );
};
