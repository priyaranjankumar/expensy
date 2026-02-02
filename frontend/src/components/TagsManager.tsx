import React, { useState, useEffect } from 'react';
import { tagsApi } from '../services/api';
import type { Tag, TagCreate } from '../types';

interface TagsManagerProps {
    className?: string;
    onClose?: () => void;
}

const TagsManager: React.FC<TagsManagerProps> = ({ className = '', onClose }) => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [formData, setFormData] = useState<TagCreate>({ name: '', color: '#6366f1' });

    const presetColors = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
        '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'
    ];

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            setLoading(true);
            const data = await tagsApi.getAll();
            setTags(data);
        } catch (error) {
            console.error('Failed to load tags:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTag) {
                await tagsApi.update(editingTag.id, formData);
            } else {
                await tagsApi.create(formData);
            }
            setShowModal(false);
            setEditingTag(null);
            setFormData({ name: '', color: '#6366f1' });
            loadTags();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to save tag');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this tag? It will be removed from all expenses.')) return;
        try {
            await tagsApi.delete(id);
            loadTags();
        } catch (error) {
            console.error('Failed to delete tag:', error);
        }
    };

    const handleEdit = (tag: Tag) => {
        setEditingTag(tag);
        setFormData({ name: tag.name, color: tag.color });
        setShowModal(true);
    };

    const openNewModal = () => {
        setEditingTag(null);
        setFormData({ name: '', color: '#6366f1' });
        setShowModal(true);
    };

    return (
        <div className={`card p-5 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tags</h2>
                    </div>
                </div>
                <button onClick={openNewModal} className="btn-primary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Tag
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    ))}
                </div>
            ) : tags.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Tags Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Create tags to organize your expenses</p>
                    <button onClick={openNewModal} className="btn-primary">
                        Create Your First Tag
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {tags.map(tag => (
                        <div
                            key={tag.id}
                            className="group relative p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-gray-800"
                                    style={{ backgroundColor: tag.color }}
                                />
                                <span className="font-medium text-sm truncate">{tag.name}</span>
                            </div>
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={() => handleEdit(tag)}
                                    className="p-1 bg-white dark:bg-gray-800 rounded shadow text-indigo-600 hover:text-indigo-800"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(tag.id)}
                                    className="p-1 bg-white dark:bg-gray-800 rounded shadow text-red-600 hover:text-red-800"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl scale-100 transition-transform" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">
                            {editingTag ? 'Edit Tag' : 'Create Tag'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="e.g., Essential, Business"
                                    required
                                    maxLength={50}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Color</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {presetColors.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color })}
                                            className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="w-10 h-10 rounded-xl cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="flex-1 px-5 py-2.5 rounded-3xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="#6366f1"
                                        pattern="^#[0-9a-fA-F]{6}$"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-3xl font-medium hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all">
                                    {editingTag ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagsManager;
