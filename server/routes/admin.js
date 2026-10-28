const express = require('express');
const { deleteAllRooms, deleteAllUsersExceptAdmin } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const router = express.Router();

// Every admin route requires a valid token AND the admin role.
router.use(authMiddleware, requireAdmin);

// Delete all rooms
router.delete('/rooms', deleteAllRooms);

// Delete all non-admin users
router.delete('/users', deleteAllUsersExceptAdmin);

module.exports = router;
