const path = require('path');

// Load env vars from server/.env (or the process environment in production/CI).
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const required = (name) => {
    const value = process.env[name];
    if (!value) {
        // Fail fast: never fall back to a hard-coded secret.
        throw new Error(`Missing required environment variable ${name}. See server/.env.example.`);
    }
    return value;
};

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32 && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
}

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 5003,
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/webpoker',
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
};
