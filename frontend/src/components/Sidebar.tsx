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
    ChevronRight
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
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
        </aside>
    );
};
