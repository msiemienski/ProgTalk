import express from 'express';
import UserService from '../services/UserService.js';
import AuthService from '../services/AuthService.js';
import { isValidEmail, isValidPassword } from '../utils/validators.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, passwordConfirm, profile } = req.body;

        // Validate email
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Valid email is required',
            });
        }

        // Validate password
        const passwordValidation = isValidPassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                error: 'Bad Request',
                message: passwordValidation.message,
            });
        }

        // Check password confirmation
        if (password !== passwordConfirm) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Passwords do not match',
            });
        }

        // Register user
        const user = await UserService.registerUser(email, password, profile);

        res.status(201).json({
            message: 'Registration successful. Your account is pending admin approval.',
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
 * POST /api/auth/login
 * Login user and return access + refresh tokens
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

        // Login user (returns user info, not tokens yet)
        const loginResult = await UserService.loginUser(email, password);

        // Generate tokens
        const ipAddress = req.ip || req.connection.remoteAddress;
        const tokens = await AuthService.generateTokens(loginResult.user, ipAddress);

        res.json({
            ...tokens,
            user: loginResult.user,
        });
    } catch (error) {
        res.status(401).json({
            error: 'Login Failed',
            message: error.message,
        });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Refresh token is required',
            });
        }

        const ipAddress = req.ip || req.connection.remoteAddress;
        const tokens = await AuthService.refreshAccessToken(refreshToken, ipAddress);

        res.json(tokens);
    } catch (error) {
        res.status(401).json({
            error: 'Token Refresh Failed',
            message: error.message,
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout user by revoking refresh token
 */
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Refresh token is required',
            });
        }

        const ipAddress = req.ip || req.connection.remoteAddress;
        await AuthService.revokeRefreshToken(refreshToken, ipAddress);

        res.json({ message: 'Logout successful' });
    } catch (error) {
        res.status(400).json({
            error: 'Logout Failed',
            message: error.message,
        });
    }
});

export default router;
