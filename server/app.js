const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const roomRoutes = require('./routes/room');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(helmet());
app.use(cors({
    origin: config.frontendUrl.split(',').map((s) => s.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Central error handler (e.g. malformed JSON bodies).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Malformed JSON body' });
    }
    logger.error('Unhandled error:', err.message);
    res.status(err.status || 500).json({ message: 'Internal server error' });
});

module.exports = app;
