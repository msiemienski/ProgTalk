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

topicModeratorSchema.statics.getTopicModerators = async function (topicId, includeInherited = true) {
    try {
        const Topic = mongoose.model('Topic');
        const topic = await Topic.findById(topicId);

        if (!topic) {
            return [];
        }

        let topicsToCheck = [topic._id];
        if (includeInherited && topic.path && topic.path.length > 0) {
            // Add all ancestors to the list
            topicsToCheck = [...topic.path, topic._id];
        }



        return await this.find({
            topicId: { $in: topicsToCheck },
        })
            .populate('userId', 'email profile')
            .lean(); // Use lean for faster, plain object access in service
    } catch (err) {
        console.error(`[ERROR] getTopicModerators static error:`, err);
        return [];
    }
};

// Get moderator's level in hierarchy (lower number = higher in hierarchy)
// Returns the depth of the topic where user is a DIRECT moderator
// Returns null if user is not a moderator
topicModeratorSchema.statics.getModeratorLevel = async function (userId, topicId) {
    const Topic = mongoose.model('Topic');
    const topic = await Topic.findById(topicId);

    if (!topic) {
        return null;
    }

    // Check all topics in the path (ancestors) + current topic
    const topicsToCheck = [...topic.path, topic._id];

    // Find where user is a direct moderator
    const moderation = await this.findOne({
        userId: userId,
        topicId: { $in: topicsToCheck }
    }).populate('topicId');

    if (!moderation) {
        return null;
    }

    // Return the level (path length) of the topic where they're a moderator
    // Root topics have path.length = 0, their children have path.length = 1, etc.
    return moderation.topicId.path.length;
};

const TopicModerator = mongoose.model('TopicModerator', topicModeratorSchema);

export default TopicModerator;
