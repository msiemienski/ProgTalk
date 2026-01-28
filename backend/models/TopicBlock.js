import mongoose from 'mongoose';

const topicBlockSchema = new mongoose.Schema({
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true,
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // Who blocked this user
    blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    reason: {
        type: String,
        maxlength: [500, 'Block reason cannot exceed 500 characters'],
    },

    blockedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Compound index for efficient lookups
topicBlockSchema.index({ topicId: 1, userId: 1 });
topicBlockSchema.index({ userId: 1 }); // Find all blocks for a user

// Static method to check if user is blocked in a topic (with inheritance)
topicBlockSchema.statics.isUserBlocked = async function (userId, topicId) {
    const Topic = mongoose.model('Topic');
    const topic = await Topic.findById(topicId);

    if (!topic) {
        return false;
    }

    // Check blocks in this topic and all ancestors
    const topicsToCheck = [...topic.path, topic._id];

    // Find any block that applies to this user in the topic hierarchy
    const blockCount = await this.countDocuments({
        topicId: { $in: topicsToCheck },
        userId: userId,
    });

    return blockCount > 0;
};

// Static method to get all blocks for a user
topicBlockSchema.statics.getUserBlocks = async function (userId) {
    return await this.find({ userId })
        .populate('topicId', 'name path ancestors')
        .populate('blockedBy', 'email profile');
};

// Static method to get all blocks in a topic
topicBlockSchema.statics.getTopicBlocks = async function (topicId) {
    return await this.find({ topicId })
        .populate('userId', 'email profile')
        .populate('blockedBy', 'email profile');
};

const TopicBlock = mongoose.model('TopicBlock', topicBlockSchema);

export default TopicBlock;
