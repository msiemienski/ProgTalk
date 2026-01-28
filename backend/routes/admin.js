import express from 'express';
import UserService from '../services/UserService.js';
import AdminAction from '../models/AdminAction.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin role
router.use(authenticate, requireRole('admin'));

/**
 * GET /api/admin/users?status=pending
 * Get users by status or all users
 */
router.get('/users', async (req, res) => {
    try {
        const { status } = req.query;
        const User = (await import('../models/User.js')).default;

        let users;
        if (status) {
            users = await User.find({ status }).sort({ registeredAt: -1 });
        } else {
            users = await User.find().sort({ registeredAt: -1 });
        }

        res.json(users);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch users',
            message: error.message,
        });
    }
});

/**
 * GET /api/admin/pending-users
 * Get pending user registrations (deprecated, use /users?status=pending)
 */
router.get('/pending-users', async (req, res) => {
    try {
        const users = await UserService.getPendingUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch pending users',
            message: error.message,
        });
    }
});

/**
 * POST /api/admin/users/:id/approve
 * Approve a pending user
 */
router.post('/users/:id/approve', async (req, res) => {
    try {
        const user = await UserService.approveUser(req.params.id, req.userId);

        res.json({
            message: 'User approved successfully',
            user,
        });
    } catch (error) {
        res.status(400).json({
            error: 'Approval Failed',
            message: error.message,
        });
    }
});

/**
 * POST /api/admin/users/:id/reject
 * Reject a pending user
 */
router.post('/users/:id/reject', async (req, res) => {
    try {
        const { reason } = req.body;

        await UserService.rejectUser(req.params.id, req.userId, reason);

        res.json({ message: 'User rejected successfully' });
    } catch (error) {
        res.status(400).json({
            error: 'Rejection Failed',
            message: error.message,
        });
    }
});

/**
 * POST /api/admin/users/:id/block
 * Block a user
 */
router.post('/users/:id/block', async (req, res) => {
    try {
        const { reason } = req.body;

        const user = await UserService.blockUser(req.params.id, req.userId, reason);

        res.json({
            message: 'User blocked successfully',
            user,
        });
    } catch (error) {
        res.status(400).json({
            error: 'Block Failed',
            message: error.message,
        });
    }
});

/**
 * POST /api/admin/users/:id/unblock
 * Unblock a user
 */
router.post('/users/:id/unblock', async (req, res) => {
    try {
        const user = await UserService.unblockUser(req.params.id, req.userId);

        res.json({
            message: 'User unblocked successfully',
            user,
        });
    } catch (error) {
        res.status(400).json({
            error: 'Unblock Failed',
            message: error.message,
        });
    }
});

/**
 * GET /api/admin/actions
 * Get admin action log
 */
router.get('/actions', async (req, res) => {
    try {
        const { limit, action } = req.query;

        let actions;
        if (action) {
            actions = await AdminAction.getByAction(action, parseInt(limit) || 100);
        } else {
            actions = await AdminAction.getRecent(parseInt(limit) || 100);
        }

        res.json(actions);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch admin actions',
            message: error.message,
        });
    }
});

/**
 * GET /api/admin/actions/:targetType/:targetId
 * Get actions for a specific target
 */
router.get('/actions/:targetType/:targetId', async (req, res) => {
    try {
        const { targetType, targetId } = req.params;

        const actions = await AdminAction.getByTarget(targetType, targetId);

        res.json(actions);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch actions',
            message: error.message,
        });
    }
});

/**
 * POST /api/admin/topics/:id/close
 * Close a topic to new posts
 */
router.post('/topics/:id/close', async (req, res) => {
    try {
        const topic = await UserService.getUser(req.userId); // Check admin status via middleware already
        const TopicService = (await import('../services/TopicService.js')).default;

        const updated = await TopicService.updateTopic(req.params.id, req.userId, { status: 'closed' });

        // Log admin action
        await AdminAction.logAction(
            req.userId,
            'close_topic',
            'Topic',
            req.params.id,
            { name: updated.name }
        );

        res.json({ message: 'Topic closed successfully', topic: updated });
    } catch (error) {
        res.status(400).json({
            error: 'Operation Failed',
            message: error.message,
        });
    }
});

/**
 * POST /api/admin/topics/:id/hide
 * Hide a topic from users
 */
