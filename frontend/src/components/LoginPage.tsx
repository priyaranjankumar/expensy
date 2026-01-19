import { useState } from 'react';
import api from '../services/api';

interface AuthPageProps {
    onLogin: (token: string, user: any) => void;
    onSwitchToSignup: () => void;
}

const LoginPage: React.FC<AuthPageProps> = ({ onLogin, onSwitchToSignup }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { username, password });
            const data = response.data;
            onLogin(data.access_token, data.user);
        } catch (err: any) {
            console.error('Login error:', err);
            const message = err.response?.data?.detail || err.message || 'Login failed. Please try again.';
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
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Track your monthly expenses with ease</p>
                </div>

                {/* Login Card */}
                <div className="card p-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Welcome Back</h2>

                    {error && (
                        <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label" htmlFor="username">
                                👤 Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className="input"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="label" htmlFor="password">
                                🔒 Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="input"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full !py-3" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="animate-spin">⏳</span> Signing in...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Don't have an account?{' '}
                            <button
                                onClick={onSwitchToSignup}
                                className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                            >
                                Sign up
                            </button>
                        </p>
                    </div>

                    {/* Demo credentials hint */}
                    <div className="mt-6 p-4 bg-slate-50 dark:bg-dark-700 rounded-xl">
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                            <span className="font-semibold">Demo Account:</span> demo / demo123
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
