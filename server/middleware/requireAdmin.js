const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Must run after authMiddleware. The role is read from the database (not from the
 * JWT) so that demoting a user takes effect immediately.
 */
module.exports = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select('role').lean();
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin role required' });
        }
        next();
    } catch (error) {
        logger.error('requireAdmin failed:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
