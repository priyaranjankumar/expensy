import { useState } from 'react';
import api from '../services/api';

interface SignupPageProps {
    onSignup: (token: string, user: any) => void;
    onSwitchToLogin: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignup, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        monthly_budget: 50000,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'monthly_budget' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/signup', {
                username: formData.username,
                password: formData.password,
                name: formData.name,
                monthly_budget: formData.monthly_budget,
            });

            const data = response.data;
            onSignup(data.access_token, data.user);
        } catch (err: any) {
            console.error('Signup error:', err);
            const message = err.response?.data?.detail || err.message || 'Signup failed. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-3xl shadow-2xl shadow-primary-500/30 mb-4">
                        💰
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Expense Tracker</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Create your account to get started</p>
                </div>

                {/* Signup Card */}
                <div className="card p-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Create Account</h2>

                    {error && (
                        <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label" htmlFor="name">
                                😊 Your Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your name"
                                className="input"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="username">
                                👤 Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Choose a username"
                                className="input"
                                required
                                minLength={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label" htmlFor="password">
                                    🔒 Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Password"
                                    className="input"
                                    required
                                    minLength={4}
                                />
                            </div>
                            <div>
                                <label className="label" htmlFor="confirmPassword">
                                    🔒 Confirm
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm"
                                    className="input"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label" htmlFor="monthly_budget">
                                💰 Monthly Budget (₹)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">₹</span>
                                <input
                                    type="number"
                                    id="monthly_budget"
                                    name="monthly_budget"
                                    value={formData.monthly_budget || ''}
                                    onChange={handleChange}
                                    placeholder="50000"
                                    className="input pl-8"
                                    min={0}
                                />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                You can change this later in your profile
                            </p>
                        </div>

                        <button type="submit" className="btn btn-primary w-full !py-3" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="animate-spin">⏳</span> Creating account...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Already have an account?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
