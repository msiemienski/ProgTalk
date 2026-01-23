import Topic from '../models/Topic.js';
import TopicModerator from '../models/TopicModerator.js';
import mongoose from 'mongoose';

class TopicService {
    /**
     * Create a new topic
     */
    async createTopic(name, description, parentId, creatorId) {
        // Check if parent exists (if parentId provided)
        if (parentId) {
            const parent = await Topic.findById(parentId);
            if (!parent) {
                throw new Error('Parent topic not found');
            }

            // Check if topic status allows subtopics
            if (parent.status === 'closed') {
                throw new Error('Cannot create subtopic in a closed topic');
            }
        }

        // Check name uniqueness within parent
        const existing = await Topic.findOne({ parentId, name });
        if (existing) {
            throw new Error('Topic with this name already exists in the same parent');
        }

        // Create topic
        const topic = new Topic({
            name,
            description,
            parentId,
            mainModeratorId: creatorId,
        });

        await topic.save();

        // Create main moderator entry
        await TopicModerator.create({
            topicId: topic._id,
            userId: creatorId,
            assignedBy: creatorId,
            isMain: true,
        });

        // Update parent's subtopic count
        if (parentId) {
            await Topic.findByIdAndUpdate(parentId, { $inc: { subtopicCount: 1 } });
        }

        return topic;
    }

    /**
     * Get topic tree (hierarchical structure)
     */
    async getTopicTree(rootId = null) {
        const query = rootId ? { _id: rootId } : { parentId: null };
        const roots = await Topic.find(query).populate('mainModeratorId', 'email profile');

        // Recursively build tree
        const buildTree = async (topics) => {
            return await Promise.all(
                topics.map(async (topic) => {
                    const children = await Topic.find({ parentId: topic._id })
                        .populate('mainModeratorId', 'email profile');

                    return {
                        ...topic.toObject(),
                        children: children.length > 0 ? await buildTree(children) : [],
                    };
                })
            );
        };

        return await buildTree(roots);
    }

    /**
     * Get all subtopics (descendants) of a topic
     */
    async getSubtopics(topicId, includeDescendants = true) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        if (includeDescendants) {
            // Get all descendants
            return await Topic.find({ path: topicId })
                .populate('mainModeratorId', 'email profile')
                .sort({ 'path.length': 1, name: 1 });
        } else {
            // Get only direct children
            return await Topic.find({ parentId: topicId })
                .populate('mainModeratorId', 'email profile')
                .sort({ name: 1 });
        }
    }

    /**
     * Get breadcrumb path for a topic
     */
    async getTopicPath(topicId) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Return ancestors + current topic
        return [
            ...topic.ancestors,
            { id: topic._id, name: topic.name },
        ];
    }

    /**
     * Update topic (name, description, status)
     */
    async updateTopic(topicId, userId, updates) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Check if user can moderate
        const canModerate = await TopicModerator.canModerate(userId, topicId);
        if (!canModerate) {
            throw new Error('User is not a moderator of this topic');
        }

        // If name is being changed, check uniqueness
        if (updates.name && updates.name !== topic.name) {
            const existing = await Topic.findOne({
                parentId: topic.parentId,
                name: updates.name,
                _id: { $ne: topicId },
            });

            if (existing) {
                throw new Error('Topic with this name already exists in the same parent');
            }

            topic.name = updates.name;

            // Update ancestors for all descendants
            await this.updateDescendantAncestors(topicId);
        }

        if (updates.description !== undefined) {
            topic.description = updates.description;
        }

        if (updates.status) {
            topic.status = updates.status;
        }

        await topic.save();
        return topic;
    }

    /**
     * Update ancestors for all descendants when topic name changes
     */
    async updateDescendantAncestors(topicId) {
        const topic = await Topic.findById(topicId);
        const descendants = await Topic.find({ path: topicId });

        for (const descendant of descendants) {
            // Find the index of this topic in descendant's path
            const pathIndex = descendant.path.findIndex(id => id.equals(topicId));

            if (pathIndex !== -1) {
                // Update the corresponding ancestor
                descendant.ancestors[pathIndex] = {
                    id: topic._id,
                    name: topic.name,
                };

                await descendant.save();
            }
        }
    }

    /**
     * Delete topic (and optionally its subtree)
     */
    async deleteTopic(topicId, userId, cascadeDelete = false) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Check if user can moderate
        const canModerate = await TopicModerator.canModerate(userId, topicId);
        if (!canModerate) {
            throw new Error('User is not a moderator of this topic');
        }

        // Check if topic has subtopics
        const subtopicCount = await Topic.countDocuments({ parentId: topicId });

        if (subtopicCount > 0 && !cascadeDelete) {
            throw new Error('Cannot delete topic with subtopics. Use cascade delete or remove subtopics first.');
        }

        if (cascadeDelete) {
            // Delete all descendants
            const descendants = await Topic.find({ path: topicId });
            for (const desc of descendants) {
                await this.deleteTopicData(desc._id);
            }
        }

        // Delete topic data
        await this.deleteTopicData(topicId);

        // Update parent's subtopic count
        if (topic.parentId) {
            await Topic.findByIdAndUpdate(topic.parentId, { $inc: { subtopicCount: -1 } });
        }

        return { success: true, deletedCount: cascadeDelete ? descendants.length + 1 : 1 };
    }

    /**
     * Delete all data related to a topic
     */
    async deleteTopicData(topicId) {
        const Post = mongoose.model('Post');
        const PostLike = mongoose.model('PostLike');

        // Get all posts in topic
        const posts = await Post.find({ topicId });
        const postIds = posts.map(p => p._id);

        // Delete post likes
        await PostLike.deleteMany({ postId: { $in: postIds } });

        // Delete posts
        await Post.deleteMany({ topicId });

        // Delete moderators
        await TopicModerator.deleteMany({ topicId });

        // Delete blocks
        const TopicBlock = mongoose.model('TopicBlock');
        await TopicBlock.deleteMany({ topicId });

        // Delete topic
        await Topic.findByIdAndDelete(topicId);
    }

    /**
     * Get root topics
     */
    async getRootTopics() {
        return await Topic.find({ parentId: null })
            .populate('mainModeratorId', 'email profile')
            .sort({ name: 1 });
    }

    /**
     * Search topics by name
     */
    async searchTopics(query, limit = 20) {
        return await Topic.find({
            name: { $regex: query, $options: 'i' },
            status: 'active',
        })
            .populate('mainModeratorId', 'email profile')
            .limit(limit)
            .sort({ name: 1 });
    }
}

export default new TopicService();
