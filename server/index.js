const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { setupWebSocket } = require('./websockets/gameSockets');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const roomRoutes = require('./routes/room');


require('dotenv').config({ path: './config/.env' }); // Adjust the path as necessary

const app = express();
const PORT = process.env.PORT || 5003;

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

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/rooms', roomRoutes);

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket
setupWebSocket(server);

// Start the Server
server.listen(PORT, () => { // Use server.listen instead of app.listen
    console.log(`Server running on port ${PORT}`);
});
