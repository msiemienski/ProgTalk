import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';
import User from '../models/User.js';
import crypto from 'crypto';

class AuthService {
    /**
     * Generate access and refresh tokens
     */
    async generateTokens(user, ipAddress) {
        const userId = user.id || user._id;

        // Generate access token (short-lived)
        const accessToken = jwt.sign(
            {
                userId,
                email: user.email,
                role: user.role,
                status: user.status,
            },
            process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-secret-access',
            { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
        );

        // Generate refresh token (long-lived)
        const refreshTokenString = this.generateRefreshTokenString();
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

        // Store refresh token in database
        const refreshToken = await RefreshToken.create({
            token: refreshTokenString,
            userId,
            expiresAt: refreshTokenExpiry,
            createdByIp: ipAddress,
        });

        return {
            accessToken,
            refreshToken: refreshToken.token,
            expiresIn: 900, // 15 minutes in seconds
        };
    }

    /**
     * Generate a random refresh token string
     */
    generateRefreshTokenString() {
        return crypto.randomBytes(40).toString('hex');
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshTokenString, ipAddress) {
        // Find refresh token in database
        const refreshToken = await RefreshToken.findOne({
            token: refreshTokenString,
        }).populate('userId');

        if (!refreshToken) {
            throw new Error('Invalid refresh token');
        }

        // Check if token is active
        if (refreshToken.revokedAt) {
            throw new Error('Refresh token has been revoked');
        }

        if (refreshToken.isExpired) {
            throw new Error('Refresh token has expired');
        }

        // Get user
        const user = refreshToken.userId;

        if (!user) {
            throw new Error('User not found');
        }

        // Check user status
        if (user.status === 'blocked') {
            throw new Error('User account is blocked');
        }

        // Generate new access token
        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
            },
            process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-secret-access',
            { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
        );

        return {
            accessToken,
            expiresIn: 900, // 15 minutes in seconds
        };
    }

    /**
     * Revoke refresh token (logout)
     */
    async revokeRefreshToken(refreshTokenString, ipAddress) {
        const refreshToken = await RefreshToken.findOne({
            token: refreshTokenString,
        });

        if (!refreshToken) {
            throw new Error('Invalid refresh token');
        }

        if (refreshToken.revokedAt) {
            throw new Error('Token already revoked');
        }

        // Revoke token
        refreshToken.revokedAt = new Date();
        refreshToken.revokedByIp = ipAddress;
        await refreshToken.save();

        return { success: true };
    }

    /**
     * Revoke all refresh tokens for a user
     */
    async revokeAllUserTokens(userId) {
        await RefreshToken.revokeAllForUser(userId);
        return { success: true };
    }

    /**
     * Cleanup expired tokens (should be run periodically)
     */
    async cleanupExpiredTokens() {
        const deletedCount = await RefreshToken.cleanupExpired();
        return { deletedCount };
    }

    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            return jwt.verify(
                token,
                process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-secret-access'
            );
        } catch (error) {
            throw new Error('Invalid or expired access token');
        }
    }

    /**
     * Get user's active refresh tokens
     */
    async getUserRefreshTokens(userId) {
        return await RefreshToken.find({
            userId,
            revokedAt: null,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });
    }
}

export default new AuthService();
