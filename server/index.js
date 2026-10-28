const http = require('http');
const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./utils/logger');
const app = require('./app');
const { setupWebSocket } = require('./websockets/gameSockets');

const start = async () => {
    try {
        await mongoose.connect(config.mongoUri);
        logger.info('MongoDB connected');
    } catch (err) {
        logger.error('MongoDB connection error:', err.message);
        process.exit(1);
    }

    const server = http.createServer(app);
    setupWebSocket(server);

    server.listen(config.port, () => {
        logger.info(`Server running on port ${config.port}`);
    });
};

start();
