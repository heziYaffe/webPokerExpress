const WebSocket = require('ws');

const rooms = {};  // אובייקט שמנהל את כל החדרים והחיבורים שלהם

// פונקציה להקמת WebSocket Server
const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        const roomId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('roomId');

        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }

        rooms[roomId].push(ws);

        console.log("rooms[roomId].length ", rooms[roomId].length)

        broadcastToRoom(roomId, { type: 'update' });


        ws.on('message', (message) => {
            console.log(`Received message in room ${roomId}:`, message);
            broadcastToRoom(roomId, {type: "update"});
        });

        ws.on('close', () => {
            console.log(`A client disconnected from room ${roomId}`);
            rooms[roomId] = rooms[roomId].filter(client => client !== ws);

            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
            } else {
                broadcastToRoom(roomId, {type: "update"});
            }
        });
    });
};

const broadcastToRoom = (roomId, message) => {
    console.log("broadcast message to room ". message)
    if (rooms[roomId]) {
        rooms[roomId].forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
};

module.exports = {
    setupWebSocket,
    broadcastToRoom
};
