import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Don't include password in queries by default
    },

    profile: {
        name: {
            type: String,
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
        },
        avatar: {
            type: String, // URL to avatar image
        },
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },

    status: {
        type: String,
        enum: ['pending', 'active', 'blocked'],
        default: 'pending',
    },

    registeredAt: {
        type: Date,
        default: Date.now,
    },

    approvedAt: {
        type: Date,
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    blockedAt: {
        type: Date,
    },

    blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    blockReason: {
        type: String,
    },
}, {
    timestamps: true,
});

// Indexes (email already has unique index from schema definition)
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function () {
    return {
        id: this._id,
        email: this.email,
        profile: this.profile,
        role: this.role,
        status: this.status,
        registeredAt: this.registeredAt,
    };
};

const User = mongoose.model('User', userSchema);

export default User;
