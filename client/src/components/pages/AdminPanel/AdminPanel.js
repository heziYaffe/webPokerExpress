import React, { useState } from 'react';
import Layout from '../../ui/Layout';
import { api } from '../../../lib/api';
import { usePlayer } from '../../../context/PlayerContext';

const ACTIONS = [
    { key: 'rooms', title: 'Delete all rooms', description: 'Removes every room and its game state. Players at a table will be disconnected.', confirm: 'Delete ALL rooms? This cannot be undone.' },
    { key: 'users', title: 'Delete all non-admin users', description: 'Removes every account except administrators.', confirm: 'Delete ALL non-admin users? This cannot be undone.' },
];

const AdminPanel = () => {
    const { connectedPlayer } = usePlayer();
    const [busy, setBusy] = useState(null);
    const [result, setResult] = useState(null);

    const run = async (action) => {
        if (!window.confirm(action.confirm)) return;
        setBusy(action.key);
        setResult(null);
        try {
            const data = await api(`/api/admin/${action.key}`, { method: 'DELETE' });
            setResult({ ok: true, message: `${data.message} (${data.deletedCount ?? 0} removed)` });
        } catch (err) {
            setResult({ ok: false, message: err.status === 403 ? 'You need the admin role to do this.' : err.message });
        } finally {
            setBusy(null);
        }
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <span className="eyebrow">Administration</span>
                    <h1>Admin panel</h1>
                    <p>Maintenance actions. Only accounts with the <code>admin</code> role can run them.</p>
                </div>
                <span className={`badge ${connectedPlayer?.role === 'admin' ? 'badge-green' : 'badge-red'}`}>
                    <span className="dot" /> {connectedPlayer?.role === 'admin' ? 'Admin' : 'Not an admin'}
                </span>
            </div>

            {result && <div className={`alert ${result.ok ? 'alert-success' : 'alert-error'}`} role="status">{result.message}</div>}

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {ACTIONS.map((a) => (
                    <section key={a.key} className="panel">
                        <h2 style={{ fontSize: '1.15rem' }}>{a.title}</h2>
                        <p className="muted">{a.description}</p>
                        <button className="btn btn-danger" onClick={() => run(a)} disabled={busy !== null}>
                            {busy === a.key ? 'Working…' : a.title}
                        </button>
                    </section>
                ))}
            </div>
        </Layout>
    );
};

export default AdminPanel;
