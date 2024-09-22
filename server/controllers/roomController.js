const Room = require('../models/Room');
const GameState = require('../models/GameState');

exports.createRoom = async (req, res) => {
    //console.log("createRoom call")
    try {
        const {name, gameType, maxPlayers, buyIn, tableLimit, smallBlind } = req.body;
        // Validate the required fields
        if (!name || !gameType) {
            return res.status(400).json({ message: 'Name and game type are required' });
        }

        // Now you can access the userId from the middleware
        const userId = req.userId;
        console.log("Creating room with userId:", userId);


        // Create a new GameState for the room
        const newGameState = new GameState({
            currentPlayer: 0,
            communityCards: [],
            playerCards: [{ player: userId, cards: [] }], // Add the creator with empty cards
            pot: 0,
            status: 'waiting'
        });

        // Save the game state to the database
        await newGameState.save();

        // Create a new room
        const newRoom = new Room({
            manager: userId,
            name,
            gameType,
            maxPlayers,
            buyIn,
            tableLimit,
            smallBlind,
            gameState: newGameState._id, // Link the room with its game state
        });

        // Save the room to the database
        await newRoom.save();

        console.log("newRoom: ", newRoom)
        //console.log("newGameState: ", newGameState)

        // Send the created room back to the client
        res.status(201).json(newRoom);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getRooms = async (req, res) => {
    try {
        // Find all rooms in the database
        const rooms = await Room.find().populate('gameState');

        // Send the rooms back to the client
        res.status(200).json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getRoom = async (req, res) => {
    try {
        // מציאת החדר לפי roomId
        const room = await Room.findById(req.params.roomId).populate('gameState');

        // בדיקה אם החדר נמצא
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // שליחת החדר חזרה ללקוח
        res.status(200).json(room);
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



exports.joinRoom = async (req, res) => {
    /*try {
        const { roomId } = req.params;
        const userId = req.userId;

        // Find the room by ID
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if the room is full
        if (room.players.length >= room.maxPlayers) {
            return res.status(400).json({ message: 'Room is full' });
        }

        console.log("room: ", room)
        console.log("room.players: ", room.players)
        console.log("room.players[0]._id: ", room.players[0]._id)
        console.log("userId ", userId)

        // Check if the player is already in the room
        const isPlayerInRoom = room.players.some(player => player._id.toString() === userId);

        if (isPlayerInRoom) {
            return res.status(400).json({ message: 'Player is already in the room' });
        }

        // Add the player to the room
        room.players.push(userId);

        // Save the updated room to the database
        await room.save();

        // Send the updated room back to the client
        res.status(200).json(room);
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
        */

    try {
        const { roomId } = req.params;
        const userId = req.userId;

        // Find the room by ID and populate its game state
        const room = await Room.findById(roomId).populate('gameState');

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if the room is full
        if (room.gameState.playerCards.length >= room.maxPlayers) {
            return res.status(400).json({ message: 'Room is full' });
        }

        // Check if the player is already in the room
        const isPlayerInRoom = room.gameState.playerCards.some(player => player.player.toString() === userId);

        if (isPlayerInRoom) {
            console.log('Player is already in the room')
            return res.status(400).json({ message: 'Player is already in the room' });
        }

        // Add the player to the room's game state
        room.gameState.playerCards.push({ player: userId, cards: [] });

        // Save the updated game state
        await room.gameState.save();

        // Send the updated room back to the client
        res.status(200).json(room);
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

