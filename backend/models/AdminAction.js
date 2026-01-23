import mongoose from 'mongoose';

const adminActionSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    action: {
        type: String,
        required: true,
        enum: [
            'approve_user',
            'reject_user',
            'block_user',
            'unblock_user',
            'delete_user',
            'close_topic',
            'hide_topic',
            'unhide_topic',
            'delete_topic',
            'delete_post',
            'restore_post',
            'create_tag',
            'update_tag',
            'delete_tag',
            'other',
        ],
    },

    targetType: {
        type: String,
        required: true,
        enum: ['User', 'Topic', 'Post', 'Tag', 'Other'],
    },

    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

    // Additional details about the action
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },

    // Optional reason/note
    reason: {
        type: String,
        maxlength: [500, 'Reason cannot exceed 500 characters'],
    },

    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Indexes for efficient queries
adminActionSchema.index({ adminId: 1, timestamp: -1 });
adminActionSchema.index({ targetType: 1, targetId: 1 });
adminActionSchema.index({ action: 1, timestamp: -1 });
adminActionSchema.index({ timestamp: -1 });

// Static method to log an action
adminActionSchema.statics.logAction = async function (adminId, action, targetType, targetId, details = {}, reason = null) {
    return await this.create({
        adminId,
        action,
        targetType,
        targetId,
        details,
        reason,
    });
};

// Static method to get actions by admin
adminActionSchema.statics.getByAdmin = async function (adminId, limit = 50) {
    return await this.find({ adminId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('adminId', 'email profile');
};

// Static method to get actions for a target
adminActionSchema.statics.getByTarget = async function (targetType, targetId) {
    return await this.find({ targetType, targetId })
        .sort({ timestamp: -1 })
        .populate('adminId', 'email profile');
};

// Static method to get recent actions
adminActionSchema.statics.getRecent = async function (limit = 100) {
    return await this.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('adminId', 'email profile');
};

// Static method to get actions by type
adminActionSchema.statics.getByAction = async function (action, limit = 50) {
    return await this.find({ action })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('adminId', 'email profile');
};

const AdminAction = mongoose.model('AdminAction', adminActionSchema);

export default AdminAction;
