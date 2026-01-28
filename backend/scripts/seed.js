import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
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
    console.log('🧹 Wiping database...');
    await Promise.all([
        User.deleteMany({}),
        Topic.deleteMany({}),
        Post.deleteMany({}),
        Tag.deleteMany({}),
        TopicModerator.deleteMany({}),
        TopicBlock.deleteMany({}),
        PostLike.deleteMany({}),
        RefreshToken.deleteMany({}),
    ]);
    console.log('✅ Database wiped.');
};

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('📡 Connected to MongoDB for seeding...');

        await wipeDatabase();

        console.log('🌱 Starting seeding process...');

        // 1. Create Users (User model hashes passwords in pre-save hook)
        const adminPassword = 'admin123';
        const userPassword = 'user123';

        const admin = await User.create({
            email: 'admin@progtalk.com',
            password: adminPassword,
            role: 'admin',
            status: 'active',
            profile: { name: 'Super Admin', bio: 'The master of ProgTalk.' },
            approvedAt: new Date(),
        });

        const mod = await User.create({
            email: 'mod@progtalk.com',
            password: userPassword,
            role: 'user',
            status: 'active',
            profile: { name: 'Moderator Mike', bio: 'I keep things clean.' },
            approvedAt: new Date(),
            approvedBy: admin._id,
        });

        const user1 = await User.create({
            email: 'john@example.com',
            password: userPassword,
            role: 'user',
            status: 'active',
            profile: { name: 'John Coder', bio: 'Just here for the JS tips.' },
            approvedAt: new Date(),
            approvedBy: admin._id,
        });

        const user2 = await User.create({
            email: 'dev_jane@example.com',
            password: userPassword,
            role: 'user',
            status: 'active',
            profile: { name: 'Jane Dev', bio: 'Fullstack enthusiast.' },
            approvedAt: new Date(),
            approvedBy: admin._id,
        });

        console.log('✅ Users created.');

        // 2. Create Tags (using a loop/create to trigger pre-save slug generation)
        const tagData = [
            { name: 'JavaScript', category: 'language', color: '#f7df1e', createdBy: admin._id },
            { name: 'TypeScript', category: 'language', color: '#3178c6', createdBy: admin._id },
            { name: 'Vue.js', category: 'framework', color: '#42b883', createdBy: admin._id },
            { name: 'React', category: 'framework', color: '#61dafb', createdBy: admin._id },
            { name: 'Node.js', category: 'platform', color: '#339933', createdBy: admin._id },
            { name: 'MongoDB', category: 'tool', color: '#47a248', createdBy: admin._id },
            { name: 'Docker', category: 'tool', color: '#2496ed', createdBy: admin._id },
            { name: 'CSS', category: 'concept', color: '#1572b6', createdBy: admin._id },
            { name: 'Architecture', category: 'concept', color: '#ff4d4d', createdBy: admin._id },
        ];

        const tags = [];
        for (const data of tagData) {
            tags.push(await Tag.create(data));
        }

        console.log('✅ Tags created.');

        // 3. Create Root Topics
        const programming = await Topic.create({
            name: 'Programming',
            description: 'General discussions about programming languages and logic.',
            mainModeratorId: admin._id,
        });

        const webDev = await Topic.create({
            name: 'Web Development',
            description: 'Building the web: frontend, backend, and everything in between.',
            mainModeratorId: admin._id,
        });

        const devOps = await Topic.create({
            name: 'DevOps & Tools',
            description: 'Deployment, CI/CD, and developer productivity tools.',
            mainModeratorId: admin._id,
        });

        console.log('✅ Root topics created.');

        // 4. Create Subtopics
        const jsTopic = await Topic.create({
            name: 'JavaScript',
            description: 'All about JS, from ES6 to the latest runtimes.',
            parentId: programming._id,
            mainModeratorId: mod._id,
        });
        // Note: TopicService handles moderator creation in app, here we do it manually for seed
        await TopicModerator.create({ topicId: jsTopic._id, userId: mod._id, assignedBy: admin._id, isMain: true });
        await Topic.findByIdAndUpdate(programming._id, { $inc: { subtopicCount: 1 } });

        const vueTopic = await Topic.create({
            name: 'Vue.js',
            description: 'The progressive framework discussions.',
            parentId: webDev._id,
            mainModeratorId: user2._id,
        });
        await TopicModerator.create({ topicId: vueTopic._id, userId: user2._id, assignedBy: admin._id, isMain: true });
        await Topic.findByIdAndUpdate(webDev._id, { $inc: { subtopicCount: 1 } });

        const dockerTopic = await Topic.create({
            name: 'Docker',
            description: 'Containerization and orchestration.',
            parentId: devOps._id,
            mainModeratorId: admin._id,
        });
        await TopicModerator.create({ topicId: dockerTopic._id, userId: admin._id, assignedBy: admin._id, isMain: true });
        await Topic.findByIdAndUpdate(devOps._id, { $inc: { subtopicCount: 1 } });

        console.log('✅ Subtopics created.');

        // 5. Create Posts
        const post1 = await Post.create({
            topicId: jsTopic._id,
            authorId: user1._id,
            content: 'How do you handle async/await in large loops? Here is my approach:',
            codeBlocks: [{
                language: 'javascript',
                code: 'const process = async (items) => {\n  for (const item of items) {\n    await doWork(item);\n  }\n};',
                caption: 'Sequential processing'
            }],
            tags: [tags[0]._id, tags[4]._id]
        });

        const post2 = await Post.create({
            topicId: vueTopic._id,
            authorId: user2._id,
            content: 'Vue 3 with Script Setup is a game changer for developer experience. The boilerplate reduction is amazing.',
            tags: [tags[2]._id]
        });

        const post3 = await Post.create({
            topicId: jsTopic._id,
            authorId: admin._id,
            content: 'Great question John! Just a reminder that for performance, you might want to look into Promise.all if items are independent.',
            referencedPosts: [post1._id]
        });

        console.log('✅ Posts created.');

        // 6. Create some interactions
        await PostLike.create({ postId: post1._id, userId: admin._id });
        await PostLike.create({ postId: post1._id, userId: user2._id });
        await Post.findByIdAndUpdate(post1._id, { $inc: { likeCount: 2 } });

        console.log('✅ Interactions created.');

        console.log('\n🚀 Database seeding completed successfully!');
        console.log('--- Credentials ---');
        console.log('Admin: admin@progtalk.com / admin123');
        console.log('User:  john@example.com   / user123');
        console.log('-------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
