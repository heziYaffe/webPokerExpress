const GameLogic = require('../controllers/gameLogic');
const Room = require('../models/Room'); // ודא שאתה מייבא את המודל של Room
const GameState = require('../models/GameState'); // ודא שאתה מייבא את המודל של Room


const WebSocket = require('ws');

const { handlePlayerAction } = require('../controllers/gameController');



const rooms = {};  // אובייקט שמנהל את כל החדרים והחיבורים שלהם

const fetchingRoom = async (roomId) => {
    console.log("fetching Room", roomId)

    try {
        // שליפת החדר מהמסד נתונים
        const room = await Room.findById(roomId).populate('gameState');

        if (room) {
            // אם החדר נמצא במסד נתונים
            rooms[roomId] = {
                game: new GameLogic(100, 4, room.buyIn, room.tableLimit), // נניח שאתה צריך להשתמש בערכים מהחדר
                room: room // טעינת החדר ממסד נתונים
            };
            console.log(`Room ${roomId} loaded from database.`);
        } else {
            console.error(`Room ${roomId} not found in database.`);
        }
    } catch (error) {
        console.error(`Error fetching room from database: ${error}`);
    }
};

const addPlayerToRoom = (ws, userId, username, roomId, game) => {

    // בדוק אם השחקן כבר קיים בחדר עם אותו userId
    const existingPlayer = game.players.find(player => player.userId === userId);

    if (existingPlayer) {
        console.log(`Player ${username} (userId: ${userId}) is already connected to room ${roomId}. Replacing old connection.`);

        // סגור את ה-WebSocket הישן
        existingPlayer.ws.close();

        // עדכן את ה-WebSocket של השחקן הקיים לחיבור החדש
        existingPlayer.ws = ws;

        console.log(`Player ${username}'s WebSocket connection replaced in room ${roomId}.`);
    } else {
        // הוסף את השחקן לרשימה אם לא קיים
        game.addPlayer(ws, userId, username);
        console.log(`Player ${username} connected to room ${roomId}. Total players: ${game.players.length}`);
    }
};


