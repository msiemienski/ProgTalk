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

    // Subtopics where the blocked user retains access (exceptions to the block)
    exceptions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
    }],

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

// Static method to check if user is blocked in a topic (with inheritance and exceptions)
topicBlockSchema.statics.isUserBlocked = async function (userId, topicId) {
    const Topic = mongoose.model('Topic');
    const topic = await Topic.findById(topicId);

    if (!topic) {
        return false;
    }

    // Check blocks in this topic and all ancestors
    const topicsToCheck = [...topic.path, topic._id];

    // Find any block that applies to this user in the topic hierarchy
    const blocks = await this.find({
        topicId: { $in: topicsToCheck },
        userId: userId,
    });

    if (blocks.length === 0) {
        return false;
    }

    // Check if current topic or any ancestor is in exceptions
    // If the current topic is explicitly listed as an exception in any block, user has access
    for (const block of blocks) {
        if (block.exceptions && block.exceptions.length > 0) {
            // Check if current topic is in exceptions
            const hasException = block.exceptions.some(exceptionId =>
                exceptionId.equals(topicId)
            );

            if (hasException) {
                // This topic is an exception - user is NOT blocked here
                return false;
            }
        }
    }

    // User is blocked and no exceptions apply
    return true;
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
