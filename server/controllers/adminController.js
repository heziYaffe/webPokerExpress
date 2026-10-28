const Room = require('../models/Room');
const GameState = require('../models/GameState');
const User = require('../models/User');
const logger = require('../utils/logger');

// DELETE /api/admin/rooms — removes every room and its game state.
const deleteAllRooms = async (req, res) => {
    try {
        const { deletedCount } = await Room.deleteMany({});
        await GameState.deleteMany({});
        logger.info(`Admin ${req.userId} deleted ${deletedCount} rooms`);
        return res.status(200).json({ message: 'All rooms deleted.', deletedCount });
    } catch (error) {
        logger.error('Error deleting rooms:', error.message);
        return res.status(500).json({ message: 'Error deleting rooms' });
    }
};

// DELETE /api/admin/users — removes every user whose role is not "admin".
const deleteAllUsersExceptAdmin = async (req, res) => {
    try {
        const { deletedCount } = await User.deleteMany({ role: { $ne: 'admin' } });
        logger.info(`Admin ${req.userId} deleted ${deletedCount} users`);
        return res.status(200).json({ message: 'All users except admins deleted.', deletedCount });
    } catch (error) {
        logger.error('Error deleting users:', error.message);
        return res.status(500).json({ message: 'Error deleting users' });
    }
};

module.exports = {
    deleteAllRooms,
    deleteAllUsersExceptAdmin,
};