const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async (ws, req) => { // הוספת async כאן

        const roomId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('roomId');
        const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');

        const username = extractUsernameFromRequest(token);
        console.log("username", username);

        const userId = extractUserIdFromRequest(token);
        console.log("userId", userId);

        // בדיקה האם החדר קיים או טעינת חדר קיים מהמסד
        if (!rooms[roomId]) {
            await fetchingRoom(roomId);  // שימוש ב-await
        }


        const room = rooms[roomId]?.room; // ודא שהחדר קיים
        if (!room) {
            console.error('Room not found');
            return;
        }      

        console.log(`room`, room);

        const game = rooms[roomId].game;

        addPlayerToRoom(ws, userId, username, roomId, game)
            

        sendGameStateForAllPlayers(roomId);

        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            console.log(`Received message in room ${roomId}:`, data);

            if (data.type === 'startGame' && room.manager === userId) {
                console.log(`Game started in room ${roomId}`);
                game.nextStage();

                // שלח לכל שחקן את הקלפים האישיים שלו
                game.players.forEach(player => {
                    const playerCards = game.getPlayer(player.ws)?.cards || [];
                    player.ws.send(JSON.stringify({
                        type: 'playerCards',
                        cards: playerCards // שליחת הקלפים לשחקן הספציפי
                    }));
                    console.log(`Sent cards to player in room ${roomId}:`, playerCards);
                });
            }

            if (data.type === 'playerAction') {
                console.log(`Player ${data.playerId} in room ${roomId} performed action: ${data.action}`);

                game.setPlayerAction(ws, data.action); // עדכון פעולה של השחקן
                broadcastToRoom(roomId, {type:`player ${ws} ${data.action}` });

                // אם כל השחקנים ביצעו פעולה, מעבר לשלב הבא
                if (game.allPlayersHaveActed()) {
                    const stageData = game.nextStage();
                    if (stageData) {
                        console.log(`Dealing ${stageData.type}, cards ${JSON.stringify(stageData.cards)} in room ${roomId}`);
                        broadcastToRoom(roomId, { type: stageData.type, cards: stageData.cards });
                    } else {
                        console.log("game is over");
                    }
                }

                sendGameStateForAllPlayers(roomId);
            }

            if (data.type === 'leaveRoom') {
                console.log(`Player ${data.playerId} in room ${roomId} Leave`);
                game.leaveRoom(ws)

                try {

                    const room = await Room.findById(roomId).populate('gameState');
                    
                    // עדכון המצב של GameState
                    await GameState.findByIdAndUpdate(room.gameState._id, {
                        $pull: { playerCards: { player: data.playerId }
                    }
                    });

                    console.log(`Player ${data.playerId} removed from room ${roomId}.`);
                    
                } catch (error) {
                    console.error(`Failed to remove player ${data.playerId} from room ${roomId} in DB:`, error);
                }

                sendGameStateForAllPlayers(roomId);
            }

        });

        ws.on('close', async () => {
            console.log(`A client disconnected from room ${roomId}`);
            game.players = game.players.filter(client => client.ws !== ws);


            if (game.players.length === 0) {
                console.log(`Room ${roomId} is now empty. Deleting room.`);
                delete rooms[roomId];
                await Room.findByIdAndDelete(roomId)
            } else {
                console.log(`Player disconnected from room ${roomId}. Players left: ${game.players.length}`);

                // עדכון gameState עם מצב השחקנים החדש
                const playerStates = game.players.map(player => ({
                    player: player.userId,  // שמירת ה-ObjectId של השחקן
                    cards: player.cards.map(card => `${card.rank}${card.suit}`) // ייצוג הקלפים כמחרוזת (e.g., 'KH', 'JD')
                }));

                try {
                    // מצא את ה-GameState הקיים בחדר
                    const room = await Room.findById(roomId).populate('gameState');
                    
                    // עדכון המצב של GameState
                    await GameState.findByIdAndUpdate(room.gameState._id, {
                        currentPlayer: game.currentPlayer,
                        playerCards: playerStates, // שמירת השחקנים הנותרים והקלפים שלהם
                        pot: game.pot,
                        communityCards: game.communityCards.map(card => `${card.rank}${card.suit}`), // ייצוג הקלפים הקהילתיים כמחרוזות
                        status: game.stage === game.SHOWDAWN ? 'completed' : 'in-game' // עדכון הסטטוס
                    });

                    console.log(`Room ${roomId} updated in database with new game state.`);
                } catch (error) {
                    console.error(`Failed to update room ${roomId} in database:`, error);
                }

                sendGameStateForAllPlayers(roomId)
            }
        });
    });
};



const jwt = require('jsonwebtoken');

const extractUsernameFromRequest = (token) => {
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        return decoded.username; // שם המשתמש שנשמר בטוקן
    } catch (err) {
        console.error('Invalid token:', err);
        return null;
    }
}

const extractUserIdFromRequest = (token) => {
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        return decoded.userId; // שם המשתמש שנשמר בטוקן
    } catch (err) {
        console.error('Invalid token:', err);
        return null;
    }
}


const broadcastToRoom = (roomId, message) => {
    console.log(`Broadcasting message to room ${roomId}:`, message);

    if (rooms[roomId]) {
        const game = rooms[roomId].game
    
        if (game.players && game.players.length > 0) {
            game.players.forEach(client => {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify(message));
                }
            });
        } else {
            console.error(`Room ${roomId} does not exist or has no players.`);
        }
    }
};

const sendGameStateForAllPlayers = (roomId) => {
    if (rooms[roomId]) {
        const game = rooms[roomId].game;
        const players = [...game.players, ...game.foldedPlayers]
        if (game.players && game.players.length > 0) {
            // שליחת עדכון לכל שחקן על המצב שלו
            players.forEach(player => {
                const gameState = game.getGameState(player.ws);
                console.log("game state in sendGameStateForAllPlayers", gameState);
                
                player.ws.send(JSON.stringify({
                    type: 'gameUpdate',
                    state: gameState // שליחת המצב של כל שחקן לשחקן הספציפי
                }));
            });
        }
    }
};


module.exports = {
    setupWebSocket,
    broadcastToRoom
};

