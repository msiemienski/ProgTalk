import Post from '../models/Post.js';
import PostLike from '../models/PostLike.js';
import Topic from '../models/Topic.js';
import TopicBlock from '../models/TopicBlock.js';
import TopicModerator from '../models/TopicModerator.js';

class PostService {
    /**
     * Create a new post
     */
    async createPost(topicId, authorId, content, codeBlocks = [], tags = [], referencedPosts = []) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Check if topic is active
        if (topic.status !== 'active') {
            throw new Error('Cannot post in a closed or hidden topic');
        }

        // Check if user is blocked
        const isBlocked = await TopicBlock.isUserBlocked(authorId, topicId);
        if (isBlocked) {
            throw new Error('You are blocked from posting in this topic');
        }

        // Create post
        const post = await Post.create({
            topicId,
            authorId,
            content,
            codeBlocks,
            tags,
            referencedPosts,
        });

        return await post.populate([
            { path: 'authorId', select: 'email profile' },
            { path: 'tags', select: 'name slug color' },
        ]);
    }

    /**
     * Update a post
     */
    async updatePost(postId, userId, updates) {
        const post = await Post.findById(postId);
        if (!post) {
            throw new Error('Post not found');
        }

        // Check if user is author or moderator
        const isAuthor = post.authorId.equals(userId);
        const canModerate = await TopicModerator.canModerate(userId, post.topicId);

        if (!isAuthor && !canModerate) {
            throw new Error('You do not have permission to edit this post');
        }

        // Update allowed fields
        if (updates.content !== undefined) {
            post.content = updates.content;
        }

        if (updates.codeBlocks !== undefined) {
            post.codeBlocks = updates.codeBlocks;
        }

        if (updates.tags !== undefined) {
            post.tags = updates.tags;
        }

        if (updates.referencedPosts !== undefined) {
            post.referencedPosts = updates.referencedPosts;
        }

        await post.save();

        return await post.populate([
            { path: 'authorId', select: 'email profile' },
            { path: 'tags', select: 'name slug color' },
        ]);
    }

    /**
     * Delete a post (soft delete)
     */
    async deletePost(postId, userId) {
        const post = await Post.findById(postId);
        if (!post) {
            throw new Error('Post not found');
        }

        // Check if user is author or moderator
        const isAuthor = post.authorId.equals(userId);
        const canModerate = await TopicModerator.canModerate(userId, post.topicId);

        if (!isAuthor && !canModerate) {
            throw new Error('You do not have permission to delete this post');
        }

        await post.softDelete(userId);
        return post;
    }

    /**
     * Restore a deleted post
     */
    async restorePost(postId, userId) {
        const post = await Post.findById(postId);
        if (!post) {
            throw new Error('Post not found');
        }

        // Only moderators can restore
        const canModerate = await TopicModerator.canModerate(userId, post.topicId);
        if (!canModerate) {
            throw new Error('Only moderators can restore deleted posts');
        }

        await post.restore();
        return post;
    }

    /**
     * Get posts in a topic (paginated)
     */
    async getTopicPosts(topicId, page = 1, limit = 20, includeDeleted = false) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        return await Post.getPaginated(topicId, page, limit, includeDeleted);
    }

    /**
     * Get a single post
     */
    async getPost(postId, userId = null) {
        const post = await Post.findById(postId)
            .populate('authorId', 'email profile')
            .populate('tags', 'name slug color')
            .populate('referencedPosts', 'content authorId createdAt');

        if (!post) {
            throw new Error('Post not found');
        }

        // Check if user has liked this post
        let hasLiked = false;
        if (userId) {
            hasLiked = await PostLike.hasUserLiked(postId, userId);
        }

        return {
            ...post.toObject(),
            hasLiked,
        };
    }

    /**
     * Like/unlike a post
     */
    async toggleLike(postId, userId) {
        const post = await Post.findById(postId);
        if (!post) {
            throw new Error('Post not found');
        }

        // Check if user is blocked
        const isBlocked = await TopicBlock.isUserBlocked(userId, post.topicId);
        if (isBlocked) {
            throw new Error('You are blocked from interacting with this topic');
        }

        return await PostLike.toggleLike(postId, userId);
    }

    /**
     * Get post likes
     */
    async getPostLikes(postId, limit = 50) {
        return await PostLike.getPostLikers(postId, limit);
    }

    /**
     * Get user's posts
     */
    async getUserPosts(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            Post.find({ authorId: userId, isDeleted: false })
                .populate('topicId', 'name path ancestors')
                .populate('tags', 'name slug color')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Post.countDocuments({ authorId: userId, isDeleted: false }),
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
    }

    /**
     * Search posts by content or tags
     */
    async searchPosts(query, tags = [], page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const filter = {
            isDeleted: false,
        };

        if (query) {
            filter.content = { $regex: query, $options: 'i' };
        }

        if (tags.length > 0) {
            filter.tags = { $in: tags };
        }

        const [posts, total] = await Promise.all([
            Post.find(filter)
                .populate('authorId', 'email profile')
                .populate('topicId', 'name path ancestors')
                .populate('tags', 'name slug color')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Post.countDocuments(filter),
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
    }
}

export default new PostService();
