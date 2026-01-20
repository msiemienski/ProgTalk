import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 * Returns server status and database connection state
 */
router.get('/', (req, res) => {
    const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: {
            connected: mongoose.connection.readyState === 1,
            state: getConnectionState(mongoose.connection.readyState),
        },
    };

    const statusCode = healthCheck.database.connected ? 200 : 503;

    res.status(statusCode).json(healthCheck);
});

/**
 * Helper function to get readable connection state
 */
function getConnectionState(state) {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };
    return states[state] || 'unknown';
}

export default router;
