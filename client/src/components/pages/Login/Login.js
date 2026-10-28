import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { api } from '../../../lib/api';
import { usePlayer } from '../../../context/PlayerContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login } = usePlayer();
    const justRegistered = location.state?.registered;

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await api('/api/auth/login', { method: 'POST', body: { username, password } });
            login(data.token);
            navigate(location.state?.from || '/lobby', { replace: true });
        } catch (err) {
            setError(err.status === 401 ? 'Invalid username or password.' : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to join a table."
            footer={<>Don&apos;t have an account? <Link to="/register">Create one</Link></>}
        >
            {justRegistered && <div className="alert alert-success">Account created — you can sign in now.</div>}
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <form onSubmit={handleLogin} noValidate={false}>
                <div className="field">
                    <label htmlFor="username">Username</label>
                    <input id="username" className="input" type="text" autoComplete="username" value={username}
                        onChange={(e) => setUsername(e.target.value)} required autoFocus />
                </div>
                <div className="field">
                    <label htmlFor="password">Password</label>
                    <input id="password" className="input" type="password" autoComplete="current-password" value={password}
                        onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </AuthLayout>
    );
};

export default Login;
