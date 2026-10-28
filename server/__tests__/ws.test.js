const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const { setupWebSocket } = require('../websockets/gameSockets');
const Room = require('../models/Room');
const GameState = require('../models/GameState');

let mongo; let server; let port;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    server = http.createServer(app);
    setupWebSocket(server);
    await new Promise((r) => server.listen(0, r));
    port = server.address().port;
}, 120000);

afterAll(async () => {
    await new Promise((r) => server.close(r));
    await mongoose.disconnect();
    await mongo.stop();
});

const tokenFor = (userId, username) => jwt.sign({ userId, username }, process.env.JWT_SECRET);
const closeCode = (url) => new Promise((resolve) => {
    const ws = new WebSocket(url);
    ws.on('close', (code) => resolve(code));
});

const nextMessage = (ws, type) => new Promise((resolve) => {
    const handler = (raw) => {
        const msg = JSON.parse(raw);
        if (msg.type === type) { ws.off('message', handler); resolve(msg); }
    };
    ws.on('message', handler);
});

test('rejects connections without a valid token', async () => {
    expect(await closeCode(`ws://localhost:${port}?roomId=${new mongoose.Types.ObjectId()}`)).toBe(4401);
    expect(await closeCode(`ws://localhost:${port}?roomId=${new mongoose.Types.ObjectId()}&token=forged`)).toBe(4401);
    const forged = jwt.sign({ userId: 'x', username: 'x' }, 'some-other-secret');
    expect(await closeCode(`ws://localhost:${port}?roomId=${new mongoose.Types.ObjectId()}&token=${forged}`)).toBe(4401);
});

test('rejects unknown rooms', async () => {
    const token = tokenFor('u1', 'alice');
    expect(await closeCode(`ws://localhost:${port}?roomId=${new mongoose.Types.ObjectId()}&token=${token}`)).toBe(4404);
});

test('each player only receives their own hole cards and invalid JSON is handled', async () => {
    const gs = await GameState.create({ playerCards: [] });
    const room = await Room.create({ manager: 'u1', name: 'T', gameType: 'texas-holdem', smallBlind: 5, buyIn: 100, tableLimit: 1000, gameState: gs._id });
    const url = (id, name) => `ws://localhost:${port}?roomId=${room._id}&token=${tokenFor(id, name)}`;

    const a = new WebSocket(url('u1', 'alice'));
    await new Promise((r) => a.on('open', r));
    const b = new WebSocket(url('u2', 'bob'));
    await new Promise((r) => b.on('open', r));

    // garbage must not crash the server
    const err = nextMessage(a, 'error');
    a.send('{not json');
    expect((await err).message).toBe('Invalid message');

    // non-manager cannot start
    const err2 = nextMessage(b, 'error');
    b.send(JSON.stringify({ type: 'startGame' }));
    expect((await err2).message).toMatch(/manager/);

    const aCards = nextMessage(a, 'playerCards');
    const bCards = nextMessage(b, 'playerCards');
    a.send(JSON.stringify({ type: 'startGame' }));
    const [ca, cb] = await Promise.all([aCards, bCards]);
    expect(ca.cards).toHaveLength(2);
    expect(cb.cards).toHaveLength(2);
    expect(ca.cards).not.toEqual(cb.cards);

    a.close(); b.close();
});
