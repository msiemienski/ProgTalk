import express from 'express';
import PostService from '../services/PostService.js';
import { authenticate, requireNotBlocked, optionalAuth } from '../middleware/auth.js';
import { validatePagination } from '../utils/validators.js';

const router = express.Router();

/**
 * GET /api/posts/:id
 * Get a single post
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const userId = req.userId || null;
        const post = await PostService.getPost(req.params.id, userId);

        res.json(post);
    } catch (error) {
        res.status(404).json({
            error: 'Not Found',
            message: error.message,
        });
    }
});

/**
 * PUT /api/posts/:id
 * Update a post
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { content, tags, referencedPosts } = req.body;

        const updates = {};
        if (content !== undefined) updates.content = content;

        if (tags !== undefined) updates.tags = tags;
        if (referencedPosts !== undefined) updates.referencedPosts = referencedPosts;

        const post = await PostService.updatePost(req.params.id, req.userId, updates);

        res.json(post);
    } catch (error) {
        res.status(400).json({
            error: 'Post Update Failed',
            message: error.message,
        });
    }
});

/**
 * DELETE /api/posts/:id
 * Delete a post (soft delete)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const post = await PostService.deletePost(req.params.id, req.userId);

        res.json({ message: 'Post deleted successfully', post });
    } catch (error) {
        res.status(400).json({
            error: 'Post Deletion Failed',
            message: error.message,
        });
    }
});

/**
 * POST /api/posts/:id/like
 * Like/unlike a post
 */
router.post('/:id/like', authenticate, async (req, res) => {
    try {
        const result = await PostService.toggleLike(req.params.id, req.userId);

        res.json(result);
    } catch (error) {
        res.status(400).json({
            error: 'Like Toggle Failed',
            message: error.message,
        });
    }
});

/**
 * GET /api/posts/:id/likes
 * Get post likes
 */
router.get('/:id/likes', async (req, res) => {
    try {
        const { limit } = req.query;
        const likes = await PostService.getPostLikes(req.params.id, parseInt(limit) || 50);

        res.json(likes);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch likes',
            message: error.message,
        });
    }
});

/**
 * GET /api/posts/search
 * Search posts
 */
router.get('/search', async (req, res) => {
    try {
        const { q, tags, page, limit } = req.query;
        const { page: validPage, limit: validLimit } = validatePagination(page, limit);

        const tagArray = tags ? tags.split(',') : [];

        const result = await PostService.searchPosts(q, tagArray, validPage, validLimit);

        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Search Failed',
            message: error.message,
        });
    }
});

export default router;
