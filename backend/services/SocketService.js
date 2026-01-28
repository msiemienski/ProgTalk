class SocketService {
    constructor() {
        this.io = null;
    }

    init(io) {
        this.io = io;
        console.log('🔌 SocketService initialized');
    }

    emitNewPost(topicId, post) {
        if (!this.io) return;
        const roomName = `topic_${topicId}`;
        this.io.to(roomName).emit('post:created', post);
        console.log(`📡 Emitted new post to ${roomName}. Room size: ${this.io.sockets.adapter.rooms.get(roomName)?.size || 0}`);
    }

    emitTopicUpdate(topicId, action, data = null) {
        if (!this.io) return;
        // Notify specific topic
        this.io.to(`topic_${topicId}`).emit('topic:updated', { action, data });
        // Global tree update
        this.io.emit('tree:updated', { topicId, action });
        console.log(`📡 Emitted topic update: ${topicId} (${action})`);
    }

    emitUserBlocked(userId, topicId) {
        if (!this.io) return;
        this.io.emit('user:blocked', { userId, topicId });
    }
}

export default new SocketService();
