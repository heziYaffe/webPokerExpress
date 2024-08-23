const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Import JWT for token generation
const User = require('./models/User');

require('dotenv').config({ path: './config/.env' }); // Adjust the path as necessary

const app = express();
const PORT = process.env.PORT || 5003;
const jwtSecret = process.env.JWT_SECRET;


// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

app.use(express.static('public'));
app.use(express.json());

// Registration Route
app.post('/register', async (req, res) => {
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
});

// Login Route
app.post('/login', async (req, res) => {
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
});

// Game Room State Route
app.get('/api/games/:roomId', async (req, res) => {

    const { roomId } = req.params;
    console.log("Received a Game Room State request");

    try {
        //const existingState = await State.findOne({ roomId });
        const existingState = {
            players: [1,2,3],
            communityCards: [4,5,6],
            pot: 500
        }
        if (!existingState) {
            return res.status(400).json({ message: 'Room Dosent Exist' });
        }
        console.log("game room id", roomId);
        console.log("game state fetched successfully");
        // Send the game state back to the client
        res.status(200).json({ 
            players: existingState.players,
            communityCards: existingState.communityCards,
            pot: existingState.pot
        });
    
    } catch (error) {
        console.error('Error Fetching Game State:', error);
        res.status(500).json({ message: 'Error Fetching Game State' });
    }
});

// Game Room State Route
app.post('/api/games/:roomId/action', async (req, res) => {
    const { roomId } = req.params;
    const { action, playerId } = req.body;
    console.log("Received action from Game Room State request:", action);

    try {

        // Process the player's action
        switch (action) {
            case 'Fold':
                console.log(playerId + " play fold")
                // Handle the fold action (e.g., remove player from active players)
                //existingState.players = existingState.players.filter(player => player.id !== playerId);
                break;
            case 'Check':
                console.log(playerId + " play Check")
                // Handle the check action (no change to game state)
                break;
            case 'Raise':
                console.log(playerId + " play Raise")
                // Handle the raise action (e.g., add chips to the pot)
                //const raisingPlayer = existingState.players.find(player => player.id === playerId);
                //if (raisingPlayer) {
                    const raiseAmount = 100; // Example amount
                    //raisingPlayer.chips -= raiseAmount;
                    //existingState.pot += raiseAmount;
                //}
                break;
            default:
                return res.status(400).json({ message: 'Invalid action' });
        }

        console.log("game room id", roomId);
        console.log("game state updated successfully");

        // Send the updated game state back to the client
        res.status(200).json({ 
            players: [1,2,3],//existingState.players,
            communityCards: [4,5,6],//existingState.communityCards,
            pot: 600//existingState.pot
        });
    
    } catch (error) {
        console.error('Error Processing Game Action:', error);
        res.status(500).json({ message: 'Error Processing Game Action' });
    }
});


// Start the Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
