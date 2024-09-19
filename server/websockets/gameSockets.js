const GameLogic = require('../controllers/gameLogic');

const WebSocket = require('ws');

const { handlePlayerAction } = require('../controllers/gameController');


const rooms = {};  // אובייקט שמנהל את כל החדרים והחיבורים שלהם

// פונקציה להקמת WebSocket Server
const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {

        const roomId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('roomId');
        const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');

        const username = extractUsernameFromRequest(token)
        console.log("username", username)

        const userId = extractUserIdFromRequest(token)
        console.log("userId", userId)



        // בדיקה האם החדר קיים או שנוצר חדר חדש
        if (!rooms[roomId]) {
            rooms[roomId] = {
                game: new GameLogic(100, 4, 500, 2000),
            };
            console.log(`Room ${roomId} created.`);
        }

        const game = rooms[roomId].game;

        game.addPlayer(ws, userId, username);

        console.log(`Player connected to room ${roomId}. Total players: ${game.players.length}`);

        sendGameStateForAllPlayers(roomId)

        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            console.log(`Received message in room ${roomId}:`, data);

            if (data.type === 'startGame') {
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
                        console.log("game is over")
                    }
                }

                sendGameStateForAllPlayers(roomId)

            }


        });

        

        ws.on('close', () => {
            console.log(`A client disconnected from room ${roomId}`);
            game.players = game.players.filter(client => client.ws !== ws);

            if (game.players.length === 0) {
                console.log(`Room ${roomId} is now empty. Deleting room.`);
                delete rooms[roomId];
            } else {
                console.log(`Player disconnected from room ${roomId}. Players left: ${game.players.length}`);
                broadcastToRoom(roomId, { type: 'update' });
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

        if (game.players && game.players.length > 0) {
            // שליחת עדכון לכל שחקן על המצב שלו
            game.players.forEach(player => {
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

