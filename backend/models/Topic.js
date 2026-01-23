import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Topic name is required'],
        trim: true,
        maxlength: [100, 'Topic name cannot exceed 100 characters'],
    },

    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        default: null, // null for root topics
    },

    // Array of ancestor IDs from root to immediate parent
    // Example: [rootId, level1Id, level2Id] for efficient subtree queries
    path: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
    }],

    // Denormalized ancestor data for breadcrumb display
    ancestors: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Topic',
        },
        name: String,
    }],

    // Creator and main moderator (cannot be removed)
    mainModeratorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    status: {
        type: String,
        enum: ['active', 'closed', 'hidden'],
        default: 'active',
    },

    // Metadata
    postCount: {
        type: Number,
        default: 0,
    },

    subtopicCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Compound index: name must be unique within same parent
topicSchema.index({ parentId: 1, name: 1 }, { unique: true });

// Index for efficient subtree queries (find all descendants)
topicSchema.index({ path: 1 });

// Other indexes
topicSchema.index({ mainModeratorId: 1 });
topicSchema.index({ status: 1 });
topicSchema.index({ createdAt: -1 });

// Virtual for full path string (e.g., "Programming/JavaScript/React")
topicSchema.virtual('fullPath').get(function () {
    const ancestorNames = this.ancestors.map(a => a.name);
    return [...ancestorNames, this.name].join(' / ');
});

// Virtual for topic level (depth in tree)
topicSchema.virtual('level').get(function () {
    return this.path.length;
});

// Pre-save middleware to update path and ancestors
topicSchema.pre('save', async function (next) {
    // Only update path if parentId changed or this is a new document
    if (!this.isModified('parentId') && !this.isNew) {
        return next();
    }

    try {
        if (this.parentId) {
            // Get parent topic
            const parent = await mongoose.model('Topic').findById(this.parentId);

            if (!parent) {
                throw new Error('Parent topic not found');
            }

            // Build path: parent's path + parent's ID
            this.path = [...parent.path, parent._id];

            // Build ancestors: parent's ancestors + parent info
            this.ancestors = [
                ...parent.ancestors,
                { id: parent._id, name: parent.name }
            ];
        } else {
            // Root topic
            this.path = [];
            this.ancestors = [];
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Method to get all subtopics (children only, not descendants)
topicSchema.methods.getChildren = async function () {
    return await mongoose.model('Topic').find({ parentId: this._id });
};

// Method to get all descendants (entire subtree)
topicSchema.methods.getDescendants = async function () {
    return await mongoose.model('Topic').find({ path: this._id });
};

// Method to check if this topic is ancestor of another
topicSchema.methods.isAncestorOf = function (topicId) {
    return this.path.some(ancestorId => ancestorId.equals(topicId));
};

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;
