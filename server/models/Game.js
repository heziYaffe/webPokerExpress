/*const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    communityCards: [Number],
    pot: { type: Number, default: 0 },
    status: { type: String, default: 'waiting' }, // e.g., waiting, in-progress, finished
});

module.exports = mongoose.model('Game', gameSchema);

const gameStateSchema = new mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    currentTurn: { type: Number, default: 0 }, // Index of current player
    communityCards: [{ type: String }], // e.g., ['2H', '3D', '5S']
    playerCards: [{
        player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        cards: [{ type: String }] // e.g., ['KH', 'JD']
    }],
    pot: { type: Number, default: 0 },
    status: {     // game status (e.g., waiting, in-game, completed)
        type: String, 
        enum: ['waiting', 'in-game', 'completed'], 
        default: 'waiting' 
    }
});*/