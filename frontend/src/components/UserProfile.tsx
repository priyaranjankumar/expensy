import { useState } from 'react';
import { Lock, LogOut, Check } from 'lucide-react';
import Modal from './Modal';
import api from '../services/api';
import type { User } from '../types';

interface UserProfileProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onUpdate: (user: User) => void;
    onLogout: () => void;
    layoutPreference: 'standard' | 'wide';
    onLayoutPreferenceChange: (pref: 'standard' | 'wide') => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
    isOpen, 
    onClose, 
    user, 
    onUpdate, 
    onLogout,
    layoutPreference,
    onLayoutPreferenceChange
}) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Profile form
    const [name, setName] = useState(user.name);
    const [budget, setBudget] = useState(user.monthly_budget);

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            const response = await api.put('/auth/me', { name, monthly_budget: budget });
            const updatedUser = response.data;
            onUpdate(updatedUser);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: any) {
            console.error('Update profile error:', err);
            setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 4) {
            setMessage({ type: 'error', text: 'Password must be at least 4 characters' });
            return;
        }

        setLoading(true);

        try {
            await api.put('/auth/password', {
                current_password: currentPassword,
                new_password: newPassword,
            });

            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            console.error('Password change error:', err);
            setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Profile Settings"
            subtitle={`@${user.username}`}
            icon="👤"
            size="md"
        >
            <div className="p-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => { setActiveTab('profile'); setMessage(null); }}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                            activeTab === 'profile'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        👤 Edit Profile
                    </button>
                    <button
                        onClick={() => { setActiveTab('password'); setMessage(null); }}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                            activeTab === 'password'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        🔑 Change Password
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-4 mb-6 rounded-xl border ${
                        message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/20 text-green-600 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/20 text-red-650 dark:text-red-400'
                    }`}>
                        <p className="text-xs font-medium">{message.text}</p>
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileUpdate} className="space-y-5">
                        <div>
                            <label className="label" htmlFor="profile-name">
                                Name
                            </label>
                            <input
                                type="text"
                                id="profile-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="profile-budget">
                                Monthly Budget (₹)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">₹</span>
                                <input
                                    type="number"
                                    id="profile-budget"
                                    value={budget || ''}
                                    onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                                    className="input pl-8 text-sm font-mono"
                                    min={0}
                                />
                            </div>
                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1.5 ml-1">
                                Used to calculate your remaining monthly allocation limit
                            </p>
                        </div>

                        <div>
                            <label className="label">
                                Desktop Layout Width
                            </label>
                            <div className="grid grid-cols-2 gap-3 mt-1.5">
                                <button
                                    type="button"
                                    onClick={() => onLayoutPreferenceChange('standard')}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                                        layoutPreference === 'standard'
                                            ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-500/50 text-indigo-650 dark:text-indigo-400'
                                            : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    Standard (Centered)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onLayoutPreferenceChange('wide')}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                                        layoutPreference === 'wide'
                                            ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-500/50 text-indigo-650 dark:text-indigo-400'
                                            : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    Wide (Full Width)
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5" 
                            disabled={loading}
                        >
                            <Check className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <form onSubmit={handlePasswordChange} className="space-y-5">
                        <div>
                            <label className="label" htmlFor="current-password">
                                Current Password
                            </label>
                            <input
                                type="password"
                                id="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="input text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="new-password">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input text-sm"
                                required
                                minLength={4}
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="confirm-new-password">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="confirm-new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input text-sm"
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5" 
                            disabled={loading}
                        >
                            <Lock className="w-4 h-4" /> {loading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                )}

                {/* Logout Button */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                        onClick={onLogout}
                        className="btn w-full bg-red-50 hover:bg-red-500 dark:bg-red-950/15 dark:hover:bg-red-900/30 text-red-500 hover:text-white border border-red-200/20 dark:border-red-900/20 transition-all font-bold text-xs"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default UserProfile;
