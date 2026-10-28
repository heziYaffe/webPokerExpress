// Minimal leveled logger. Never pass passwords, tokens or full user documents to it.
const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
const current = () => LEVELS[process.env.LOG_LEVEL] ?? (process.env.NODE_ENV === 'test' ? 0 : LEVELS.info);

const make = (level, sink) => (...args) => {
    if (current() >= LEVELS[level]) sink(`[${new Date().toISOString()}] ${level.toUpperCase()}`, ...args);
};

module.exports = {
    error: make('error', console.error),
    warn: make('warn', console.warn),
    info: make('info', console.log),
    debug: make('debug', console.log),
};
