import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../../ui/Layout';
import PokerTable from '../../games/PokerTable/PokerTable';
import PlayerPanel from '../../games/PlayerPanel/PlayerPanel';
import ActionsModal from '../../games/ActionsModal/ActionsModal';
import Player from '../../games/Player/Player';
import Card from '../../games/Card/Card';
import { usePlayer } from '../../../context/PlayerContext';
import { getToken } from '../../../lib/auth';
import { WS_URL, gameBySlug } from '../../../config';
import './GamePage.css';

const INITIAL_STATE = { players: [], communityCards: [], pot: 0, chips: 0, toCall: 0, minRaise: 0, stage: -1, currentPlayer: 0, folded: false };

/** Seat coordinates (percent of the table box) around an ellipse, "me" at the bottom. */
const seatPosition = (index, count, myIndex) => {
    const offset = myIndex >= 0 ? index - myIndex : index;
    const angle = Math.PI / 2 + (2 * Math.PI * offset) / Math.max(count, 1);
    return { '--x': `${50 + 50 * Math.cos(angle)}%`, '--y': `${50 + 50 * Math.sin(angle)}%` };
};

const CLOSE_REASONS = {
    4401: 'Your session expired. Please sign in again.',
    4404: 'This room no longer exists.',
    4409: 'This room is full.',
};

