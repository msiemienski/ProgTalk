import TopicModerator from '../models/TopicModerator.js';
import Topic from '../models/Topic.js';

class ModeratorService {
    /**
     * Assign a moderator to a topic
     */
    async assignModerator(topicId, userId, assignedBy) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Check if assigner can moderate this topic
        const canModerate = await TopicModerator.canModerate(assignedBy, topicId);
        if (!canModerate) {
            throw new Error('You do not have permission to assign moderators to this topic');
        }

        // Check if user is already a moderator
        const existing = await TopicModerator.findOne({ topicId, userId });
        if (existing) {
            throw new Error('User is already a moderator of this topic');
        }

        // Create moderator assignment
        const moderator = await TopicModerator.create({
            topicId,
            userId,
            assignedBy,
            isMain: false,
        });

        return moderator;
    }

    /**
     * Remove a moderator from a topic
     */
    async removeModerator(topicId, userId, removedBy) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Check if remover can moderate this topic
        const canModerate = await TopicModerator.canModerate(removedBy, topicId);
        if (!canModerate) {
            throw new Error('You do not have permission to remove moderators from this topic');
        }

        // Find moderator assignment
        const moderator = await TopicModerator.findOne({ topicId, userId });
        if (!moderator) {
            throw new Error('User is not a moderator of this topic');
        }

        // Cannot remove main moderator
        if (moderator.isMain) {
            throw new Error('Cannot remove the main moderator (topic creator)');
        }

        // Remove moderator
        await moderator.deleteOne();

        return { success: true };
    }

    /**
     * Get all topics a user can moderate (including inherited)
     */
    async getModeratedTopics(userId) {
        return await TopicModerator.getUserModeratedTopics(userId);
    }

    /**
     * Get all moderators of a topic (including inherited from ancestors)
     */
    async getTopicModerators(topicId, includeInherited = true) {
        return await TopicModerator.getTopicModerators(topicId, includeInherited);
    }

    /**
     * Check if user can moderate a topic (including inheritance)
     */
    async canModerate(userId, topicId) {
        return await TopicModerator.canModerate(userId, topicId);
    }

    /**
     * Get moderator permissions for a topic
     */
    async getModeratorPermissions(userId, topicId) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Check if user is main moderator
        const isMainModerator = topic.mainModeratorId.equals(userId);

        // Check if user can moderate (direct or inherited)
        const canModerate = await TopicModerator.canModerate(userId, topicId);

        // Find direct moderator assignment
        const directModerator = await TopicModerator.findOne({ topicId, userId });

        // Find inherited moderator assignment
        let inheritedFrom = null;
        if (canModerate && !directModerator) {
            // User can moderate but not directly assigned - must be inherited
            const topicsToCheck = topic.path;
            const inheritedMod = await TopicModerator.findOne({
                topicId: { $in: topicsToCheck },
                userId: userId,
            }).populate('topicId', 'name');

            if (inheritedMod) {
                inheritedFrom = inheritedMod.topicId;
            }
        }

        return {
            canModerate,
            isMainModerator,
            isDirect: !!directModerator,
            isInherited: canModerate && !directModerator,
            inheritedFrom,
            canAssignModerators: canModerate,
            canRemoveModerators: canModerate && !isMainModerator,
            canBlockUsers: canModerate,
            canDeletePosts: canModerate,
        };
    }

    /**
     * Get all moderators assigned by a user
     */
    async getModeratorsAssignedBy(userId) {
        return await TopicModerator.find({ assignedBy: userId })
            .populate('topicId', 'name path ancestors')
            .populate('userId', 'email profile')
            .sort({ assignedAt: -1 });
    }

    /**
     * Promote a moderator to main moderator (transfer ownership)
     */
    async transferMainModerator(topicId, newMainModeratorId, currentMainModeratorId) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Verify current user is the main moderator
        if (!topic.mainModeratorId.equals(currentMainModeratorId)) {
            throw new Error('Only the main moderator can transfer ownership');
        }

        // Check if new moderator exists and is a moderator
        const newModerator = await TopicModerator.findOne({
            topicId,
            userId: newMainModeratorId,
        });

        if (!newModerator) {
            throw new Error('New main moderator must already be a moderator of this topic');
        }

        // Update topic
        topic.mainModeratorId = newMainModeratorId;
        await topic.save();

        // Update moderator entries
        await TopicModerator.updateOne(
            { topicId, userId: currentMainModeratorId },
            { isMain: false }
        );

        await TopicModerator.updateOne(
            { topicId, userId: newMainModeratorId },
            { isMain: true }
        );

        return topic;
    }
}

export default new ModeratorService();
