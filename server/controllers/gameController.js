const Room = require('../models/Room');
const logger = require('../utils/logger');

// GET /api/games/:roomId — public table info (no hole cards).
exports.getGameState = async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId).populate('gameState');
        if (!room || !room.gameState) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.status(200).json({
            players: room.gameState.playerCards.map((p) => ({ userId: p.player })),
            communityCards: room.gameState.communityCards,
            pot: room.gameState.pot,
            status: room.gameState.status,
            currentPlayer: room.gameState.currentPlayer,
        });
    } catch (error) {
        logger.error('Error fetching game state:', error.message);
        res.status(500).json({ message: 'Error fetching game state' });
    }
};
