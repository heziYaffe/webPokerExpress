const GameLogic = require('../controllers/gameLogic');

const WebSocket = require('ws');

const { handlePlayerAction } = require('../controllers/gameController');


const rooms = {};  // אובייקט שמנהל את כל החדרים והחיבורים שלהם

// פונקציה להקמת WebSocket Server
const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        const roomId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('roomId');

        // בדיקה האם החדר קיים או שנוצר חדר חדש
        if (!rooms[roomId]) {
            rooms[roomId] = {
                game: new GameLogic(100, 4),
                players: []
            };
            console.log(`Room ${roomId} created.`);
        }

        const game = rooms[roomId].game;

        // הוספת השחקן לחדר
        rooms[roomId].players.push(ws);
        game.addPlayer(ws);

        console.log(`Player connected to room ${roomId}. Total players: ${rooms[roomId].players.length}`);

        broadcastToRoom(roomId, { type: 'gameUpdate' });

        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            console.log(`Received message in room ${roomId}:`, data);

            if (data.type === 'startGame') {
                console.log(`Game started in room ${roomId}`);
                game.nextStage(0);

                            // שלח לכל שחקן את הקלפים האישיים שלו
                rooms[roomId].players.forEach(playerWs => {
                    const playerCards = game.getPlayer(playerWs)?.cards || [];
                    playerWs.send(JSON.stringify({
                        type: 'playerCards',
                        cards: playerCards // שליחת הקלפים לשחקן הספציפי
                    }));
                    console.log(`Sent cards to player in room ${roomId}:`, playerCards);
                });
            }

            if (data.type === 'playerAction') {
                console.log(`Player ${data.playerId} in room ${roomId} performed action: ${data.action}`);

                broadcastToRoom(roomId, await handlePlayerAction(data, roomId));

                game.setPlayerAction(ws, data.action); // עדכון פעולה של השחקן

                broadcastToRoom(roomId, {type:`player ${ws} ${data.action}` });


                ws.send(JSON.stringify({
                    type: 'gameState',
                    state: game.getGameState(ws) // שליחת הקלפים לשחקן הספציפי
                }));

                // אם כל השחקנים ביצעו פעולה, מעבר לשלב הבא
                if (game.allPlayersHaveActed()) {
                    const stageData = game.nextStage();
                    console.log(`Dealing ${stageData.type}, cards ${JSON.stringify(stageData.cards)} in room ${roomId}`);
                    broadcastToRoom(roomId, { type: stageData.type, cards: stageData.cards });
                }

            }

        });

        ws.on('close', () => {
            console.log(`A client disconnected from room ${roomId}`);
            rooms[roomId].players = rooms[roomId].players.filter(client => client !== ws);

            if (rooms[roomId].players.length === 0) {
                console.log(`Room ${roomId} is now empty. Deleting room.`);
                delete rooms[roomId];
            } else {
                console.log(`Player disconnected from room ${roomId}. Players left: ${rooms[roomId].players.length}`);
                broadcastToRoom(roomId, { type: 'update' });
            }
        });
    });
};

const broadcastToRoom = (roomId, message) => {
    console.log(`Broadcasting message to room ${roomId}:`, message);
    if (rooms[roomId] && rooms[roomId].players && rooms[roomId].players.length > 0) {
        rooms[roomId].players.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    } else {
        console.error(`Room ${roomId} does not exist or has no players.`);
    }
};

module.exports = {
    setupWebSocket,
    broadcastToRoom
};

