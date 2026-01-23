import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    expiresAt: {
        type: Date,
        required: true,
    },

    createdByIp: {
        type: String,
    },

    revokedAt: {
        type: Date,
    },

    revokedByIp: {
        type: String,
    },

    replacedByToken: {
        type: String,
    },
}, {
    timestamps: true,
});

// Indexes (token already has unique index from schema definition)
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 });

// Virtual to check if token is expired
refreshTokenSchema.virtual('isExpired').get(function () {
    return Date.now() >= this.expiresAt;
});

// Virtual to check if token is active
refreshTokenSchema.virtual('isActive').get(function () {
    return !this.revokedAt && !this.isExpired;
});

// Static method to cleanup expired tokens
refreshTokenSchema.statics.cleanupExpired = async function () {
    const result = await this.deleteMany({
        expiresAt: { $lt: new Date() },
    });
    return result.deletedCount;
};

// Static method to revoke all tokens for a user
refreshTokenSchema.statics.revokeAllForUser = async function (userId) {
    await this.updateMany(
        { userId, revokedAt: null },
        { revokedAt: new Date() }
    );
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
