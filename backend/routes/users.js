import express from 'express';
import UserService from '../services/UserService.js';
import { isValidEmail, isValidPassword } from '../utils/validators.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/users/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, profile } = req.body;

        // Validate input
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Valid email is required',
            });
        }

        const passwordValidation = isValidPassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                error: 'Bad Request',
                message: passwordValidation.message,
            });
        }

        const user = await UserService.registerUser(email, password, profile);

        res.status(201).json({
            message: 'Registration successful. Awaiting admin approval.',
            user,
        });
    } catch (error) {
        res.status(400).json({
            error: 'Registration Failed',
            message: error.message,
        });
    }
});

/**
 * POST /api/users/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Email and password are required',
            });
        }

        const result = await UserService.loginUser(email, password);

        res.json(result);
    } catch (error) {
        res.status(401).json({
            error: 'Login Failed',
            message: error.message,
        });
    }
});

/**
 * GET /api/users/profile
 * Get own profile
 */
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await UserService.getUser(req.userId);
        res.json(user);
    } catch (error) {
        res.status(404).json({
            error: 'Not Found',
            message: error.message,
        });
    }
});

/**
 * PUT /api/users/profile
 * Update own profile
 */
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { name, bio, avatar } = req.body;

        const user = await UserService.updateProfile(req.userId, {
            name,
            bio,
            avatar,
        });

        res.json(user);
    } catch (error) {
        res.status(400).json({
            error: 'Update Failed',
            message: error.message,
        });
    }
});

/**
 * PUT /api/users/password
 * Change password
 */
router.put('/password', authenticate, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Old and new passwords are required',
            });
        }

        const passwordValidation = isValidPassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                error: 'Bad Request',
                message: passwordValidation.message,
            });
        }

        await UserService.changePassword(req.userId, oldPassword, newPassword);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({
            error: 'Password Change Failed',
            message: error.message,
        });
    }
});

/**
 * GET /api/users/search
 * Search users
 */
router.get('/search', authenticate, async (req, res) => {
    try {
        const { q, limit } = req.query;

        if (!q) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Search query is required',
            });
        }

        const users = await UserService.searchUsers(q, parseInt(limit) || 20);
        res.json(users);
    } catch (error) {
        res.status(500).json({
            error: 'Search Failed',
            message: error.message,
        });
    }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const user = await UserService.getUser(req.params.id);
        res.json(user);
    } catch (error) {
        res.status(404).json({
            error: 'Not Found',
            message: error.message,
        });
    }
});

export default router;
