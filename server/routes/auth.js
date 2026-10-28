const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login } = require('../controllers/authController');
const { validateBody, credentialsSchema, loginSchema } = require('../validation');
const router = express.Router();

// Basic brute-force protection for the auth endpoints.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === 'test' ? 1000 : 50,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again later.' },
});

router.post('/register', authLimiter, validateBody(credentialsSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);

module.exports = router;
