const express = require('express');
const { getGameState, handlePlayerAction } = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware.js');
const router = express.Router();

router.get('/:roomId', authMiddleware, getGameState);
router.post('/:roomId/action', authMiddleware, handlePlayerAction);

module.exports = router;
