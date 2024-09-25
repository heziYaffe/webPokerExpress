const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    manager: { type: String, required: true }, //room manager
    name: { type: String, required: true }, //room name
    gameType: { type: String, required: true }, // e.g., Texas Hold'em, Omaha
    maxPlayers: { type: Number, default: 6 },
    buyIn: { type: Number, default: 100 },
    tableLimit: { type: Number, default: 1000 },
    smallBlind: { type: Number, default: 10 },
    gameState: { type: mongoose.Schema.Types.ObjectId, ref: 'GameState' },
});

module.exports = mongoose.model('Room', roomSchema);
