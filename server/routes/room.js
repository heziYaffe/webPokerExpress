const express = require('express');
const { createRoom, getRooms, joinRoom } = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateBody, validateObjectIdParam, createRoomSchema } = require('../validation');
const router = express.Router();

router.use(authMiddleware);

router.post('/create', validateBody(createRoomSchema), createRoom);
router.get('/:game', getRooms);
router.post('/:roomId/join', validateObjectIdParam('roomId'), joinRoom);

module.exports = router;
