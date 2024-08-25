const express = require('express');
const { createRoom, getRooms, joinRoom } = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/create', authMiddleware, createRoom);
router.get('/:game', authMiddleware, getRooms);
router.post('/:roomId/join', authMiddleware, joinRoom);

module.exports = router;
