import TopicBlock from '../models/TopicBlock.js';
import Topic from '../models/Topic.js';
import TopicModerator from '../models/TopicModerator.js';

class BlockService {
    /**
     * Block a user in a topic
     */
    async blockUser(topicId, userId, blockedBy, reason = null, exceptionSubtopics = []) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Check if blocker can moderate this topic
        const canModerate = await TopicModerator.canModerate(blockedBy, topicId);
        if (!canModerate) {
            throw new Error('You do not have permission to block users in this topic');
        }

        // Check if user is already blocked
        const existing = await TopicBlock.findOne({ topicId, userId });
        if (existing) {
            throw new Error('User is already blocked in this topic');
        }

        // Validate exception subtopics
        if (exceptionSubtopics.length > 0) {
            for (const subtopicId of exceptionSubtopics) {
                const subtopic = await Topic.findById(subtopicId);
                if (!subtopic) {
                    throw new Error(`Subtopic ${subtopicId} not found`);
                }

                // Verify subtopic is a descendant
                if (!subtopic.path.some(ancestorId => ancestorId.equals(topicId))) {
                    throw new Error(`Subtopic ${subtopicId} is not a descendant of the blocked topic`);
                }
            }
        }

        // Create block
        const block = await TopicBlock.create({
            topicId,
            userId,
            blockedBy,
            reason,
            exceptionSubtopics,
        });

        return block;
    }

    /**
     * Unblock a user in a topic
     */
    async unblockUser(topicId, userId, unblockedBy) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Check if unblocker can moderate this topic
        const canModerate = await TopicModerator.canModerate(unblockedBy, topicId);
        if (!canModerate) {
            throw new Error('You do not have permission to unblock users in this topic');
        }

        // Find block
        const block = await TopicBlock.findOne({ topicId, userId });
        if (!block) {
            throw new Error('User is not blocked in this topic');
        }

        // Remove block
        await block.deleteOne();

        return { success: true };
    }

    /**
     * Check if user is blocked in a topic (with inheritance and exceptions)
     */
    async isUserBlocked(userId, topicId) {
        return await TopicBlock.isUserBlocked(userId, topicId);
    }

    /**
     * Get all blocks for a user
     */
    async getUserBlocks(userId) {
        return await TopicBlock.getUserBlocks(userId);
    }

    /**
     * Get all blocks in a topic
     */
    async getTopicBlocks(topicId) {
        return await TopicBlock.getTopicBlocks(topicId);
    }

    /**
     * Add exception subtopic to a block
     */
    async addBlockException(blockId, subtopicId, moderatorId) {
        const block = await TopicBlock.findById(blockId);
        if (!block) {
            throw new Error('Block not found');
        }

        // Check if moderator can moderate the block's topic
        const canModerate = await TopicModerator.canModerate(moderatorId, block.topicId);
        if (!canModerate) {
            throw new Error('You do not have permission to modify this block');
        }

        await block.addException(subtopicId);
        return block;
    }

    /**
     * Remove exception subtopic from a block
     */
    async removeBlockException(blockId, subtopicId, moderatorId) {
        const block = await TopicBlock.findById(blockId);
        if (!block) {
            throw new Error('Block not found');
        }

        // Check if moderator can moderate the block's topic
        const canModerate = await TopicModerator.canModerate(moderatorId, block.topicId);
        if (!canModerate) {
            throw new Error('You do not have permission to modify this block');
        }

        await block.removeException(subtopicId);
        return block;
    }

    /**
     * Update block reason
     */
    async updateBlockReason(blockId, reason, moderatorId) {
        const block = await TopicBlock.findById(blockId);
        if (!block) {
            throw new Error('Block not found');
        }

        // Check if moderator can moderate the block's topic
        const canModerate = await TopicModerator.canModerate(moderatorId, block.topicId);
        if (!canModerate) {
            throw new Error('You do not have permission to modify this block');
        }

        block.reason = reason;
        await block.save();

        return block;
    }

    /**
     * Get effective blocks for a user in a topic (considering inheritance)
     */
    async getEffectiveBlocks(userId, topicId) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Get all blocks in topic hierarchy
        const topicsToCheck = [...topic.path, topic._id];
        const blocks = await TopicBlock.find({
            topicId: { $in: topicsToCheck },
            userId: userId,
        })
            .populate('topicId', 'name path ancestors')
            .populate('blockedBy', 'email profile')
            .populate('exceptionSubtopics', 'name');

        // Determine which blocks are effective
        const effectiveBlocks = blocks.map(block => {
            const hasException = block.exceptionSubtopics.some(
                exceptionId => exceptionId._id.equals(topicId)
            );

            return {
                ...block.toObject(),
                isEffective: !hasException,
                appliesToCurrentTopic: !hasException,
            };
        });

        return effectiveBlocks;
    }
}

export default new BlockService();
