const mongoose = require('mongoose');


const gameStateSchema = new mongoose.Schema({
    currentPlayer: { type: Number, default: 0 }, // Index of current player
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
    },
    maxPlayers: { type: Number, default: 6 }
});

module.exports = mongoose.model('GameState', gameStateSchema);
