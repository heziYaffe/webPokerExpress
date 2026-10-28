const { z } = require('zod');
const mongoose = require('mongoose');

const GAME_TYPES = ['texas-holdem', 'five-card-draw', 'omaha', 'razz', 'seven-card-stud'];

const credentialsSchema = z.object({
    username: z.string().trim()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .regex(/^[a-zA-Z0-9_.-]+$/, 'Username may contain letters, digits, ".", "_" and "-" only'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password is too long'),
});

const loginSchema = z.object({
    username: z.string().trim().min(1).max(50),
    password: z.string().min(1).max(128),
});

const createRoomSchema = z.object({
    name: z.string().trim().min(1, 'Room name is required').max(40),
    gameType: z.enum(GAME_TYPES),
    maxPlayers: z.coerce.number().int().min(2).max(9).default(6),
    buyIn: z.coerce.number().int().positive().default(100),
    tableLimit: z.coerce.number().int().positive().default(1000),
    smallBlind: z.coerce.number().int().positive().default(10),
}).refine((r) => r.buyIn < r.tableLimit, { message: 'Buy-In must be lower than the Table Limit', path: ['buyIn'] })
  .refine((r) => r.smallBlind <= r.buyIn / 10, { message: 'Small Blind must be at most 1/10 of the Buy-In', path: ['smallBlind'] });

const objectId = z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), 'Invalid id');

// Messages a client may send over the game WebSocket.
const wsMessageSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('startGame') }).passthrough(),
    z.object({ type: z.literal('leaveRoom') }).passthrough(),
    z.object({
        type: z.literal('playerAction'),
        action: z.enum(['Check', 'Call', 'Raise', 'Fold', 'All-in']),
        raiseAmount: z.coerce.number().int().min(0).max(1e9).optional().default(0),
    }).passthrough(),
    z.object({
        type: z.literal('playerActionToRaise'),
        action: z.enum(['Call', 'Raise', 'Fold']),
        raiseAmount: z.coerce.number().int().min(0).max(1e9).optional().default(0),
    }).passthrough(),
]);

/** Express middleware: validates req.body and replaces it with the parsed value. */
const validateBody = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
        const issue = result.error.issues[0];
        return res.status(400).json({ message: issue.message, field: issue.path.join('.') });
    }
    req.body = result.data;
    next();
};

/** Express middleware: validates that the named route params are ObjectIds. */
const validateObjectIdParam = (...names) => (req, res, next) => {
    for (const name of names) {
        if (!objectId.safeParse(req.params[name]).success) {
            return res.status(400).json({ message: `Invalid ${name}` });
        }
    }
    next();
};

module.exports = {
    GAME_TYPES,
    credentialsSchema,
    loginSchema,
    createRoomSchema,
    wsMessageSchema,
    objectId,
    validateBody,
    validateObjectIdParam,
};
