const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './config/.env' }); // Adjust the path as necessary
const jwtSecret = process.env.JWT_SECRET || 'your_secret_key';

exports.register = async (req, res) => {
    console.log("Received a registration request");
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        const newUser = new User({ username, password });
        await newUser.save();
        console.log("New user registered successfully:", newUser);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    console.log("username:", username);
    console.log("password:", password);

    try {
        const user = await User.findOne({ username });
        console.log("user", user)
        if (!user) {
            return res.status(401).json({ message: "Login failed: Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Login failed: Invalid username or password" });
        }

        const token = jwt.sign({ userId: user._id, username: user.username}, jwtSecret || 'your_secret_key', { expiresIn: '1h' });
        console.log("User authenticated successfully");
        res.status(200).json({ message: "Login successful", token: token});
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};
