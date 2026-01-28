import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tag name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Tag name cannot exceed 50 characters'],
    },

    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
    },

    category: {
        type: String,
        enum: ['language', 'framework', 'library', 'tool', 'platform', 'concept', 'other'],
        default: 'other',
    },

    color: {
        type: String,
        default: '#667eea', // Default purple color
        match: [/^#[0-9A-Fa-f]{6}$/, 'Please provide a valid hex color'],
    },

    description: {
        type: String,
        maxlength: [200, 'Description cannot exceed 200 characters'],
    },

    // Who created this tag (admin or moderator)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // Usage count (denormalized for performance)
    usageCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Indexes
tagSchema.index({ category: 1 });
tagSchema.index({ usageCount: -1 }); // Popular tags

// Auto-generate slug from name before saving
tagSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

// Static method to get popular tags
tagSchema.statics.getPopular = async function (limit = 20) {
    return await this.find()
        .sort({ usageCount: -1 })
        .limit(limit);
};

// Static method to search tags
tagSchema.statics.search = async function (query, limit = 10) {
    return await this.find({
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { slug: { $regex: query, $options: 'i' } },
        ],
    })
        .limit(limit)
        .sort({ usageCount: -1 });
};

// Static method to get tags by category
tagSchema.statics.getByCategory = async function (category) {
    return await this.find({ category })
        .sort({ name: 1 });
};

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;
