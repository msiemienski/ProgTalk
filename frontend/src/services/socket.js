import { io } from 'socket.io-client';
import { reactive } from 'vue';

class SocketClient {
    constructor() {
        this.socket = null;
        this.currentTopicId = null; // Track current topic
        this.state = reactive({
            connected: false,
            error: null
        });

        // Use environment variable or default to localhost (HTTPS since backend is HTTPS)
        this.url = import.meta.env.VITE_API_URL || 'https://localhost:3000';
        console.log('[SocketClient] Connecting to:', this.url);
    }

    connect() {
        if (this.socket) return;

        this.socket = io(this.url, {
            withCredentials: true,
            transports: ['websocket', 'polling'], // Try websocket first
            secure: true, // Ensure secure connection
        });

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected:', this.socket.id);
            this.state.connected = true;
            this.state.error = null;

            // Re-join topic if we were tracking one (handles reconnects)
            if (this.currentTopicId) {
                console.log('Re-joining topic after connect:', this.currentTopicId);
                this.joinTopic(this.currentTopicId);
            }
        });

        this.socket.onAny((event, ...args) => {
            console.log(`[Socket] Event received: ${event}`, args);
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            this.state.connected = false;
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            this.state.error = err.message;
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.state.connected = false;
        }
    }

    joinTopic(topicId, callback) {
        this.currentTopicId = topicId;
        if (!this.socket) this.connect();

        // Always emit, socket.io will buffer it if disconnected
        console.log('[SocketClient] Emitting join_topic:', topicId);
        if (callback) {
            this.socket.emit('join_topic', topicId, callback);
        } else {
            this.socket.emit('join_topic', topicId);
        }
    }

    leaveTopic(topicId) {
        this.currentTopicId = null;
        if (this.socket) {
            this.socket.emit('leave_topic', topicId);
        }
    }

    on(event, callback) {
        if (!this.socket) this.connect();
        this.socket.on(event, callback);
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

export default new SocketClient();
