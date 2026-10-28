import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../Login/AuthLayout';
import { api } from '../../../lib/api';

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validate = () => {
        if (!USERNAME_RE.test(username)) return 'Username must be 3–20 characters: letters, digits, ".", "_" or "-".';
        if (password.length < 8) return 'Password must be at least 8 characters.';
        if (password !== confirm) return 'Passwords do not match.';
        return '';
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const problem = validate();
        if (problem) return setError(problem);

        setLoading(true);
        setError('');
        try {
            await api('/api/auth/register', { method: 'POST', body: { username, password } });
            navigate('/login', { state: { registered: true } });
        } catch (err) {
            setError(err.status === 409 ? 'This username is already taken. Please choose another one.' : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="It takes 10 seconds. Play money only."
            footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
        >
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <form onSubmit={handleRegister}>
                <div className="field">
                    <label htmlFor="username">Username</label>
                    <input id="username" className="input" type="text" autoComplete="username" value={username}
                        onChange={(e) => setUsername(e.target.value)} required autoFocus />
                    <span className="hint">3–20 characters: letters, digits, “.”, “_”, “-”.</span>
                </div>
                <div className="field">
                    <label htmlFor="password">Password</label>
                    <input id="password" className="input" type="password" autoComplete="new-password" value={password}
                        onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                    <span className="hint">At least 8 characters.</span>
                </div>
                <div className="field">
                    <label htmlFor="confirm">Confirm password</label>
                    <input id="confirm" className="input" type="password" autoComplete="new-password" value={confirm}
                        onChange={(e) => setConfirm(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                    {loading ? 'Creating account…' : 'Create account'}
                </button>
            </form>
        </AuthLayout>
    );
};

export default Register;