const GamePage = () => {
    const navigate = useNavigate();
    const { roomId } = useParams();
    const { connectedPlayer, logout } = usePlayer();

    const [gameState, setGameState] = useState(INITIAL_STATE);
    const [playerCards, setPlayerCards] = useState([]);
    const [manager, setManager] = useState(null);
    const [roomInfo, setRoomInfo] = useState({ name: 'Table', gameType: null });
    const [connection, setConnection] = useState('connecting');
    const [fatal, setFatal] = useState('');
    const [actionRequest, setActionRequest] = useState(null);
    const [result, setResult] = useState(null);
    const [toasts, setToasts] = useState([]);
    const wsRef = useRef(null);

    const toast = useCallback((text, kind = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts((t) => [...t.slice(-3), { id, text, kind }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    }, []);

    const send = useCallback((message) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
        else toast('Not connected to the table', 'error');
    }, [toast]);

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?roomId=${encodeURIComponent(roomId)}&token=${encodeURIComponent(getToken() || '')}`);
        wsRef.current = ws;
        setConnection('connecting');

        ws.onopen = () => setConnection('open');
        ws.onerror = () => setConnection('error');
        ws.onclose = (event) => {
            if (wsRef.current !== ws) return;
            setConnection('closed');
            if (CLOSE_REASONS[event.code]) setFatal(CLOSE_REASONS[event.code]);
            if (event.code === 4401) logout();
        };

        ws.onmessage = (message) => {
            let data;
            try { data = JSON.parse(message.data); } catch { return; }

            switch (data.type) {
                case 'roomManager':
                    setManager(data.manager);
                    if (data.name) setRoomInfo({ name: data.name, gameType: data.gameType });
                    break;
                case 'gameUpdate': if (data.state) setGameState((s) => ({ ...s, ...data.state })); break;
                case 'playerCards': setPlayerCards(data.cards || []); break;
                case 'startGame': setResult(null); break;
                case 'endGame': setPlayerCards([]); setActionRequest(null); break;
                case 'actionRequest': setActionRequest({ lastRaiseAmount: data.lastRaiseAmount, toCall: data.toCall }); break;
                case 'playerActed': toast(`${data.username} ${data.action}`); break;
                case 'error': toast(data.message, 'error'); break;
                case 'winners':
                    setResult({ winners: data.winners || [], names: data.winnerNames || [], hand: data.hand });
                    setTimeout(() => setResult(null), 6000);
                    break;
                default: break; // flop/turn/river arrive via gameUpdate as well
            }
        };

        return () => {
            wsRef.current = null;
            ws.close();
        };
    }, [roomId, logout, toast]);

    const leaveRoom = () => {
        if (!window.confirm('Leave this table?')) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) send({ type: 'leaveRoom' });
        navigate('/lobby');
    };

    const { players, stage, currentPlayer } = gameState;
    const myIndex = players.findIndex((p) => p.userId === connectedPlayer?.id);
    const isManager = manager === connectedPlayer?.id;
    const handInProgress = stage >= 0 && stage < 4;
    const isMyTurn = handInProgress && !gameState.folded && myIndex >= 0 && currentPlayer % players.length === myIndex;
    const iWon = result?.winners.includes(connectedPlayer?.id);

    if (fatal) {
        return (
            <Layout>
                <div className="panel empty-state">
                    <div className="icon" aria-hidden="true">🚪</div>
                    <h2>{fatal}</h2>
                    <Link to="/lobby" className="btn btn-primary">Back to lobby</Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout wide>
            <div className="game-topbar">
                <div>
                    <span className="eyebrow">{gameBySlug(roomInfo.gameType)?.name || "Texas Hold'em"}</span>
                    <h1 className="game-title">{roomInfo.name}</h1>
                </div>
                <div className="game-topbar__actions">
                    <span className={`badge ${connection === 'open' ? 'badge-green' : connection === 'connecting' ? 'badge-gold' : 'badge-red'}`}>
                        <span className="dot" />{connection === 'open' ? 'Live' : connection === 'connecting' ? 'Connecting…' : 'Disconnected'}
                    </span>
                    <span className="badge">{players.length} {players.length === 1 ? 'player' : 'players'}</span>
                    {isManager && !handInProgress && (
                        <button onClick={() => send({ type: 'startGame' })} className="btn btn-primary" disabled={players.length < 2 || connection !== 'open'}
                            title={players.length < 2 ? 'At least 2 players are needed' : 'Deal a new hand'}>
                            Deal hand
                        </button>
                    )}
                    <button onClick={leaveRoom} className="btn btn-ghost">Leave</button>
                </div>
            </div>

            {!handInProgress && players.length < 2 && connection === 'open' && (
                <div className="alert alert-info">Waiting for more players… share this page&apos;s room from the lobby so friends can join.</div>
            )}

            <PokerTable communityCards={gameState.communityCards} pot={gameState.pot} stage={stage}>
                {players.map((p, index) => (
                    <Player
                        key={p.userId}
                        name={p.username}
                        chips={p.chips}
                        bet={p.lastBet}
                        isMe={p.userId === connectedPlayer?.id}
                        isManager={p.userId === manager}
                        isTurn={handInProgress && currentPlayer % players.length === index}
                        style={seatPosition(index, players.length, myIndex)}
                    />
                ))}
            </PokerTable>

            <section className="my-hand panel" aria-label="Your hand">
                <div className="my-hand__cards">
                    {playerCards.length
                        ? playerCards.map((c, i) => <Card key={i} rank={c.rank} suit={c.suit} size="lg" />)
                        : [0, 1].map((i) => <Card key={i} hidden size="lg" />)}
                </div>
                <div className="my-hand__info">
                    <span className="muted">Your stack</span>
                    <strong className="my-hand__chips">{gameState.chips}</strong>
                    <span className="muted">
                        {gameState.folded ? 'Sitting out this hand' : isMyTurn ? 'Your turn' : handInProgress ? 'Waiting for others…' : 'Waiting for the next hand'}
                    </span>
                </div>
                <div className="my-hand__actions">
                    {isMyTurn && !actionRequest ? (
                        <PlayerPanel chips={gameState.chips} toCall={gameState.toCall} minRaise={gameState.minRaise}
                            onAction={(action, raiseAmount = 0) => send({ type: 'playerAction', action, raiseAmount })} />
                    ) : (
                        <span className="muted turn-hint">{handInProgress ? 'Actions unlock on your turn.' : isManager ? 'Press “Deal hand” when everyone is seated.' : 'The room manager deals the next hand.'}</span>
                    )}
                </div>
            </section>

            {actionRequest && (
                <ActionsModal
                    lastRaiseAmount={actionRequest.lastRaiseAmount}
                    toCall={actionRequest.toCall}
                    onActionSelect={(action, raiseAmount = 0) => {
                        setActionRequest(null);
                        send({ type: 'playerActionToRaise', action, raiseAmount });
                    }}
                />
            )}

            {result && (
                <div className={`result-banner ${iWon ? 'result-banner--win' : ''}`} role="status">
                    {iWon ? '🏆 You win the pot!' : `${result.names.join(' & ') || 'Another player'} wins`}
                    {result.hand && <span className="muted"> — {result.hand}</span>}
                </div>
            )}

            <div className="toast-stack" aria-live="polite">
                {toasts.map((t) => <div key={t.id} className={`toast ${t.kind === 'error' ? 'toast-error' : ''}`}>{t.text}</div>)}
            </div>
        </Layout>
    );
};

export default GamePage;
