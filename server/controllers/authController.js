const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

// POST /api/auth/register  (body validated by credentialsSchema)
exports.register = async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already taken' });
        }

        const newUser = new User({ username, password });
        await newUser.save();
        logger.info(`New user registered: ${username}`);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        logger.error('Error registering user:', error.message);
        res.status(500).json({ message: 'Error registering user' });
    }
};

// POST /api/auth/login  (body validated by loginSchema)
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        // Same message for unknown user / bad password to avoid user enumeration.
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { userId: user._id.toString(), username: user.username, role: user.role },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn }
        );
        logger.info(`User logged in: ${user.username}`);
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        logger.error('Login error:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
