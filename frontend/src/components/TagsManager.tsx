import React, { useState, useEffect } from 'react';
import { Tag as TagIcon, Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { tagsApi } from '../services/api';
import type { Tag, TagCreate } from '../types';
import Modal from './Modal';

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
        <div className={`card p-6 card-hover ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {onClose && (
                        <button 
                            onClick={onClose} 
                            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-200"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                            <TagIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Tags Manager</h2>
                    </div>
                </div>
                <button 
                    onClick={openNewModal} 
                    className="btn btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" /> New Tag
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="animate-pulse grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[1, 2, 4].map(i => (
                        <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800/80 rounded-2xl"></div>
                    ))}
                </div>
            ) : tags.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl p-6">
                    <TagIcon className="w-10 h-10 mx-auto mb-3.5 text-slate-300 dark:text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No Tags Yet</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Create tags to organize and categorize your transactions</p>
                    <button onClick={openNewModal} className="btn btn-primary text-xs py-2">
                        Create Your First Tag
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {tags.map(tag => (
                        <div
                            key={tag.id}
                            className="group relative p-3 rounded-2xl border border-slate-200 dark:border-slate-800/85 hover:border-slate-300 dark:hover:border-slate-700/60 hover:shadow-md dark:bg-slate-900/30 transition-all flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2 min-w-0 pr-6">
                                <div
                                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 flex-shrink-0"
                                    style={{ backgroundColor: tag.color }}
                                />
                                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 truncate">{tag.name}</span>
                            </div>
                            <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={() => handleEdit(tag)}
                                    className="p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                    title="Edit"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => handleDelete(tag.id)}
                                    className="p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                    title="Delete"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingTag ? '✏️ Edit Tag' : '🏷️ Create Tag'}
                size="sm"
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="input text-sm"
                            placeholder="e.g., Essential, Business"
                            required
                            maxLength={50}
                        />
                    </div>
                    <div>
                        <label className="label mb-2">Color</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {presetColors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-7 h-7 rounded-full transition-transform hover:scale-115 ${
                                        formData.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900' : ''
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
                                className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                            />
                            <input
                                type="text"
                                value={formData.color}
                                onChange={e => setFormData({ ...formData, color: e.target.value })}
                                className="input text-xs font-mono"
                                placeholder="#6366f1"
                                pattern="^#[0-9a-fA-F]{6}$"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-3">
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)} 
                            className="btn btn-secondary flex-1 py-2.5 text-xs"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary flex-1 py-2.5 text-xs"
                        >
                            {editingTag ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TagsManager;
