const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true }, //room name
    gameType: { type: String, required: true }, // e.g., Texas Hold'em, Omaha
    maxPlayers: { type: Number, default: 6 },
    gameState: { type: mongoose.Schema.Types.ObjectId, ref: 'GameState' },

    //game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    //players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of connected players (referencing the User model)
    /*status: {     // Room status (e.g., waiting, in-game, completed)
        type: String, 
        enum: ['waiting', 'in-game', 'completed'], 
        default: 'waiting' 
    }*/
});

module.exports = mongoose.model('Room', roomSchema);
