const express = require('express');
const { getGameState } = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../validation');
const router = express.Router();

router.get('/:roomId', authMiddleware, validateObjectIdParam('roomId'), getGameState);

module.exports = router;
