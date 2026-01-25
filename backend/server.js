import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import './models/index.js'; // Ensure all models are registered

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://localhost:5173',
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import accountRouter from './routes/account.js';
import usersRouter from './routes/users.js';
import topicsRouter from './routes/topics.js';
import postsRouter from './routes/posts.js';
import adminRouter from './routes/admin.js';

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/account', accountRouter);
app.use('/api/users', usersRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/admin', adminRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'ProgTalk API Server',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
        },
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
    });
});

// Create HTTPS server or HTTP fallback
let server;
try {
    // Try to load SSL certificates
    const sslKey = fs.readFileSync(process.env.SSL_KEY_PATH || '../certs/server.key');
    const sslCert = fs.readFileSync(process.env.SSL_CERT_PATH || '../certs/server.cert');

    server = https.createServer({
        key: sslKey,
        cert: sslCert,
    }, app);

    console.log('🔒 HTTPS server configured');
} catch (error) {
    console.warn('⚠️  SSL certificates not found, falling back to HTTP');
    console.warn('   Run certificate generation script to enable HTTPS');
    server = http.createServer(app);
}

// Initialize Socket.io with WSS support
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'https://localhost:5173',
        credentials: true,
    },
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });

    // Example event handler
    socket.on('message', (data) => {
        console.log('📨 Message received:', data);
        socket.emit('message', { echo: data });
    });
});

// Connect to MongoDB and start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log('');
        console.log('🚀 ProgTalk Backend Server Started');
        console.log('=====================================');
        console.log(`📡 Server running on port: ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Protocol: ${server instanceof https.Server ? 'HTTPS' : 'HTTP'}`);
        console.log(`🔌 WebSocket: ${server instanceof https.Server ? 'WSS' : 'WS'} ready`);
        console.log('=====================================');
        console.log('');
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️  SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
