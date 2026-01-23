import express from 'express';
import TopicService from '../services/TopicService.js';
import { authenticate, requireModerator, optionalAuth } from '../middleware/auth.js';
import { isValidTopicName, validatePagination } from '../utils/validators.js';

const router = express.Router();

/**
 * GET /api/topics
 * Get root topics or search
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { search } = req.query;

        let topics;
        if (search) {
            topics = await TopicService.searchTopics(search);
        } else {
            topics = await TopicService.getRootTopics();
        }

        res.json(topics);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch topics',
            message: error.message,
        });
    }
});

/**
 * POST /api/topics
 * Create a new topic
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, description, parentId } = req.body;

        // Validate name
        const nameValidation = isValidTopicName(name);
        if (!nameValidation.valid) {
            return res.status(400).json({
                error: 'Bad Request',
                message: nameValidation.message,
            });
        }

        const topic = await TopicService.createTopic(
            name,
            description,
            parentId || null,
            req.userId
        );

        res.status(201).json(topic);
    } catch (error) {
        res.status(400).json({
            error: 'Topic Creation Failed',
            message: error.message,
        });
    }
});

/**
 * GET /api/topics/tree
 * Get topic tree (hierarchical)
 */
router.get('/tree', optionalAuth, async (req, res) => {
    try {
        const { rootId } = req.query;
        const tree = await TopicService.getTopicTree(rootId || null);
        res.json(tree);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch topic tree',
            message: error.message,
        });
    }
});

/**
 * GET /api/topics/:id
 * Get topic details
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const Topic = (await import('../models/Topic.js')).default;
        const topic = await Topic.findById(req.params.id)
            .populate('mainModeratorId', 'email profile');

        if (!topic) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Topic not found',
            });
        }

        res.json(topic);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch topic',
            message: error.message,
        });
    }
});

/**
 * PUT /api/topics/:id
 * Update topic
 */
router.put('/:id', authenticate, requireModerator, async (req, res) => {
    try {
        const { name, description, status } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (status !== undefined) updates.status = status;

        const topic = await TopicService.updateTopic(req.params.id, req.userId, updates);

        res.json(topic);
    } catch (error) {
        res.status(400).json({
            error: 'Topic Update Failed',
            message: error.message,
        });
    }
});

/**
 * DELETE /api/topics/:id
 * Delete topic
 */
router.delete('/:id', authenticate, requireModerator, async (req, res) => {
    try {
        const { cascade } = req.query;

        const result = await TopicService.deleteTopic(
            req.params.id,
            req.userId,
            cascade === 'true'
        );

        res.json(result);
    } catch (error) {
        res.status(400).json({
            error: 'Topic Deletion Failed',
            message: error.message,
        });
    }
});

/**
 * GET /api/topics/:id/subtopics
 * Get subtopics
 */
router.get('/:id/subtopics', optionalAuth, async (req, res) => {
    try {
        const { includeDescendants } = req.query;

        const subtopics = await TopicService.getSubtopics(
            req.params.id,
            includeDescendants === 'true'
        );

        res.json(subtopics);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch subtopics',
            message: error.message,
        });
    }
});

/**
 * GET /api/topics/:id/path
 * Get topic breadcrumb path
 */
router.get('/:id/path', optionalAuth, async (req, res) => {
    try {
        const path = await TopicService.getTopicPath(req.params.id);
        res.json(path);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch topic path',
            message: error.message,
        });
    }
});

export default router;
