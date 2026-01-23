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

    // Subtopics where user retains access despite being blocked in parent
    exceptionSubtopics: [{
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
        return false; // No blocks found
    }

    // Check if current topic is in any exception list
    for (const block of blocks) {
        const hasException = block.exceptionSubtopics.some(
            exceptionId => exceptionId.equals(topicId)
        );

        if (!hasException) {
            // Block applies and no exception found
            return true;
        }
    }

    // All blocks have exceptions for this topic
    return false;
};

// Static method to get all blocks for a user
topicBlockSchema.statics.getUserBlocks = async function (userId) {
    return await this.find({ userId })
        .populate('topicId', 'name path ancestors')
        .populate('blockedBy', 'email profile')
        .populate('exceptionSubtopics', 'name');
};

// Static method to get all blocks in a topic
topicBlockSchema.statics.getTopicBlocks = async function (topicId) {
    return await this.find({ topicId })
        .populate('userId', 'email profile')
        .populate('blockedBy', 'email profile');
};

// Method to add exception subtopic
topicBlockSchema.methods.addException = async function (subtopicId) {
    const Topic = mongoose.model('Topic');
    const subtopic = await Topic.findById(subtopicId);

    if (!subtopic) {
        throw new Error('Subtopic not found');
    }

    // Verify subtopic is actually a descendant of the blocked topic
    if (!subtopic.path.some(ancestorId => ancestorId.equals(this.topicId))) {
        throw new Error('Subtopic is not a descendant of the blocked topic');
    }

    // Add if not already in exceptions
    if (!this.exceptionSubtopics.some(id => id.equals(subtopicId))) {
        this.exceptionSubtopics.push(subtopicId);
        await this.save();
    }

    return this;
};

// Method to remove exception subtopic
topicBlockSchema.methods.removeException = async function (subtopicId) {
    this.exceptionSubtopics = this.exceptionSubtopics.filter(
        id => !id.equals(subtopicId)
    );
    await this.save();
    return this;
};

const TopicBlock = mongoose.model('TopicBlock', topicBlockSchema);

export default TopicBlock;
