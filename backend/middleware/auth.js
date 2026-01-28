import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TopicModerator from '../models/TopicModerator.js';
import TopicBlock from '../models/TopicBlock.js';

/**
 * Authenticate JWT token
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided',
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-secret-access'
        );

        // Get user from database
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found',
            });
        }

        // Allow PENDING_APPROVAL users to authenticate
        if (user.status === 'blocked') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Account is blocked',
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token',
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token expired',
            });
        }

        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication failed',
        });
    }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // No token, continue without user
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-secret-access'
        );

        const user = await User.findById(decoded.userId);

        if (user && user.status === 'active') {
            req.user = user;
            req.userId = user._id;
        }

        next();
    } catch (error) {
        // Ignore errors for optional auth
        next();
    }
};

/**
 * Require specific role
 */
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
            });
        }

        next();
    };
};

/**
 * Require moderator permission for a topic
 */
export const requireModerator = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }

        // Get topicId from params or body
        const topicId = req.params.topicId || req.params.id || req.body.topicId;

        if (!topicId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Topic ID required',
            });
        }

        // Check if user can moderate
        const canModerate = await TopicModerator.canModerate(req.userId, topicId);

        if (!canModerate && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not a moderator of this topic',
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Permission check failed',
        });
    }
};

/**
 * Require ACTIVE status (blocks PENDING_APPROVAL users)
 */
export const requireActive = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
    }

    if (req.user.status !== 'active') {
        return res.status(403).json({
            error: 'Forbidden',
            message: req.user.status === 'pending'
                ? 'Your account is pending admin approval. You cannot access content until approved.'
                : `Account is ${req.user.status}`,
        });
    }

    next();
};

/**
 * Check if user is not blocked in a topic
 */
export const requireNotBlocked = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }

        // Get topicId from params or body
        const topicId = req.params.topicId || req.params.id || req.body.topicId;

        if (!topicId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Topic ID required',
            });
        }

        // Check if user is blocked
        const isBlocked = await TopicBlock.isUserBlocked(req.userId, topicId);

        if (isBlocked) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are blocked from accessing this topic',
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Block check failed',
        });
    }
};
