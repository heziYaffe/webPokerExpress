const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const GameLogic = require('../controllers/gameLogic');
const Room = require('../models/Room');
const GameState = require('../models/GameState');
const config = require('../config');
const logger = require('../utils/logger');
const { wsMessageSchema } = require('../validation');

// Close codes (4000-4999 are application-defined).
const CLOSE_UNAUTHORIZED = 4401;
const CLOSE_NOT_FOUND = 4404;
const CLOSE_ROOM_FULL = 4409;

const RAISE_RESPONSE_TIMEOUT_MS = 30000;
// Empty rooms are deleted after a grace period so a page refresh does not destroy the room.
const EMPTY_ROOM_GRACE_MS = Number(process.env.EMPTY_ROOM_GRACE_MS) || 30000;

const rooms = {}; // roomId -> { game, room }

const send = (ws, message) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
};

const parseMessage = (raw) => {
    try {
        const result = wsMessageSchema.safeParse(JSON.parse(raw));
        return result.success ? result.data : null;
    } catch {
        return null;
    }
};

/** Verifies the JWT; returns { userId, username } or null. */
const authenticate = (token) => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        return { userId: decoded.userId, username: decoded.username };
    } catch {
        return null;
    }
};

const loadRoom = async (roomId) => {
    if (rooms[roomId]) return rooms[roomId];
    const room = await Room.findById(roomId).populate('gameState');
    if (!room) return null;
    // Another connection may have loaded it while we were awaiting.
    if (!rooms[roomId]) {
        rooms[roomId] = {
            game: new GameLogic(room.smallBlind || 10, room.maxPlayers || 6, room.buyIn, room.tableLimit),
            room,
        };
        logger.debug(`Room ${roomId} loaded from database`);
    }
    return rooms[roomId];
};

const addPlayerToRoom = (ws, userId, username, game) => {
    const existing = [...game.players, ...game.foldedPlayers].find((p) => p.userId === userId);
    if (existing) {
        // Reconnect: replace the old socket.
        const old = existing.ws;
        existing.ws = ws;
        if (old !== ws) old.close();
        return { player: existing };
    }
    return game.addPlayer(ws, userId, username);
};

const broadcastToRoom = (roomId, message) => {
    const entry = rooms[roomId];
    if (!entry) return;
    [...entry.game.players, ...entry.game.foldedPlayers].forEach((p) => send(p.ws, message));
};

const sendGameStateForAllPlayers = (roomId) => {
    const entry = rooms[roomId];
    if (!entry) return;
    const { game } = entry;
    [...game.players, ...game.foldedPlayers].forEach((player) => {
        const state = game.getGameState(player.ws);
        if (state) send(player.ws, { type: 'gameUpdate', state });
    });
};

const sendRoomManagerForAllPlayers = (roomId) => {
    const entry = rooms[roomId];
    if (!entry) return;
    broadcastToRoom(roomId, { type: 'roomManager', manager: entry.room.manager, name: entry.room.name, gameType: entry.room.gameType });
};

/** Waits for a `playerActionToRaise` reply from one player, folding them on timeout. */
const waitForPlayerAction = (player, timeLimit) => new Promise((resolve) => {
    const onMessage = (raw) => {
        const data = parseMessage(raw);
        if (data && data.type === 'playerActionToRaise') {
            cleanup();
            resolve({ action: data.action, player, raiseAmount: data.raiseAmount });
        }
    };
    const onClose = () => { cleanup(); resolve({ action: 'Fold', player }); };
    const timer = setTimeout(() => {
        logger.debug(`Player ${player.username} did not respond in time, folding`);
        cleanup();
        resolve({ action: 'Fold', player });
    }, timeLimit);
    const cleanup = () => {
        clearTimeout(timer);
        player.ws.off('message', onMessage);
        player.ws.off('close', onClose);
    };
    player.ws.on('message', onMessage);
    player.ws.on('close', onClose);
});

/** After a raise, every other active player must call, re-raise or fold. */
const handleRaise = async (raiserWs, game, roomId) => {
    let raiserId = game.players.find((p) => p.ws === raiserWs)?.userId;
    let raiseHappened = true;

    while (raiseHappened && game.players.length > 1) {
        raiseHappened = false;
        for (const player of [...game.players]) {
            if (player.userId === raiserId || !game.players.includes(player)) continue;

            send(player.ws, { type: 'actionRequest', lastRaiseAmount: game.lastRaiseAmount, toCall: game.roundBet - player.lastBet });
            sendGameStateForAllPlayers(roomId);

            const { action, raiseAmount } = await waitForPlayerAction(player, RAISE_RESPONSE_TIMEOUT_MS);
            let result = game.setPlayerAction(player.ws, action, raiseAmount);
            if (result.error) {
                // Invalid re-raise: treat as a call so the hand keeps moving.
                send(player.ws, { type: 'error', message: result.error });
                result = game.setPlayerAction(player.ws, 'Call');
            }

            if (result.type === 'raised') {
                raiserId = player.userId;
                raiseHappened = true;
                break;
            }
        }
        sendGameStateForAllPlayers(roomId);
    }
};

const broadcastStage = (roomId, stageData) => {
    if (!stageData) return;
    if (stageData.type === 'showdown') {
        broadcastToRoom(roomId, {
            type: 'winners',
            winners: stageData.winners,
            winnerNames: stageData.winnerNames,
            hand: stageData.hand,
        });
    } else if (stageData.cards) {
        broadcastToRoom(roomId, { type: stageData.type, cards: stageData.cards });
    }
};

