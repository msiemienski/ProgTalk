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

            // Check permission: Creator must be moderator of parent
            const canModerate = await TopicModerator.canModerate(creatorId, parentId);
            const User = mongoose.model('User');
            const user = await User.findById(creatorId);

            if (!canModerate && user.role !== 'admin') {
                throw new Error('You must be a moderator of the parent topic to create a subtopic');
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

        // Emit update via socket
        try {
            const SocketService = (await import('./SocketService.js')).default;
            if (parentId) {
                SocketService.emitTopicUpdate(parentId, 'subtopic_created', topic);
            } else {
                SocketService.emitTopicUpdate('root', 'topic_created', topic);
            }
        } catch (err) {
            console.error('Socket emit failed:', err);
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

        // Check if user can moderate or is admin
        const User = mongoose.model('User');
        const user = await User.findById(userId);
        const canModerate = await TopicModerator.canModerate(userId, topicId);

        if (!canModerate && user.role !== 'admin') {
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

        const User = mongoose.model('User');
        const user = await User.findById(userId);
        const canModerate = await TopicModerator.canModerate(userId, topicId);
        if (!canModerate && user.role !== 'admin') {
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

    /**
     * Add moderator to a topic (by email)
     */
    async addModerator(topicId, email, assignedByUserId) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        // Check permission
        const User = mongoose.model('User');
        const assignedBy = await User.findById(assignedByUserId);
        const canModerate = await TopicModerator.canModerate(assignedByUserId, topicId);

        if (!canModerate && assignedBy.role !== 'admin') {
            throw new Error('You do not have permission to add moderators to this topic');
        }

        // Find target user
        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            throw new Error('User with this email not found');
        }

        if (targetUser.role === 'admin') {
            throw new Error('Admins are already moderators of everything');
        }

        // Check if already moderator
        const existing = await TopicModerator.findOne({ topicId, userId: targetUser._id });
        if (existing) {
            throw new Error('User is already a direct moderator of this topic');
        }


        await TopicModerator.create({
            topicId,
            userId: targetUser._id,
            assignedBy: assignedByUserId,
        });

        return { success: true, user: targetUser.toPublicJSON() };
    }

    /**
     * Remove moderator from a topic (and cascade to subtopics)
     */
    async removeModerator(topicId, targetUserId, requestingUserId) {
        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topic not found');
        }

        const User = mongoose.model('User');
        const requestor = await User.findById(requestingUserId);

        // 1. Check permission
        // Requirement: Only Main Moderator (creator) can remove moderators
        // Or Admin
        if (topic.mainModeratorId.toString() !== requestingUserId && requestor.role !== 'admin') {
            throw new Error('Only the Main Moderator (creator) can remove moderators from this topic');
        }

        // Cannot remove main moderator (redundant check but good safety)
        if (topic.mainModeratorId.toString() === targetUserId) {
            throw new Error('Cannot remove the main moderator (creator) of the topic');
        }

        // 2. Remove direct moderation on this topic
        const deleted = await TopicModerator.findOneAndDelete({ topicId, userId: targetUserId });

        let subtopicsCleaned = 0;

        // 3. Cascade removal: Find all subtopics where this user might be added
        // Note: This logic assumes we want to fully purge them from the subtree
        // initiated from this point.
        const descendants = await Topic.find({ path: topicId });
        const descendantIds = descendants.map(d => d._id);

        if (descendantIds.length > 0) {
            const result = await TopicModerator.deleteMany({
                topicId: { $in: descendantIds },
                userId: targetUserId
            });
            subtopicsCleaned = result.deletedCount;
        }

        return {
            success: true,
            removedDirect: !!deleted,
            subtopicsCleaned
        };
    }

    /**
     * Get moderators for a topic (including inherited)
     */
    async getModerators(topicId) {
        try {
            const moderators = await TopicModerator.getTopicModerators(topicId, true);

            const mapped = await Promise.all(moderators.map(async mod => {
                // Determine user ID
                const uid = mod.userId?._id || mod.userId;
                if (!uid) return null;

                // Handle both populated and raw userId
                const isPopulated = typeof mod.userId === 'object' && mod.userId.email;
                const email = isPopulated ? mod.userId.email : 'Unknown Email';
                const profileName = isPopulated ? mod.userId.profile?.name : null;
                const displayName = profileName || email.split('@')[0];

                const modTopicId = mod.topicId?._id || mod.topicId;
                const isDirect = modTopicId ? modTopicId.toString() === topicId.toString() : false;

                return {
                    userId: uid,
                    email,
                    name: displayName,
                    avatar: isPopulated ? mod.userId.profile?.avatar : null,
                    assignedAt: mod.assignedAt,
                    isMain: mod.isMain,
                    type: isDirect ? 'direct' : 'inherited',
                    sourceTopicId: modTopicId
                };
            }));

            const finalModeratorsRaw = mapped.filter(m => m !== null);

            // Ensure main moderator (creator) is included
            const hasMain = finalModeratorsRaw.some(m => m.isMain);
            if (!hasMain) {
                const topic = await Topic.findById(topicId).populate('mainModeratorId', 'email profile');
                if (topic && topic.mainModeratorId) {
                    const creator = topic.mainModeratorId;
                    const email = creator.email;
                    const profileName = creator.profile?.name;
                    const displayName = profileName || email.split('@')[0];

                    finalModeratorsRaw.unshift({
                        userId: creator._id,
                        email,
                        name: displayName,
                        avatar: creator.profile?.avatar || null,
                        assignedAt: topic.createdAt,
                        isMain: true,
                        type: 'direct',
                        sourceTopicId: topicId
                    });
                }
            }

            // De-duplicate by userId
            const uniqueModeratorsMap = new Map();

            finalModeratorsRaw.forEach(mod => {
                const uid = mod.userId.toString();
                const existing = uniqueModeratorsMap.get(uid);

                if (!existing) {
                    uniqueModeratorsMap.set(uid, mod);
                    return;
                }

                // If we found a duplicate, decide which one to keep
                let replacement = false;

                if (mod.isMain) {
                    if (!existing.isMain) {
                        replacement = true;
                    } else if (mod.type === 'direct' && existing.type === 'inherited') {
                        // Both are Main, keep the direct one for the specific topic context
                        replacement = true;
                    }
                } else if (!existing.isMain && mod.type === 'direct' && existing.type === 'inherited') {
                    // Both are regular, keep the direct one
                    replacement = true;
                }

                if (replacement) {
                    uniqueModeratorsMap.set(uid, mod);
                }
            });

            return Array.from(uniqueModeratorsMap.values());
        } catch (error) {
            console.error('[ERROR] getModerators service error:', error);
            throw error;
        }
    }

    /**
     * Block user in a topic
     */
    async blockUser(topicId, email, blockedByUserId, data) {
        const TopicBlock = (await import('../models/TopicBlock.js')).default;
        const User = mongoose.model('User');

        const topic = await Topic.findById(topicId);
        if (!topic) throw new Error('Topic not found');

        // Check permission: Requestor must be moderator of this topic or admin
        const canModerate = await TopicModerator.canModerate(blockedByUserId, topicId);
        const requestor = await User.findById(blockedByUserId);
        if (!canModerate && requestor.role !== 'admin') {
            throw new Error('You do not have permission to block users in this topic');
        }

        // Find target user
        const targetUser = await User.findOne({ email });
        if (!targetUser) throw new Error('User with this email not found');

        if (targetUser.role === 'admin') {
            throw new Error('Admins cannot be blocked');
        }

        // Check if already blocked in THIS topic
        let block = await TopicBlock.findOne({ topicId, userId: targetUser._id });

        if (block) {
            // Update existing block
            block.reason = data.reason || block.reason;
            block.blockedBy = blockedByUserId;
            await block.save();
        } else {
            // Create new block
            block = await TopicBlock.create({
                topicId,
                userId: targetUser._id,
                blockedBy: blockedByUserId,
                reason: data.reason
            });
        }

        return block;
    }

    /**
     * Get all blocks for a topic
     */
    async getTopicBlocks(topicId, requestingUserId) {
        const TopicBlock = (await import('../models/TopicBlock.js')).default;
        const User = mongoose.model('User');

        // Check permission
        const canModerate = await TopicModerator.canModerate(requestingUserId, topicId);
        const requestor = await User.findById(requestingUserId);

        if (!canModerate && requestor.role !== 'admin') {
            throw new Error('You do not have permission to view blocks in this topic');
        }

        return await TopicBlock.find({ topicId })
            .populate('userId', 'email profile')
            .populate('blockedBy', 'email profile')
            .sort({ blockedAt: -1 });
    }

    /**
     * Unblock user in a topic
     */
    async unblockUser(topicId, targetUserId, requestingUserId) {
        const TopicBlock = (await import('../models/TopicBlock.js')).default;
        const User = mongoose.model('User');

        // Check permission
        const canModerate = await TopicModerator.canModerate(requestingUserId, topicId);
        const requestor = await User.findById(requestingUserId);

        if (!canModerate && requestor.role !== 'admin') {
            throw new Error('You do not have permission to unblock users in this topic');
        }

        const result = await TopicBlock.findOneAndDelete({ topicId, userId: targetUserId });
        if (!result) throw new Error('No block found for this user in this topic');

        return { success: true };
    }

    /**
     * Debug/Check user access to a topic
     */
    async checkUserAccess(topicId, targetUserId) {
        const TopicBlock = (await import('../models/TopicBlock.js')).default;

        const isBlocked = await TopicBlock.isUserBlocked(targetUserId, topicId);

        // Find the specific block if it exists (for reason)
        const topic = await Topic.findById(topicId);
        const topicsToCheck = topic ? [...topic.path, topic._id] : [topicId];

        const activeBlock = await TopicBlock.findOne({
            topicId: { $in: topicsToCheck },
            userId: targetUserId
        }).populate('topicId', 'name').populate('blockedBy', 'email');

        return {
            topicId,
            userId: targetUserId,
            hasAccess: !isBlocked,
            block: activeBlock ? {
                blockedIn: activeBlock.topicId.name,
                reason: activeBlock.reason,
                blockedBy: activeBlock.blockedBy?.email || 'System',
                blockedAt: activeBlock.blockedAt
            } : null
        };
    }
}

export default new TopicService();
