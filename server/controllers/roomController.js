const Room = require('../models/Room');
const GameState = require('../models/GameState');
const logger = require('../utils/logger');

// Public view of a room: never include other players' cards.
const toRoomSummary = (room) => ({
    _id: room._id,
    name: room.name,
    gameType: room.gameType,
    manager: room.manager,
    maxPlayers: room.maxPlayers,
    buyIn: room.buyIn,
    tableLimit: room.tableLimit,
    smallBlind: room.smallBlind,
    playerCount: room.gameState?.playerCards?.length ?? 0,
    status: room.gameState?.status ?? 'waiting',
});

// POST /api/rooms/create  (body validated by createRoomSchema)
exports.createRoom = async (req, res) => {
    try {
        const { name, gameType, maxPlayers, buyIn, tableLimit, smallBlind } = req.body;
        const userId = req.userId;

        const newGameState = await GameState.create({
            currentPlayer: 0,
            communityCards: [],
            playerCards: [{ player: userId, cards: [] }],
            pot: 0,
            status: 'waiting',
        });

        const newRoom = await Room.create({
            manager: userId,
            name,
            gameType,
            maxPlayers,
            buyIn,
            tableLimit,
            smallBlind,
            gameState: newGameState._id,
        });

        logger.info(`Room ${newRoom._id} created by ${userId}`);
        res.status(201).json({ ...toRoomSummary({ ...newRoom.toObject(), gameState: newGameState }) });
    } catch (error) {
        logger.error('Error creating room:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// GET /api/rooms/:game — rooms of one game type
exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ gameType: req.params.game }).populate('gameState', 'playerCards.player status').lean();
        res.status(200).json(rooms.map(toRoomSummary));
    } catch (error) {
        logger.error('Error fetching rooms:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// POST /api/rooms/:roomId/join
exports.joinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.userId;

        const room = await Room.findById(roomId).populate('gameState');
        if (!room || !room.gameState) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const isPlayerInRoom = room.gameState.playerCards.some((p) => p.player.toString() === userId);
        if (isPlayerInRoom) {
            // Re-joining is idempotent so a refresh/reconnect does not fail.
            return res.status(200).json(toRoomSummary(room));
        }

        if (room.gameState.playerCards.length >= room.maxPlayers) {
            return res.status(409).json({ message: 'Room is full' });
        }

        room.gameState.playerCards.push({ player: userId, cards: [] });
        await room.gameState.save();

        res.status(200).json(toRoomSummary(room));
    } catch (error) {
        logger.error('Error joining room:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
