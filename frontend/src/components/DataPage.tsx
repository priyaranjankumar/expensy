import React, { useState, useEffect } from 'react';
import { reportsApi, importApi, familyApi } from '../services/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';

type ActiveTab = 'reports' | 'import' | 'family';

interface Family {
    id: number;
    name: string;
    owner_id: number;
    invite_code: string;
    member_count: number;
}

interface FamilyMember {
    id: number;
    user_id: number;
    user_name: string;
    role: string;
    can_view: boolean;
    can_edit: boolean;
}

interface SharedBudget {
    id: number;
    name: string;
    category: string;
    budget_amount: number;
    spent_amount: number;
    billing_month: string;
    progress_percent: number;
    created_by_name: string;
}

const DataPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('reports');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Reports State
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

    // Import State
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'csv' | 'json'>('csv');
    const [importResult, setImportResult] = useState<any>(null);

    // Family State
    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [budgets, setBudgets] = useState<SharedBudget[]>([]);

    // Family Forms
    const [showCreateFamily, setShowCreateFamily] = useState(false);
    const [familyName, setFamilyName] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    // Budget Form
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [newBudget, setNewBudget] = useState({ name: '', amount: '', category: '', month: new Date().toISOString().slice(0, 7) });

    useEffect(() => {
        if (activeTab === 'family') {
            loadFamilies();
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedFamily) {
            loadFamilyDetails(selectedFamily.id);
        }
    }, [selectedFamily]);

    const loadFamilies = async () => {
        try {
            const data = await familyApi.getMyFamilies();
            setFamilies(data);
            if (data.length > 0 && !selectedFamily) {
                setSelectedFamily(data[0]);
            }
        } catch (error) {
            console.error('Failed to load families', error);
        }
    };

    const loadFamilyDetails = async (familyId: number) => {
        setLoading(true);
        try {
            const [membersData, budgetsData] = await Promise.all([
                familyApi.getMembers(familyId),
                familyApi.getBudgets(familyId)
            ]);
            setMembers(membersData);
            setBudgets(budgetsData);
        } catch (error) {
            console.error('Failed to load family details', error);
        } finally {
            setLoading(false);
        }
    };

    // Report Handlers
    const handleViewReport = async () => {
        try {
            const blob = await reportsApi.getMonthlyReport(reportMonth);
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/html' }));
            window.open(url, '_blank');
        } catch (error) {
            console.error('Failed to open report', error);
            setMessage({ type: 'error', text: 'Failed to generate report' });
        }
    };

    // Import Handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImportFile(e.target.files[0]);
            setImportResult(null);
            setMessage(null);
        }
    };

    const handleImport = async () => {
        if (!importFile) return;
        setLoading(true);
        try {
            let result;
            if (importType === 'csv') {
                result = await importApi.importCSV(importFile);
            } else {
                result = await importApi.importJSON(importFile);
            }
            setImportResult(result);
            setMessage({ type: 'success', text: result.message });
            setImportFile(null);
            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (error) {
            setMessage({ type: 'error', text: 'Import failed. Please check the file format.' });
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = async () => {
        try {
            const data = await importApi.getTemplate();
            const blob = new Blob([data.template], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'expenses_template.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download template', error);
        }
    };

    // Family Handlers
    const handleCreateFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newFam = await familyApi.create(familyName);
            setFamilies([...families, newFam]);
            setSelectedFamily(newFam);
            setShowCreateFamily(false);
            setFamilyName('');
            setMessage({ type: 'success', text: 'Family created successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to create family.' });
        }
    };

    const handleJoinFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await familyApi.join(inviteCode);
            setInviteCode('');
            await loadFamilies();
            setMessage({ type: 'success', text: 'Joined family successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Invalid invite code or already a member.' });
        }
    };

    const handleCreateBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFamily) return;
        try {
            await familyApi.createBudget(selectedFamily.id, {
                name: newBudget.name,
                budget_amount: parseFloat(newBudget.amount),
                billing_month: newBudget.month,
                category: newBudget.category
            });
            setShowBudgetModal(false);
            setNewBudget({ ...newBudget, name: '', amount: '' });
            loadFamilyDetails(selectedFamily.id);
            setMessage({ type: 'success', text: 'Shared budget created!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to create budget.' });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-1">
                {[
                    { id: 'reports', label: '📊 Reports', desc: 'Generate PDF reports' },
                    { id: 'import', label: '📥 Import Data', desc: 'CSV/JSON import' },
                    { id: 'family', label: '👨‍👩‍👧‍👦 Family', desc: 'Share budgets' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as ActiveTab)}
                        className={`px-4 py-2 rounded-t-lg transition-colors text-sm font-medium ${activeTab === tab.id
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-500'
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex justify-between items-center ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)}>✕</button>
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Monthly Expense Report</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Generate a detailed printable HTML report for your expenses.
                            Includes category breakdown, paid/unpaid status, and summaries.
                        </p>

                        <div className="space-y-4">
                            <Input
                                type="month"
                                label="Select Month"
                                value={reportMonth}
                                onChange={(e) => setReportMonth(e.target.value)}
                            />

                            <Button
                                onClick={handleViewReport}
                                className="w-full justify-center"
                                leftIcon={<span>📄</span>}
                            >
                                Generate Report
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Import Tab */}
            {activeTab === 'import' && (
                <Card className="p-6 max-w-2xl">
                    <h2 className="text-lg font-semibold mb-4">Import Expenses</h2>

                    <div className="flex gap-4 mb-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="importType"
                                checked={importType === 'csv'}
                                onChange={() => setImportType('csv')}
                                className="text-indigo-600"
                            />
                            <span>CSV File</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="importType"
                                checked={importType === 'json'}
                                onChange={() => setImportType('json')}
                                className="text-indigo-600"
                            />
                            <span>JSON File</span>
                        </label>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center mb-6 hover:border-indigo-400 transition-colors bg-slate-50 dark:bg-slate-900/50">
                        <input
                            type="file"
                            id="file-upload"
                            accept={importType === 'csv' ? '.csv' : '.json'}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                        >
                            <span className="text-4xl">📂</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {importFile ? importFile.name : 'Click to upload file'}
                            </span>
                            <span className="text-xs text-gray-500">
                                {importType === 'csv' ? 'Accepted: .csv' : 'Accepted: .json'}
                            </span>
                        </label>
                    </div>

                    <div className="flex gap-4 justify-between items-center">
                        <Button
                            variant="ghost"
                            onClick={downloadTemplate}
                        >
                            Download CSV Template
                        </Button>

                        <Button
                            onClick={handleImport}
                            disabled={!importFile || loading}
                            isLoading={loading}
                        >
                            Start Import
                        </Button>
                    </div>

                    {importResult && (
                        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border border-slate-200 dark:border-slate-700">
                            <p className="font-medium mb-2">Import Summary:</p>
                            <ul className="space-y-1">
                                <li className="text-green-600 dark:text-green-400">Successfully imported: {importResult.imported_count}</li>
                                {importResult.error_count > 0 && (
                                    <li className="text-red-600 dark:text-red-400">Errors: {importResult.error_count}</li>
                                )}
                            </ul>
                            {importResult.errors?.length > 0 && (
                                <div className="mt-3">
                                    <p className="font-medium text-red-600 dark:text-red-400 mb-1">Error Details:</p>
                                    <ul className="list-disc list-inside text-xs text-red-500 dark:text-red-400 max-h-32 overflow-y-auto">
                                        {importResult.errors.map((err: string, i: number) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            )}

            {/* Family Tab */}
            {activeTab === 'family' && (
                <div className="space-y-6">
                    {/* Family Selector / Create */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex gap-4 items-center flex-1">
                            <select
                                value={selectedFamily?.id || ''}
                                onChange={(e) => {
                                    const fam = families.find(f => f.id === parseInt(e.target.value));
                                    setSelectedFamily(fam || null);
                                }}
                                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            >
                                <option value="">Select Family</option>
                                {families.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>

                            {selectedFamily && (
                                <Badge variant="default" className="text-sm py-1">
                                    Invite Code: <strong className="ml-1 select-all">{selectedFamily.invite_code}</strong>
                                </Badge>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <form onSubmit={handleJoinFamily} className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Enter Invite Code"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="w-40"
                                />
                                <Button type="submit" variant="secondary">
                                    Join
                                </Button>
                            </form>
                            <Button
                                onClick={() => setShowCreateFamily(true)}
                            >
                                + Create Family
                            </Button>
                        </div>
                    </div>

                    {showCreateFamily && (
                        <Card className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800">
                            <form onSubmit={handleCreateFamily} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <Input
                                        label="Family Name"
                                        type="text"
                                        value={familyName}
                                        onChange={(e) => setFamilyName(e.target.value)}
                                        placeholder="e.g., The Smiths"
                                        required
                                    />
                                </div>
                                <Button type="submit">Create</Button>
                                <Button type="button" variant="ghost" onClick={() => setShowCreateFamily(false)}>Cancel</Button>
                            </form>
                        </Card>
                    )}

                    {selectedFamily ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Members Column */}
                            <Card className="p-4 h-fit">
                                <h3 className="font-semibold mb-4 text-slate-700 dark:text-slate-200">Members ({members.length})</h3>
                                <div className="space-y-4">
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                                    {member.user_name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{member.user_name}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Shared Budgets Column */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">Shared Budgets</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowBudgetModal(true)}
                                    >
                                        + New Shared Budget
                                    </Button>
                                </div>

                                {budgets.length === 0 ? (
                                    <Card className="p-12 text-center text-gray-500 border-dashed">
                                        No shared budgets yet. Create one to track expenses together!
                                    </Card>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {budgets.map(budget => (
                                            <Card key={budget.id} className="p-5 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-medium text-lg">{budget.name}</h4>
                                                        <p className="text-xs text-gray-500">{budget.category || 'General'} • {budget.billing_month}</p>
                                                    </div>
                                                    <Badge variant={budget.progress_percent > 100 ? 'danger' : 'success'}>
                                                        {budget.progress_percent}%
                                                    </Badge>
                                                </div>

                                                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                                                    <div
                                                        className={`h-full ${budget.progress_percent > 100 ? 'bg-red-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min(budget.progress_percent, 100)}%` }}
                                                    />
                                                </div>

                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">₹{budget.spent_amount.toLocaleString()}</span>
                                                    <span className="text-gray-500">of ₹{budget.budget_amount.toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-3 text-right">Created by {budget.created_by_name}</p>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Card className="p-12 text-center text-gray-500">
                            Select a family or create one to view details.
                        </Card>
                    )}

                    {/* New Budget Modal */}
                    {showBudgetModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                            <Card className="p-6 w-full max-w-md animate-slide-up">
                                <h3 className="font-semibold mb-4 text-lg">Create Shared Budget</h3>
                                <form onSubmit={handleCreateBudget} className="space-y-4">
                                    <Input
                                        label="Budget Name"
                                        type="text"
                                        value={newBudget.name}
                                        onChange={e => setNewBudget({ ...newBudget, name: e.target.value })}
                                        required
                                        placeholder="e.g. Household Groceries"
                                    />
                                    <Input
                                        label="Amount"
                                        type="number"
                                        value={newBudget.amount}
                                        onChange={e => setNewBudget({ ...newBudget, amount: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Month"
                                        type="month"
                                        value={newBudget.month}
                                        onChange={e => setNewBudget({ ...newBudget, month: e.target.value })}
                                        required
                                    />
                                    <div className="flex justify-end gap-2 mt-6">
                                        <Button type="button" variant="ghost" onClick={() => setShowBudgetModal(false)}>Cancel</Button>
                                        <Button type="submit">Create Budget</Button>
                                    </div>
                                </form>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DataPage;