const persistRoomState = async (roomId, game) => {
    try {
        const room = await Room.findById(roomId);
        if (!room) return;
        await GameState.findByIdAndUpdate(room.gameState, {
            currentPlayer: game.currentPlayer,
            playerCards: [...game.players, ...game.foldedPlayers].map((p) => ({ player: p.userId, cards: [] })),
            pot: game.pot,
            communityCards: game.communityCards.map((card) => `${card.rank}${card.suit}`),
            status: game.stage === game.WAITING ? 'waiting' : 'in-game',
        });
    } catch (error) {
        logger.error(`Failed to persist room ${roomId}:`, error.message);
    }
};

const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ server, maxPayload: 4 * 1024 });

    wss.on('connection', async (ws, req) => {
        const params = new URL(req.url, 'http://localhost').searchParams;
        const roomId = params.get('roomId');
        const identity = authenticate(params.get('token'));

        if (!identity) return ws.close(CLOSE_UNAUTHORIZED, 'Unauthorized');
        if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) return ws.close(CLOSE_NOT_FOUND, 'Room not found');

        const { userId, username } = identity;

        let entry;
        try {
            entry = await loadRoom(roomId);
        } catch (error) {
            logger.error(`Error loading room ${roomId}:`, error.message);
        }
        if (!entry) return ws.close(CLOSE_NOT_FOUND, 'Room not found');

        const { game, room } = entry;
        if (entry.deleteTimer) {
            clearTimeout(entry.deleteTimer);
            entry.deleteTimer = null;
        }
        const added = addPlayerToRoom(ws, userId, username, game);
        if (added.error) return ws.close(CLOSE_ROOM_FULL, added.error);

        logger.debug(`${username} connected to room ${roomId}`);
        sendGameStateForAllPlayers(roomId);
        sendRoomManagerForAllPlayers(roomId);

        ws.on('message', async (raw) => {
            const data = parseMessage(raw);
            if (!data) return send(ws, { type: 'error', message: 'Invalid message' });

            if (data.type === 'startGame') {
                if (room.manager !== userId) return send(ws, { type: 'error', message: 'Only the room manager can start the game' });
                const result = game.nextStage();
                if (result && result.error) return send(ws, { type: 'error', message: result.error });

                broadcastToRoom(roomId, { type: 'startGame' });
                game.players.forEach((player) => send(player.ws, { type: 'playerCards', cards: player.cards }));
                sendGameStateForAllPlayers(roomId);
                return;
            }

            if (data.type === 'playerAction') {
                const result = game.setPlayerAction(ws, data.action, data.raiseAmount, { enforceTurn: true });
                if (result.error) {
                    send(ws, { type: 'error', message: result.error });
                    return sendGameStateForAllPlayers(roomId);
                }
                broadcastToRoom(roomId, { type: 'playerActed', username, action: result.type });

                const lastStanding = game.awardIfLastStanding();
                if (lastStanding) {
                    broadcastStage(roomId, lastStanding);
                } else {
                    if (result.type === 'raised') await handleRaise(ws, game, roomId);

                    const handOver = game.awardIfLastStanding();
                    if (handOver) broadcastStage(roomId, handOver);
                    else if (result.type === 'raised' || game.allPlayersHaveActed()) broadcastStage(roomId, game.nextStage());
                }

                if (game.getStage() === game.WAITING) broadcastToRoom(roomId, { type: 'endGame' });
                sendGameStateForAllPlayers(roomId);
                persistRoomState(roomId, game);
                return;
            }

            if (data.type === 'leaveRoom') {
                game.leaveRoom(ws);
                // The leaving user is always the authenticated one (never trust a client-sent id).
                await GameState.findByIdAndUpdate(room.gameState?._id, { $pull: { playerCards: { player: userId } } })
                    .catch((error) => logger.error('Failed to remove player from DB:', error.message));
                sendGameStateForAllPlayers(roomId);
            }
            // playerActionToRaise is consumed by waitForPlayerAction.
        });

        ws.on('close', async () => {
            const stillHere = [...game.players, ...game.foldedPlayers].some((p) => p.ws === ws);
            if (!stillHere && game.players.length + game.foldedPlayers.length > 0) return; // replaced by a reconnect

            game.leaveRoom(ws);
            logger.debug(`${username} disconnected from room ${roomId}`);

            if (game.players.length + game.foldedPlayers.length === 0) {
                entry.deleteTimer = setTimeout(async () => {
                    if (rooms[roomId] !== entry || game.players.length + game.foldedPlayers.length > 0) return;
                    delete rooms[roomId];
                    try {
                        const doc = await Room.findByIdAndDelete(roomId);
                        if (doc?.gameState) await GameState.findByIdAndDelete(doc.gameState);
                        logger.debug(`Empty room ${roomId} deleted`);
                    } catch (error) {
                        logger.error(`Failed to delete empty room ${roomId}:`, error.message);
                    }
                }, EMPTY_ROOM_GRACE_MS);
                entry.deleteTimer.unref?.();
                return;
            }

            const handOver = game.awardIfLastStanding();
            if (handOver) {
                broadcastStage(roomId, handOver);
                broadcastToRoom(roomId, { type: 'endGame' });
            }
            await persistRoomState(roomId, game);
            sendGameStateForAllPlayers(roomId);
        });
    });

    return wss;
};

module.exports = {
    setupWebSocket,
    broadcastToRoom,
};
