import React, { useState, useEffect } from 'react';
import { payeesApi, subcategoriesApi, groupsApi } from '../services/api';
import type { Payee, PayeeCreate, SubCategoryCreate, ExpenseGroup, ExpenseGroupCreate, CategoryHierarchy } from '../types';

type ActiveTab = 'payees' | 'subcategories' | 'groups';

interface OrganizationPageProps {
    className?: string;
}

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

const OrganizationPage: React.FC<OrganizationPageProps> = ({ className = '' }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('payees');
    const [loading, setLoading] = useState(false);

    // Payees state
    const [payees, setPayees] = useState<Payee[]>([]);
    const [showPayeeModal, setShowPayeeModal] = useState(false);
    const [editingPayee, setEditingPayee] = useState<Payee | null>(null);
    const [payeeForm, setPayeeForm] = useState<PayeeCreate>({ name: '', category: '', notes: '' });

    // SubCategories state
    const [hierarchy, setHierarchy] = useState<CategoryHierarchy[]>([]);
    const [showSubCatModal, setShowSubCatModal] = useState(false);
    const [subCatForm, setSubCatForm] = useState<SubCategoryCreate>({ parent_category: '', name: '', description: '' });

    // Groups state
    const [groups, setGroups] = useState<ExpenseGroup[]>([]);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ExpenseGroup | null>(null);
    const [groupForm, setGroupForm] = useState<ExpenseGroupCreate>({ name: '', description: '', color: '#6366f1' });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'payees') {
                const data = await payeesApi.getAll();
                setPayees(data);
            } else if (activeTab === 'subcategories') {
                const data = await subcategoriesApi.getHierarchy();
                setHierarchy(data);
            } else if (activeTab === 'groups') {
                const data = await groupsApi.getAll();
                setGroups(data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Payee handlers
    const handlePayeeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPayee) {
                await payeesApi.update(editingPayee.id, payeeForm);
            } else {
                await payeesApi.create(payeeForm);
            }
            setShowPayeeModal(false);
            setEditingPayee(null);
            setPayeeForm({ name: '', category: '', notes: '' });
            loadData();
        } catch (error) {
            console.error('Failed to save payee:', error);
        }
    };

    const handleDeletePayee = async (id: number) => {
        if (!confirm('Delete this payee?')) return;
        await payeesApi.delete(id);
        loadData();
    };

    // SubCategory handlers
    const handleSubCatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subCatForm.parent_category || !subCatForm.name) return;
        try {
            await subcategoriesApi.create(subCatForm);
            setShowSubCatModal(false);
            setSubCatForm({ parent_category: '', name: '', description: '' });
            loadData();
        } catch (error) {
            console.error('Failed to create sub-category:', error);
        }
    };

    const handleDeleteSubCat = async (id: number) => {
        if (!confirm('Delete this sub-category?')) return;
        await subcategoriesApi.delete(id);
        loadData();
    };

    // Group handlers
    const handleGroupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingGroup) {
                await groupsApi.update(editingGroup.id, groupForm);
            } else {
                await groupsApi.create(groupForm);
            }
            setShowGroupModal(false);
            setEditingGroup(null);
            setGroupForm({ name: '', description: '', color: '#6366f1' });
            loadData();
        } catch (error) {
            console.error('Failed to save group:', error);
        }
    };

    const handleDeleteGroup = async (id: number) => {
        if (!confirm('Delete this group? Expenses will be unlinked but not deleted.')) return;
        await groupsApi.delete(id);
        loadData();
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Tab Navigation */}
            <div className="flex gap-2">
                {[
                    { id: 'payees', label: '🏪 Payees', icon: '🏪' },
                    { id: 'subcategories', label: '📂 Sub-Categories', icon: '📂' },
                    { id: 'groups', label: '📦 Expense Groups', icon: '📦' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as ActiveTab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="card p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
            )}

            {/* Payees Tab */}
            {!loading && activeTab === 'payees' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Manage Payees</h2>
                        <button
                            onClick={() => {
                                setEditingPayee(null);
                                setPayeeForm({ name: '', category: '', notes: '' });
                                setShowPayeeModal(true);
                            }}
                            className="btn btn-primary"
                        >
                            + Add Payee
                        </button>
                    </div>

                    {payees.length === 0 ? (
                        <div className="card p-8 text-center text-gray-500">
                            No payees yet. Add your first vendor or merchant!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {payees.map(payee => (
                                <div key={payee.id} className="card p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium">{payee.name}</h3>
                                            {payee.category && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                    {payee.category}
                                                </span>
                                            )}
                                            {payee.notes && (
                                                <p className="text-sm text-gray-500 mt-1">{payee.notes}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingPayee(payee);
                                                    setPayeeForm({ name: payee.name, category: payee.category || '', notes: payee.notes || '' });
                                                    setShowPayeeModal(true);
                                                }}
                                                className="text-gray-400 hover:text-blue-500"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeletePayee(payee.id)}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SubCategories Tab */}
            {!loading && activeTab === 'subcategories' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Category Hierarchy</h2>
                        <button
                            onClick={() => {
                                setSubCatForm({ parent_category: '', name: '', description: '' });
                                setShowSubCatModal(true);
                            }}
                            className="btn btn-primary"
                        >
                            + Add Sub-Category
                        </button>
                    </div>

                    {hierarchy.length === 0 ? (
                        <div className="card p-8 text-center text-gray-500">
                            No categories with sub-categories yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {hierarchy.map(cat => (
                                <div key={cat.category} className="card p-4">
                                    <h3 className="font-semibold text-lg mb-2">{cat.category}</h3>
                                    {cat.subcategories.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No sub-categories</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {cat.subcategories.map(sub => (
                                                <div
                                                    key={sub.id}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800"
                                                >
                                                    <span>{sub.name}</span>
                                                    <button
                                                        onClick={() => handleDeleteSubCat(sub.id)}
                                                        className="text-gray-400 hover:text-red-500 text-sm"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Groups Tab */}
            {!loading && activeTab === 'groups' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Expense Groups</h2>
                        <button
                            onClick={() => {
                                setEditingGroup(null);
                                setGroupForm({ name: '', description: '', color: '#6366f1' });
                                setShowGroupModal(true);
                            }}
                            className="btn btn-primary"
                        >
                            + Create Group
                        </button>
                    </div>

                    {groups.length === 0 ? (
                        <div className="card p-8 text-center text-gray-500">
                            No expense groups yet. Create one to organize related expenses!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groups.map(group => (
                                <div key={group.id} className="card p-4 border-l-4" style={{ borderLeftColor: group.color }}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium">{group.name}</h3>
                                            {group.description && (
                                                <p className="text-sm text-gray-500">{group.description}</p>
                                            )}
                                            <div className="flex gap-4 mt-2 text-sm">
                                                <span>{group.expense_count} expenses</span>
                                                <span className="font-medium">₹{group.total_amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingGroup(group);
                                                    setGroupForm({ name: group.name, description: group.description || '', color: group.color });
                                                    setShowGroupModal(true);
                                                }}
                                                className="text-gray-400 hover:text-blue-500"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGroup(group.id)}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Payee Modal */}
            {showPayeeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingPayee ? 'Edit Payee' : 'Add Payee'}
                        </h3>
                        <form onSubmit={handlePayeeSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={payeeForm.name}
                                    onChange={e => setPayeeForm({ ...payeeForm, name: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Default Category</label>
                                <input
                                    type="text"
                                    value={payeeForm.category}
                                    onChange={e => setPayeeForm({ ...payeeForm, category: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    value={payeeForm.notes}
                                    onChange={e => setPayeeForm({ ...payeeForm, notes: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    rows={2}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowPayeeModal(false)} className="btn">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SubCategory Modal */}
            {showSubCatModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Add Sub-Category</h3>
                        <form onSubmit={handleSubCatSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Parent Category *</label>
                                <input
                                    type="text"
                                    value={subCatForm.parent_category}
                                    onChange={e => setSubCatForm({ ...subCatForm, parent_category: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    required
                                    placeholder="e.g., Food, Transportation"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Sub-Category Name *</label>
                                <input
                                    type="text"
                                    value={subCatForm.name}
                                    onChange={e => setSubCatForm({ ...subCatForm, name: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    required
                                    placeholder="e.g., Groceries, Gas"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <input
                                    type="text"
                                    value={subCatForm.description}
                                    onChange={e => setSubCatForm({ ...subCatForm, description: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowSubCatModal(false)} className="btn">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Group Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingGroup ? 'Edit Group' : 'Create Group'}
                        </h3>
                        <form onSubmit={handleGroupSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={groupForm.name}
                                    onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    required
                                    placeholder="e.g., Vacation Trip, Home Renovation"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <input
                                    type="text"
                                    value={groupForm.description}
                                    onChange={e => setGroupForm({ ...groupForm, description: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setGroupForm({ ...groupForm, color })}
                                            className={`w-8 h-8 rounded-full ${groupForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowGroupModal(false)} className="btn">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationPage;
