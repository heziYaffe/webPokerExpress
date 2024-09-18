const express = require('express');
const { deleteAllRooms, deleteAllUsersExceptAdmin } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware.js');
const router = express.Router();

// מחיקת כל החדרים
router.delete('/rooms', authMiddleware, deleteAllRooms);

// מחיקת כל המשתמשים
router.delete('/users', authMiddleware, deleteAllUsersExceptAdmin);

module.exports = router;
