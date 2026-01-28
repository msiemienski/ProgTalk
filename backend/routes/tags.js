import express from 'express';
import { Tag } from '../models/index.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/tags
 * Get all available tags
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const tags = await Tag.find().sort({ name: 1 });
        res.json(tags);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch tags',
            message: error.message,
        });
    }
});

/**
 * GET /api/tags/popular
 * Get popular tags
 */
router.get('/popular', optionalAuth, async (req, res) => {
    try {
        const { limit } = req.query;
        const tags = await Tag.getPopular(parseInt(limit) || 20);
        res.json(tags);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch popular tags',
            message: error.message,
        });
    }
});

/**
 * POST /api/tags
 * Create a new tag (Admin only)
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(req.userId);

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can create tags' });
        }

        const { name, color, category, description } = req.body;

        const tag = new Tag({
            name,
            color,
            category,
            description,
            createdBy: req.userId
        });

        await tag.save();
        res.status(201).json(tag);
    } catch (error) {
        res.status(400).json({
            error: 'Failed to create tag',
            message: error.message,
        });
    }
});

/**
 * DELETE /api/tags/:id
 * Delete a tag (Admin only)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(req.userId);

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can delete tags' });
        }

        const result = await Tag.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        res.json({ success: true, message: 'Tag deleted' });
    } catch (error) {
        res.status(400).json({
            error: 'Failed to delete tag',
            message: error.message,
        });
    }
});

export default router;
