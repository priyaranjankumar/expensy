import { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';

interface User {
    id: number;
    username: string;
    name: string;
    monthly_budget: number;
}

interface UserProfileProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onUpdate: (user: User) => void;
    onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, user, onUpdate, onLogout }) => {
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
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile'
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-600'
                            }`}
                    >
                        ✏️ Edit Profile
                    </button>
                    <button
                        onClick={() => { setActiveTab('password'); setMessage(null); }}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'password'
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-600'
                            }`}
                    >
                        🔒 Change Password
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-4 mb-6 rounded-xl ${message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                        }`}>
                        <p className="text-sm">{message.text}</p>
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileUpdate} className="space-y-5">
                        <div>
                            <label className="label" htmlFor="profile-name">
                                😊 Name
                            </label>
                            <input
                                type="text"
                                id="profile-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="profile-budget">
                                💰 Monthly Budget (₹)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">₹</span>
                                <input
                                    type="number"
                                    id="profile-budget"
                                    value={budget || ''}
                                    onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                                    className="input pl-8"
                                    min={0}
                                />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                This is used to calculate your remaining budget
                            </p>
                        </div>

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? 'Saving...' : '✓ Save Changes'}
                        </button>
                    </form>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <form onSubmit={handlePasswordChange} className="space-y-5">
                        <div>
                            <label className="label" htmlFor="current-password">
                                🔑 Current Password
                            </label>
                            <input
                                type="password"
                                id="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="new-password">
                                🔒 New Password
                            </label>
                            <input
                                type="password"
                                id="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input"
                                required
                                minLength={4}
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="confirm-new-password">
                                🔒 Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="confirm-new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? 'Changing...' : '🔒 Change Password'}
                        </button>
                    </form>
                )}

                {/* Logout Button */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-dark-600">
                    <button
                        onClick={onLogout}
                        className="btn w-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default UserProfile;
