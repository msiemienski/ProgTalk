import mongoose from 'mongoose';

const topicModeratorSchema = new mongoose.Schema({
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

    // Who assigned this moderator
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // True for the main moderator (topic creator)
    isMain: {
        type: Boolean,
        default: false,
    },

    assignedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Compound unique index: one user can be moderator of a topic only once
topicModeratorSchema.index({ topicId: 1, userId: 1 }, { unique: true });

// Indexes for queries
topicModeratorSchema.index({ userId: 1 }); // Find all topics user moderates
topicModeratorSchema.index({ topicId: 1 }); // Find all moderators of a topic

// Static method to check if user is moderator of topic (including inheritance)
topicModeratorSchema.statics.canModerate = async function (userId, topicId) {
    const Topic = mongoose.model('Topic');
    const topic = await Topic.findById(topicId);

    if (!topic) {
        return false;
    }

    // Check if user is moderator of this topic or any ancestor
    const topicsToCheck = [...topic.path, topic._id];

    const moderator = await this.findOne({
        topicId: { $in: topicsToCheck },
        userId: userId,
    });

    return !!moderator;
};

// Static method to get all topics a user can moderate (including inherited)
topicModeratorSchema.statics.getUserModeratedTopics = async function (userId) {
    const Topic = mongoose.model('Topic');

    // Get topics where user is directly assigned as moderator
    const directModerations = await this.find({ userId }).populate('topicId');

    // For each moderated topic, get all descendants
    const allTopicIds = new Set();

    for (const mod of directModerations) {
        if (mod.topicId) {
            allTopicIds.add(mod.topicId._id.toString());

            // Get all descendants
            const descendants = await Topic.find({ path: mod.topicId._id });
            descendants.forEach(desc => allTopicIds.add(desc._id.toString()));
        }
    }

    // Convert back to ObjectIds and fetch topics
    const topicIds = Array.from(allTopicIds).map(id => mongoose.Types.ObjectId(id));
    return await Topic.find({ _id: { $in: topicIds } });
};

// Static method to get all moderators of a topic (including inherited)
topicModeratorSchema.statics.getTopicModerators = async function (topicId, includeInherited = true) {
    const Topic = mongoose.model('Topic');
    const topic = await Topic.findById(topicId);

    if (!topic) {
        return [];
    }

    let topicsToCheck;
    if (includeInherited) {
        // Include moderators from ancestors
        topicsToCheck = [...topic.path, topic._id];
    } else {
        // Only direct moderators
        topicsToCheck = [topic._id];
    }

    return await this.find({
        topicId: { $in: topicsToCheck },
    }).populate('userId', 'email profile');
};

const TopicModerator = mongoose.model('TopicModerator', topicModeratorSchema);

export default TopicModerator;
