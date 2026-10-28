import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../../ui/Layout';
import Spinner from '../../ui/Spinner';
import { api } from '../../../lib/api';
import { gameBySlug } from '../../../config';
import './RoomList.css';

const DEFAULT_FORM = { name: '', maxPlayers: 6, buyIn: 100, tableLimit: 1000, smallBlind: 5 };

const validateRoom = (f) => {
    if (!f.name.trim()) return 'Room name is required.';
    if (f.maxPlayers < 2 || f.maxPlayers > 9) return 'Max players must be between 2 and 9.';
    if (Number(f.buyIn) >= Number(f.tableLimit)) return 'Buy-In must be lower than the Table Limit.';
    if (Number(f.smallBlind) > Number(f.buyIn) / 10) return 'Small Blind must be at most 1/10 of the Buy-In.';
    return '';
};

const RoomList = () => {
    const { game } = useParams();
    const meta = gameBySlug(game);
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [joining, setJoining] = useState(null);

    const fetchRooms = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            setRooms(await api(`/api/rooms/${game}`));
        } catch (err) {
            setLoadError(err.message);
        } finally {
            setLoading(false);
        }
    }, [game]);

    useEffect(() => { fetchRooms(); }, [fetchRooms]);

    const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        const problem = validateRoom(form);
        if (problem) return setFormError(problem);
        setSubmitting(true);
        setFormError('');
        try {
            const room = await api('/api/rooms/create', { method: 'POST', body: { ...form, gameType: game } });
            navigate(`/game/${room._id}`);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoinRoom = async (roomId) => {
        setJoining(roomId);
        try {
            await api(`/api/rooms/${roomId}/join`, { method: 'POST' });
            navigate(`/game/${roomId}`);
        } catch (err) {
            setLoadError(err.message);
            setJoining(null);
        }
    };

    return (
        <Layout>
            <nav className="breadcrumbs" aria-label="Breadcrumb">
                <Link to="/lobby">Lobby</Link> <span aria-hidden="true">/</span> <span>{meta?.name || game}</span>
            </nav>
            <div className="page-header">
                <div className="room-hero">
                    {meta && <img src={meta.image} alt="" className="room-hero__img" />}
                    <div>
                        <span className="eyebrow">Rooms</span>
                        <h1>{meta?.name || game}</h1>
                        <p>{meta?.blurb}</p>
                    </div>
                </div>
                <div className="room-toolbar">
                    <button className="btn btn-ghost" onClick={fetchRooms} disabled={loading}>↻ Refresh</button>
                    <button className="btn btn-primary" onClick={() => { setForm(DEFAULT_FORM); setFormError(''); setShowModal(true); }}>+ Create room</button>
                </div>
            </div>

            {loadError && <div className="alert alert-error" role="alert">{loadError}</div>}

            {loading ? (
                <Spinner label="Loading rooms…" />
            ) : rooms.length === 0 ? (
                <div className="panel empty-state">
                    <div className="icon" aria-hidden="true">🃏</div>
                    <h2>No open rooms yet</h2>
                    <p>Be the first — create a room and invite your friends.</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create a room</button>
                </div>
            ) : (
                <ul className="room-list">
                    {rooms.map((room) => {
                        const full = room.playerCount >= room.maxPlayers;
                        return (
                            <li key={room._id} className="room-row panel">
                                <div className="room-row__main">
                                    <h3>{room.name}</h3>
                                    <div className="room-row__meta">
                                        <span>Blinds <strong>{room.smallBlind}/{room.smallBlind * 2}</strong></span>
                                        <span>Buy-in <strong>{room.buyIn}</strong></span>
                                        <span>Limit <strong>{room.tableLimit}</strong></span>
                                    </div>
                                </div>
                                <div className="room-row__seats">
                                    <div className="seat-bar" aria-hidden="true">
                                        <span style={{ width: `${(room.playerCount / room.maxPlayers) * 100}%` }} />
                                    </div>
                                    <span className="muted">{room.playerCount}/{room.maxPlayers} players</span>
                                </div>
                                <span className={`badge ${room.status === 'in-game' ? 'badge-gold' : 'badge-green'}`}>
                                    <span className="dot" />{room.status === 'in-game' ? 'In play' : 'Waiting'}
                                </span>
                                <button className="btn btn-primary" onClick={() => handleJoinRoom(room._id)} disabled={full || joining === room._id}>
                                    {full ? 'Full' : joining === room._id ? 'Joining…' : 'Join'}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {showModal && (
                <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-room-title" onClick={() => setShowModal(false)}>
                    <div className="modal panel" onClick={(e) => e.stopPropagation()}>
                        <h2 id="create-room-title">Create a {meta?.name || ''} room</h2>
                        <p className="muted">Your friends can join from this lobby.</p>
                        {formError && <div className="alert alert-error" role="alert">{formError}</div>}
                        <form onSubmit={handleCreateRoom}>
                            <div className="field">
                                <label htmlFor="room-name">Room name</label>
                                <input id="room-name" className="input" value={form.name} onChange={update('name')} maxLength={40} required autoFocus placeholder="Friday night table" />
                            </div>
                            <div className="form-grid">
                                <div className="field">
                                    <label htmlFor="max-players">Max players</label>
                                    <input id="max-players" className="input" type="number" min="2" max="9" value={form.maxPlayers} onChange={update('maxPlayers')} required />
                                </div>
                                <div className="field">
                                    <label htmlFor="small-blind">Small blind</label>
                                    <input id="small-blind" className="input" type="number" min="1" value={form.smallBlind} onChange={update('smallBlind')} required />
                                </div>
                                <div className="field">
                                    <label htmlFor="buy-in">Buy-in</label>
                                    <input id="buy-in" className="input" type="number" min="1" value={form.buyIn} onChange={update('buyIn')} required />
                                </div>
                                <div className="field">
                                    <label htmlFor="table-limit">Table limit</label>
                                    <input id="table-limit" className="input" type="number" min="1" value={form.tableLimit} onChange={update('tableLimit')} required />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create room'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default RoomList;
