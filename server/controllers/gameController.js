const Game = require('../models/Game');
const GameState = require('../models/GameState');
const mongoose = require('mongoose');
const Room = require('../models/Room');
const ObjectId = mongoose.Types.ObjectId;


const { broadcastToRoom } = require('../websockets/gameSockets')



exports.getGameState = async (req, res) => {
    // Fetch game state from DB and return to client
    const { roomId } = req.params;
    console.log("Received a Game Room State request from room", roomId);

    try {

        const existingState = await Room.findOne({ _id: new ObjectId(String(roomId)) }).populate('gameState');

        if (!existingState) {
            return res.status(400).json({ message: 'Room Dosent Exist' });
        }
        console.log("game state fetched successfully: ", existingState.gameState);

        // Send the game state back to the client
        res.status(200).json({ 
            players: existingState.gameState.playerCards,
            communityCards: existingState.gameState.communityCards,
            pot: existingState.gameState.pot,
            status: existingState.gameState.status,
            currentPlayer: existingState.gameState.currentPlayer,
        });
    
    } catch (error) {
        console.error('Error Fetching Game State:', error);
        res.status(500).json({ message: 'Error Fetching Game State' });
    }
};

exports.handlePlayerAction = async (req, res) => {
    // Handle player action and update game state
    const { roomId } = req.params;
    const { action, playerId, currentPlayer } = req.body;

    const existingState = await Room.findOne({ _id: new ObjectId(String(roomId)) }).populate('gameState');

    console.log("existingState:", existingState)

    if (!existingState) {
        return res.status(400).json({ message: 'Room Dosent Exist' });
    }

    //console.log("Received action from Game Room State request:", action);

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

        existingState.gameState.currentPlayer = (currentPlayer + 1) //% existingState.gameState.playerCards.length;

        console.log("existingState after changeing currentPlayer ", existingState)
        // Save the updated game state back to the database
        try {
            await existingState.gameState.save();
            console.log("Game state saved successfully");
        } catch (e) {
            console.log("cant save the new state")
        }


        const updatedGameState = {
            players: existingState.gameState.playerCards,
            communityCards: existingState.gameState.communityCards,
            pot: existingState.gameState.pot,
            currentPlayer:  existingState.gameState.currentPlayer,
        };

        console.log("updatedGameState: ", updatedGameState)

        broadcastToRoom(roomId, {type: "update"});

        // Send the updated game state back to the client
        res.status(200).json(updatedGameState);
    
    } catch (error) {
        console.error('Error Processing Game Action:', error);
        res.status(500).json({ message: 'Error Processing Game Action' });
    }
};