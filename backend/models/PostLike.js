import mongoose from 'mongoose';

const postLikeSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    likedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Compound unique index: user can like a post only once
postLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

// Indexes for queries
postLikeSchema.index({ postId: 1 }); // Get all likes for a post
postLikeSchema.index({ userId: 1 }); // Get all posts user liked

// Static method to toggle like
postLikeSchema.statics.toggleLike = async function (postId, userId) {
    const existingLike = await this.findOne({ postId, userId });

    if (existingLike) {
        // Unlike
        await existingLike.deleteOne();

        // Update post like count
        const Post = mongoose.model('Post');
        await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });

        return { liked: false, likeCount: await this.countDocuments({ postId }) };
    } else {
        // Like
        await this.create({ postId, userId });

        // Update post like count
        const Post = mongoose.model('Post');
        await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });

        return { liked: true, likeCount: await this.countDocuments({ postId }) };
    }
};

// Static method to check if user liked a post
postLikeSchema.statics.hasUserLiked = async function (postId, userId) {
    const like = await this.findOne({ postId, userId });
    return !!like;
};

// Static method to get like count for a post
postLikeSchema.statics.getLikeCount = async function (postId) {
    return await this.countDocuments({ postId });
};

// Static method to get users who liked a post
postLikeSchema.statics.getPostLikers = async function (postId, limit = 50) {
    return await this.find({ postId })
        .populate('userId', 'email profile')
        .sort({ likedAt: -1 })
        .limit(limit);
};

const PostLike = mongoose.model('PostLike', postLikeSchema);

export default PostLike;
