import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Topic from '../models/Topic.js';
import Post from '../models/Post.js';
import Tag from '../models/Tag.js';
import TopicModerator from '../models/TopicModerator.js';
import TopicBlock from '../models/TopicBlock.js';
import PostLike from '../models/PostLike.js';
import RefreshToken from '../models/RefreshToken.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/progtalk';

const wipeDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('📡 Connected to MongoDB for wiping...');

        console.log('🧹 Wiping all collections...');

        const results = await Promise.all([
            User.deleteMany({}),
            Topic.deleteMany({}),
            Post.deleteMany({}),
            Tag.deleteMany({}),
            TopicModerator.deleteMany({}),
            TopicBlock.deleteMany({}),
            PostLike.deleteMany({}),
            RefreshToken.deleteMany({}),
        ]);

        console.log('✅ Database wiped successfully.');
        console.log(`Deleted: 
            Users: ${results[0].deletedCount}
            Topics: ${results[1].deletedCount}
            Posts: ${results[2].deletedCount}
            Tags: ${results[3].deletedCount}
            Moderators: ${results[4].deletedCount}
            Blocks: ${results[5].deletedCount}
            Likes: ${results[6].deletedCount}
            Tokens: ${results[7].deletedCount}
        `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Wipe failed:', error);
        process.exit(1);
    }
};

wipeDatabase();