router.post('/topics/:id/hide', async (req, res) => {
    try {
        const TopicService = (await import('../services/TopicService.js')).default;

        const updated = await TopicService.updateTopic(req.params.id, req.userId, { status: 'hidden' });

        // Log admin action
        await AdminAction.logAction(
            req.userId,
            'hide_topic',
            'Topic',
            req.params.id,
            { name: updated.name }
        );

        res.json({ message: 'Topic hidden successfully', topic: updated });
    } catch (error) {
        res.status(400).json({
            error: 'Operation Failed',
            message: error.message,
        });
    }
});

/**
 * POST /api/admin/topics/:id/unhide
 * Restore a hidden topic
 */
router.post('/topics/:id/unhide', async (req, res) => {
    try {
        const TopicService = (await import('../services/TopicService.js')).default;

        const updated = await TopicService.updateTopic(req.params.id, req.userId, { status: 'active' });

        // Log admin action
        await AdminAction.logAction(
            req.userId,
            'unhide_topic',
            'Topic',
            req.params.id,
            { name: updated.name }
        );

        res.json({ message: 'Topic restored successfully', topic: updated });
    } catch (error) {
        res.status(400).json({
            error: 'Operation Failed',
            message: error.message,
        });
    }
});

/**
 * GET /api/admin/posts
 * Fetch all posts with optional status filtering
 */
router.get('/posts', async (req, res) => {
    try {
        const { deleted } = req.query;
        const Post = (await import('../models/Post.js')).default;

        const query = {};
        if (deleted === 'true') {
            query.isDeleted = true;
        } else if (deleted === 'false') {
            query.isDeleted = false;
        }

        const posts = await Post.find(query)
            .populate('authorId', 'email profile')
            .populate('topicId', 'name')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(posts);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch posts',
            message: error.message,
        });
    }
});

/**
 * GET /api/admin/tags
 * Get all tags with creation info
 */
router.get('/tags', async (req, res) => {
    try {
        const { Tag } = await import('../models/index.js');
        const tags = await Tag.find()
            .populate('createdBy', 'email profile')
            .sort({ name: 1 });
        res.json(tags);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch tags',
            message: error.message,
        });
    }
});

/**
 * POST /api/admin/tags
 * Create a new tag (admin only)
 */
router.post('/tags', async (req, res) => {
    try {
        const { name, category, color, description } = req.body;
        const { Tag } = await import('../models/index.js');

        const tag = await Tag.create({
            name,
            category,
            color,
            description,
            createdBy: req.userId
        });

        await AdminAction.logAction(
            req.userId,
            'create_tag',
            'Tag',
            tag._id,
            { name: tag.name }
        );

        res.status(201).json(tag);
    } catch (error) {
        res.status(400).json({
            error: 'Tag Creation Failed',
            message: error.message,
        });
    }
});

/**
 * PATCH /api/admin/tags/:id
 * Update tag
 */
router.patch('/tags/:id', async (req, res) => {
    try {
        const { name, category, color, description } = req.body;
        const { Tag } = await import('../models/index.js');

        const tag = await Tag.findById(req.params.id);
        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        if (name) tag.name = name;
        if (category) tag.category = category;
        if (color) tag.color = color;
        if (description) tag.description = description;

        await tag.save();

        await AdminAction.logAction(
            req.userId,
            'update_tag',
            'Tag',
            tag._id,
            { name: tag.name }
        );

        res.json(tag);
    } catch (error) {
        res.status(400).json({
            error: 'Tag Update Failed',
            message: error.message,
        });
    }
});

/**
 * DELETE /api/admin/tags/:id
 * Delete tag
 */
router.delete('/tags/:id', async (req, res) => {
    try {
        const { Tag } = await import('../models/index.js');
        const tag = await Tag.findByIdAndDelete(req.params.id);

        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        // Note: Ideally, we should also remove this tag from all posts.
        // For simplicity, we just delete the tag. Posts will have a dangling ID or we can clean them up.
        const Post = (await import('../models/Post.js')).default;
        await Post.updateMany(
            { tags: req.params.id },
            { $pull: { tags: req.params.id } }
        );

        await AdminAction.logAction(
            req.userId,
            'delete_tag',
            'Tag',
            req.params.id,
            { name: tag.name }
        );

        res.json({ message: 'Tag deleted and removed from posts' });
    } catch (error) {
        res.status(400).json({
            error: 'Tag Deletion Failed',
            message: error.message,
        });
    }
});

export default router;
