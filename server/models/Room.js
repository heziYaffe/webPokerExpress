const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gameType: { type: String, required: true }, // e.g., Texas Hold'em, Omaha
    maxPlayers: { type: Number, default: 6 },
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' }
});

module.exports = mongoose.model('Room', roomSchema);
