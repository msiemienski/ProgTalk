import { io } from 'socket.io-client';
import { reactive } from 'vue';

class SocketClient {
    constructor() {
        this.socket = null;
        this.currentTopicId = null;
        this.state = reactive({
            connected: false,
            error: null
        });

        // Base API URL (used for REST requests) - may be a relative path like '/api' in Docker/Vite setup
        this.apiUrl = import.meta.env.VITE_API_URL || 'https://localhost:3000';

        // Optional explicit override for socket endpoint (can be absolute origin or relative)
        this.socketOverride = import.meta.env.VITE_SOCKET_URL || null;

        if (this.socketOverride) {
            this.socketBaseUrl = this.socketOverride.startsWith('/') ? undefined : this.socketOverride;
        } else if (this.apiUrl.startsWith('/')) {
            this.socketBaseUrl = undefined;
        } else {
            try {
                const parsed = new URL(this.apiUrl);
                this.socketBaseUrl = parsed.origin;
            } catch (e) {
                this.socketBaseUrl = this.apiUrl;
            }
        }

        this.socketPath = '/socket.io';
        console.log('[SocketClient] apiUrl:', this.apiUrl, 'socketBaseUrl:', this.socketBaseUrl, 'socketPath:', this.socketPath);
    }

    connect() {
        if (this.socket) return;

        const opts = {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            path: this.socketPath,
            // Determine secure flag: if connecting to an https origin or current page is https
            secure: (this.socketBaseUrl ? String(this.socketBaseUrl).startsWith('https') : location.protocol === 'https:'),
        };

        // If socketBaseUrl is undefined we connect to the current origin (Vite proxy scenario)
        this.socket = this.socketBaseUrl ? io(this.socketBaseUrl, opts) : io(undefined, opts);

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected:', this.socket.id);
            this.state.connected = true;
            this.state.error = null;

            if (this.currentTopicId) {
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
