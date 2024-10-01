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
        console.log("in game sockets")
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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForPlayerAction = (player, timeLimit) => {
    console.log("wait for player action")
    return new Promise((resolve) => {
        
        // הגדרת השהיית זמן
        const timer = setTimeout(() => {
            console.log(`Player ${player.userId} did not respond in time, forcing fold.`);
            resolve({ action: 'fold', player }); // פעולה אוטומטית - "fold"
        }, timeLimit);
        

        // האזנה לפעולה מהשחקן
        player.ws.once('message', (message) => {
            const data = JSON.parse(message);
            if (data.type === 'playerActionToRaise') {
                console.log("get message with type playerActionToRaise")
                clearTimeout(timer); // ביטול הטיימר אם השחקן פעל בזמן
                resolve({ action: data.action, player, raiseAmount: data.raiseAmount });
            }
        });
        

    });
};


const handleRaise = async(ws, game, roomId) => {
    console.log("starting raise round...");
    let raiseHappened = true;

    // נמשיך לשאול את השחקנים עד שלא יקרה רירייז נוסף
    while (raiseHappened) {
        raiseHappened = false;

        // עוברים על כל השחקנים
        for (let i = 0; i < game.players.length; i++) {
            const player = game.players[i];

            // דילוג על השחקן שביצע את ה-raise הנוכחי
            if (player.ws === ws) {
                continue;
            }

            // שולחים לשחקן בקשה לפעולה עם הסכום החדש של ה-raise
            player.ws.send(JSON.stringify({
                type: 'actionRequest',
                lastRaiseAmount: game.lastRaiseAmount // סכום ההעלאה החדש שיש להשוות
            }));

            sendGameStateForAllPlayers(roomId);

            // ממתינים לפעולה מהשחקן או לפקיעת הזמן
            const { action, player: actingPlayer, raiseAmount } = await Promise.race([
                waitForPlayerAction(player, 30000), // מגבלת זמן של 30 שניות
            ]);

            console.log(`Player ${actingPlayer.userId} chose to ${action}`);

            // מבצעים את הפעולה של השחקן (check, fold, call, raise)
            const result = game.setPlayerAction(actingPlayer.ws, action, raiseAmount);

            // אם שחקן עשה raise נוסף, מפסיקים את הלולאה ומתחילים מחדש
            if (result.raiseAmount) {
                ws = actingPlayer.ws;
                console.log(`Player ${actingPlayer.userId} did a re-raise`);
                raiseHappened = true;
                break; // יוצאים מהלולאה כדי להתחיל שוב עם הסכום החדש של ה-raise
            }
        }

        // שליחת עדכון לכל השחקנים לאחר סיבוב
        sendGameStateForAllPlayers(roomId);
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
        sendRoomManagerForAllPlayers(roomId)

        ws.on('message', async (message) => { // Remove extra parenthesis here
            const data = JSON.parse(message);
            console.log(`Received message in room ${roomId}:`, data);
        
            if (data.type === 'startGame' && room.manager === userId) {
                console.log(`Game started in room ${roomId}`);
                game.nextStage();
        
                // Send cards to every player
                game.players.forEach(player => {
                    const playerCards = game.getPlayer(player.ws)?.cards || [];
                    player.ws.send(JSON.stringify({
                        type: 'playerCards',
                        cards: playerCards
                    }));
                    console.log(`Sent cards to player in room ${roomId}:`, playerCards);
                });
            }
        
            if (data.type === 'playerAction') {
                console.log(`Player ${data.playerId} in room ${roomId} performed action: ${data.action}`); 
                const answer = game.setPlayerAction(ws, data.action, data.raiseAmount);

                broadcastToRoom(roomId, { type: `player ${ws} ${data.action}` });

                let stageData = null;

                if (data.action == 'Raise') {
                    console.log("in data.action == 'Raise'")

                    await handleRaise(ws, game, roomId); // Handle player raise logic
                    stageData = game.nextStage();

                    if (stageData) {
                        if (winners) {
                            broadcastToRoom(roomId, { type: "winners", winners: stageData.winners });
                        } else {
                            console.log(`Dealing ${stageData.type}, cards ${JSON.stringify(stageData.cards)} in room ${roomId}`);
                            broadcastToRoom(roomId, { type: stageData.type, cards: stageData.cards });
                        }
                    }

                } else {

                    console.log("in data.action != 'Raise'")
                    // Move to next stage if all players have acted
                    if (game.allPlayersHaveActed()) {
                        stageData = game.nextStage();

                        if (stageData) {
                            console.log(`Dealing ${stageData.type}, cards ${JSON.stringify(stageData.cards)} in room ${roomId}`);
                            broadcastToRoom(roomId, { type: stageData.type, cards: stageData.cards });
                        }

                    }

                }
                
                console.log("get game stage", game.getStage());

                if (game.getStage() == -1) {
                    console.log("game is over");
                    broadcastToRoom(roomId, { type: "endGame" });
                }

                sendGameStateForAllPlayers(roomId);
            }
        
            if (data.type === 'leaveRoom') {
                console.log(`Player ${data.playerId} in room ${roomId} Leave`);
                game.leaveRoom(ws);
        
                try {
                    const room = await Room.findById(roomId).populate('gameState');
                    await GameState.findByIdAndUpdate(room.gameState._id, {
                        $pull: { playerCards: { player: data.playerId } }
                    });
                    console.log(`Player ${data.playerId} removed from room ${roomId}.`);
                } catch (error) {
                    console.error(`Failed to remove player ${data.playerId} from room ${roomId} in DB:`, error);
                }
        
                sendGameStateForAllPlayers(roomId);
            }
        }); // Closing brace for ws.on('message')
        
    

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

sendRoomManagerForAllPlayers = (roomId) => {
    
    if (rooms[roomId]) {
        const room = rooms[roomId].room;
        const game = rooms[roomId].game;
        const players = [...game.players, ...game.foldedPlayers]
        if (game.players && game.players.length > 0) {
            // שליחת עדכון לכל שחקן על המצב שלו
            players.forEach(player => {
                player.ws.send(JSON.stringify({
                    type: 'roomManager',
                    manager: room.manager // שליחת המצב של כל שחקן לשחקן הספציפי
                }));
            });
        }
    }
}


module.exports = {
    setupWebSocket,
    broadcastToRoom
};

