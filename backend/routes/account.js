import express from 'express';
import UserService from '../services/UserService.js';
import { authenticate } from '../middleware/auth.js';
import { isValidPassword } from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/account/me
 * Get current user information
 */
router.get('/me', async (req, res) => {
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
 * POST /api/account/change-password
 * Change user password
 */
router.post('/change-password', async (req, res) => {
    try {
        const { oldPassword, newPassword, newPasswordConfirm } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Old and new passwords are required',
            });
        }

        // Check password confirmation
        if (newPassword !== newPasswordConfirm) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'New passwords do not match',
            });
        }

        // Validate new password
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
 * PATCH /api/account/profile
 * Update user profile
 */
router.patch('/profile', async (req, res) => {
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
            error: 'Profile Update Failed',
            message: error.message,
        });
    }
});

export default router;
