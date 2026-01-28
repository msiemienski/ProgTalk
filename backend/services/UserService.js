import User from '../models/User.js';
import AdminAction from '../models/AdminAction.js';

class UserService {
    /**
     * Register a new user
     */
    async registerUser(email, password, profileData = {}) {
        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            throw new Error('User with this email already exists');
        }

        // Create user
        const user = await User.create({
            email,
            password,
            profile: profileData,
            status: 'pending', // Requires admin approval
        });


        return user.toPublicJSON();
    }

    /**
     * Login user - returns user object for AuthService to generate tokens
     */
    async loginUser(email, password) {
        // Find user with password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            throw new Error('Your account has been blocked');
        }

        // Allow both PENDING_APPROVAL and ACTIVE to login
        // Access control will be handled by middleware

        return {
            user: user.toPublicJSON(),
        };
    }

    /**
     * Approve a pending user (admin only)
     */
    async approveUser(userId, adminId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.status !== 'pending') {
            throw new Error('User is not pending approval');
        }

        user.status = 'active';
        user.approvedAt = new Date();
        user.approvedBy = adminId;
        await user.save();

        // Log admin action
        await AdminAction.logAction(
            adminId,
            'approve_user',
            'User',
            userId,
            { email: user.email }
        );

        return user.toPublicJSON();
    }

    /**
     * Reject a pending user (admin only)
     */
    async rejectUser(userId, adminId, reason = null) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.status !== 'pending') {
            throw new Error('User is not pending approval');
        }

        // Log admin action before deletion
        await AdminAction.logAction(
            adminId,
            'reject_user',
            'User',
            userId,
            { email: user.email, reason }
        );

        // Delete user
        await user.deleteOne();

        return { success: true };
    }

    /**
     * Block a user (admin only)
     */
    async blockUser(userId, adminId, reason = null) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.role === 'admin') {
            throw new Error('Cannot block an admin user');
        }

        user.status = 'blocked';
        user.blockedAt = new Date();
        user.blockedBy = adminId;
        user.blockReason = reason;
        await user.save();

        // Log admin action
        await AdminAction.logAction(
            adminId,
            'block_user',
            'User',
            userId,
            { email: user.email, reason }
        );

        return user.toPublicJSON();
    }

    /**
     * Unblock a user (admin only)
     */
    async unblockUser(userId, adminId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.status !== 'blocked') {
            throw new Error('User is not blocked');
        }

        user.status = 'active';
        user.blockedAt = null;
        user.blockedBy = null;
        user.blockReason = null;
        await user.save();

        // Log admin action
        await AdminAction.logAction(
            adminId,
            'unblock_user',
            'User',
            userId,
            { email: user.email }
        );

        return user.toPublicJSON();
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, profileData) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Update profile fields
        if (profileData.name !== undefined) {
            user.profile.name = profileData.name;
        }

        if (profileData.bio !== undefined) {
            user.profile.bio = profileData.bio;
        }

        if (profileData.avatar !== undefined) {
            user.profile.avatar = profileData.avatar;
        }

        await user.save();
        return user.toPublicJSON();
    }

    /**
     * Change password
     */
    async changePassword(userId, oldPassword, newPassword) {
        const user = await User.findById(userId).select('+password');
        if (!user) {
            throw new Error('User not found');
        }

        // Verify old password
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            throw new Error('Current password is incorrect');
        }

        // Set new password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        return { success: true };
    }

    /**
     * Get pending users (admin only)
     */
    async getPendingUsers() {
        return await User.find({ status: 'pending' })
            .sort({ registeredAt: 1 });
    }

    /**
     * Get user by ID
     */
    async getUser(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        return user.toPublicJSON();
    }

    /**
     * Search users
     */
    async searchUsers(query, limit = 20) {
        return await User.find({
            $or: [
                { email: { $regex: query, $options: 'i' } },
                { 'profile.name': { $regex: query, $options: 'i' } },
            ],
            status: 'active',
        })
            .limit(limit)
            .sort({ 'profile.name': 1 });
    }
}

export default new UserService();
