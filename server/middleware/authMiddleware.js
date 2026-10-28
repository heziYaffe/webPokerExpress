const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

/**
 * Verifies the `Authorization: Bearer <jwt>` header and attaches
 * req.userId / req.username to the request.
 */
module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided or invalid token format' });
    }

    const token = authHeader.slice('Bearer '.length);

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Failed to authenticate token' });
    }
};
