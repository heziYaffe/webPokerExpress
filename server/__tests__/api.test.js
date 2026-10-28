const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');

let mongo;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
}, 120000);

afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
});

beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
});

const register = (username, password = 'correct-horse') =>
    request(app).post('/api/auth/register').send({ username, password });
const login = async (username, password = 'correct-horse') =>
    (await request(app).post('/api/auth/login').send({ username, password })).body.token;

describe('auth', () => {
    test('registers and logs in, never returning the password hash', async () => {
        const res = await register('alice');
        expect(res.status).toBe(201);
        const token = await login('alice');
        expect(token).toEqual(expect.any(String));
        const stored = await User.findOne({ username: 'alice' });
        expect(stored.password).not.toBe('correct-horse');
        expect(JSON.stringify(stored.toJSON())).not.toContain(stored.password);
    });

    test('rejects weak passwords and invalid usernames', async () => {
        expect((await register('bob', 'short')).status).toBe(400);
        expect((await register('a', 'correct-horse')).status).toBe(400);
        expect((await register('bad name!', 'correct-horse')).status).toBe(400);
    });

    test('rejects duplicate usernames', async () => {
        await register('carol');
        expect((await register('carol')).status).toBe(409);
    });

    test('wrong password gets 401', async () => {
        await register('dave');
        const res = await request(app).post('/api/auth/login').send({ username: 'dave', password: 'nope-nope-nope' });
        expect(res.status).toBe(401);
    });

    test('malformed JSON gets 400', async () => {
        const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
        expect(res.status).toBe(400);
    });
});

describe('admin authorization', () => {
    test('requires a token', async () => {
        expect((await request(app).delete('/api/admin/rooms')).status).toBe(401);
    });

    test('regular users get 403 and nothing is deleted', async () => {
        await register('eve');
        await register('frank');
        const token = await login('eve');
        const res = await request(app).delete('/api/admin/users').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
        expect(await User.countDocuments()).toBe(2);
    });

    test('admins can delete non-admin users', async () => {
        await register('root');
        await register('mallory');
        await User.updateOne({ username: 'root' }, { role: 'admin' });
        const token = await login('root');
        const res = await request(app).delete('/api/admin/users').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(await User.countDocuments()).toBe(1);
    });
});

describe('rooms', () => {
    const create = (token, body) => request(app).post('/api/rooms/create').set('Authorization', `Bearer ${token}`).send(body);

    test('creates a valid room and lists it by game type without hole cards', async () => {
        await register('gina');
        const token = await login('gina');
        const res = await create(token, { name: 'Table 1', gameType: 'texas-holdem', buyIn: 100, tableLimit: 1000, smallBlind: 5 });
        expect(res.status).toBe(201);
        const list = await request(app).get('/api/rooms/texas-holdem').set('Authorization', `Bearer ${token}`);
        expect(list.body).toHaveLength(1);
        expect(list.body[0]).toMatchObject({ name: 'Table 1', playerCount: 1 });
        expect(JSON.stringify(list.body)).not.toContain('cards');
        const other = await request(app).get('/api/rooms/omaha').set('Authorization', `Bearer ${token}`);
        expect(other.body).toHaveLength(0);
    });

    test('rejects invalid room settings', async () => {
        await register('hank');
        const token = await login('hank');
        expect((await create(token, { name: 'x', gameType: 'chess' })).status).toBe(400);
        expect((await create(token, { name: 'x', gameType: 'omaha', buyIn: 2000, tableLimit: 1000 })).status).toBe(400);
        expect((await create(token, { name: 'x', gameType: 'omaha', buyIn: 100, tableLimit: 1000, smallBlind: 50 })).status).toBe(400);
    });

    test('invalid room id gets 400, unknown room gets 404', async () => {
        await register('ivy');
        const token = await login('ivy');
        expect((await request(app).post('/api/rooms/not-an-id/join').set('Authorization', `Bearer ${token}`)).status).toBe(400);
        const unknown = new mongoose.Types.ObjectId().toString();
        expect((await request(app).post(`/api/rooms/${unknown}/join`).set('Authorization', `Bearer ${token}`)).status).toBe(404);
    });
});
