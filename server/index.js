const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const WebSocket = require('ws');
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

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


// Array to store connected clients
const clients = [];

wss.on('connection', (ws) => {
    console.log('A new client connected');
    clients.push(ws);

    ws.on('message', (message) => {
        console.log('Received message:', message);

        // Broadcast the message to all connected clients
        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('A client disconnected');
        clients.splice(clients.indexOf(ws), 1);
    });
});





// Start the Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
