import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true,
    },

    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    content: {
        type: String,
        required: [true, 'Post content is required'],
        maxlength: [10000, 'Post content cannot exceed 10000 characters'],
    },

    content: {
        type: String,
        required: [true, 'Post content is required'],
        maxlength: [10000, 'Post content cannot exceed 10000 characters'],
    },


    // Technology/language tags
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
    }],

    // References to other posts
    referencedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
    }],

    // Soft delete
    isDeleted: {
        type: Boolean,
        default: false,
    },

    deletedAt: {
        type: Date,
    },

    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // Denormalized counts for performance
    likeCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Indexes
postSchema.index({ topicId: 1, createdAt: -1 }); // List posts in topic
postSchema.index({ authorId: 1, createdAt: -1 }); // User's posts
postSchema.index({ tags: 1 }); // Posts by tag
postSchema.index({ isDeleted: 1 }); // Filter deleted posts

// Virtual for like count (can also use denormalized field)
postSchema.virtual('likes', {
    ref: 'PostLike',
    localField: '_id',
    foreignField: 'postId',
    count: true,
});

// Method to soft delete
postSchema.methods.softDelete = async function (userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    await this.save();
    return this;
};

// Method to restore deleted post
postSchema.methods.restore = async function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    await this.save();
    return this;
};

// Static method to get posts with pagination
postSchema.statics.getPaginated = async function (topicId, page = 1, limit = 20, includeDeleted = false) {
    const query = { topicId };

    if (!includeDeleted) {
        query.isDeleted = false;
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
        this.find(query)
            .populate('authorId', 'email profile')
            .populate('tags', 'name slug color')
            .populate({
                path: 'referencedPosts',
                select: 'content authorId createdAt',
                populate: { path: 'authorId', select: 'email profile' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        this.countDocuments(query),
    ]);

    return {
        posts,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

// Update topic post count after save
postSchema.post('save', async function () {
    if (!this.isDeleted) {
        const Topic = mongoose.model('Topic');
        const count = await mongoose.model('Post').countDocuments({
            topicId: this.topicId,
            isDeleted: false,
        });
        await Topic.findByIdAndUpdate(this.topicId, { postCount: count });
    }
});

const Post = mongoose.model('Post', postSchema);

export default Post;
