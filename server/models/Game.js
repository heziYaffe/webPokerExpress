const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    communityCards: [Number],
    pot: { type: Number, default: 0 },
    status: { type: String, default: 'waiting' }, // e.g., waiting, in-progress, finished
});

module.exports = mongoose.model('Game', gameSchema);
