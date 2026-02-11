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

        // 1. Create Users
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

        // Batch create regular users
        const userData = [
            { email: 'john@example.com', name: 'John Coder', bio: 'Just here for the JS tips.' },
            { email: 'dev_jane@example.com', name: 'Jane Dev', bio: 'Fullstack enthusiast.' },
            { email: 'bob@example.com', name: 'Bob Builder', bio: 'I like infrastructure.' },
            { email: 'alice@example.com', name: 'Alice in DevLand', bio: 'Curious about everything.' },
            { email: 'charlie@example.com', name: 'Charlie Bitme', bio: 'Backend wizard.' },
            { email: 'stella@example.com', name: 'Stella Artois', bio: 'Quality Assurance is my passion.' },
        ];

        const users = [];
        for (const data of userData) {
            users.push(await User.create({
                email: data.email,
                password: userPassword,
                role: 'user',
                status: 'active',
                profile: { name: data.name, bio: data.bio },
                approvedAt: new Date(),
                approvedBy: admin._id,
            }));
        }

        // Add some pending users for admin testing
        await User.create({
            email: 'newbie@example.com',
            password: userPassword,
            role: 'user',
            status: 'pending',
            profile: { name: 'Newbie Noah', bio: 'Please let me in!' },
        });

        await User.create({
            email: 'mystery@test.com',
            password: userPassword,
            role: 'user',
            status: 'pending',
            profile: { name: 'Mystery Guest' },
        });

        console.log('✅ Users created (including pending).');

        // 2. Create Tags
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
            { name: 'Python', category: 'language', color: '#3776ab', createdBy: admin._id },
            { name: 'Go', category: 'language', color: '#00add8', createdBy: admin._id },
            { name: 'Kubernetes', category: 'tool', color: '#326ce5', createdBy: admin._id },
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
        const subtopicData = [
            { name: 'JavaScript', description: 'All about JS.', parent: programming, mod: mod },
            { name: 'Python', description: 'Snake language.', parent: programming, mod: users[2] },
            { name: 'Vue.js', description: 'Progressive framework.', parent: webDev, mod: users[1] },
            { name: 'React', description: 'Library for UI.', parent: webDev, mod: users[3] },
            { name: 'Backend', description: 'Server-side stuff.', parent: webDev, mod: users[4] },
            { name: 'Docker', description: 'Containerization.', parent: devOps, mod: admin },
            { name: 'Kubernetes', description: 'Orchestration.', parent: devOps, mod: admin },
        ];

        const subtopics = [];
        for (const data of subtopicData) {
            const topic = await Topic.create({
                name: data.name,
                description: data.description,
                parentId: data.parent._id,
                mainModeratorId: data.mod._id,
            });
            await TopicModerator.create({ topicId: topic._id, userId: data.mod._id, assignedBy: admin._id, isMain: true });
            await Topic.findByIdAndUpdate(data.parent._id, { $inc: { subtopicCount: 1 } });
            subtopics.push(topic);
        }

        console.log('✅ Subtopics created.');

        // 5. Create Posts
        const postData = [
            {
                topic: subtopics[0], // JS
                author: users[0],
                content: 'How do you handle `async/await` in large loops? Here is a sequential approach:\n\n```javascript\nfor (const item of items) { await work(item); }\n```',
                tags: [tags[0]._id, tags[4]._id]
            },
            {
                topic: subtopics[2], // Vue
                author: users[1],
                content: 'Vue 3 Composables are much better than Mixins. They offer better type safety and logic reuse.',
                tags: [tags[2]._id, tags[1]._id]
            },
            {
                topic: subtopics[5], // Docker
                author: admin,
                content: 'Use multi-stage builds to keep your Docker images small. Here is an example:\n\n```dockerfile\nFROM node:18-alpine AS build\nWORKDIR /app\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\n```',
                tags: [tags[6]._id]
            },
            {
                topic: subtopics[4], // Backend
                author: users[4],
                content: 'Choosing between SQL and NoSQL for a new project. Thoughts on MongoDB for a social media app?',
                tags: [tags[5]._id]
            },
            {
                topic: subtopics[0], // JS
                author: admin,
                content: 'Regarding the loop question: if you need performance, use `Promise.all`!',
                tags: [tags[0]._id]
            },
            {
                topic: subtopics[3], // React
                author: users[3],
                content: 'React Server Components seem complex but powerful. Anyone tried them in production?',
                tags: [tags[3]._id]
            }
        ];

        const posts = [];
        for (const data of postData) {
            posts.push(await Post.create({
                topicId: data.topic._id,
                authorId: data.author._id,
                content: data.content,
                tags: data.tags || []
            }));
        }

        // Add bulk posts to showcase pagination in the JavaScript topic
        console.log('📝 Generating bulk posts for pagination demo...');
        for (let i = 1; i <= 15; i++) {
            const randomAuthor = users[i % users.length];
            await Post.create({
                topicId: subtopics[0]._id, // JavaScript
                authorId: randomAuthor._id,
                content: `Post nr ${i}: Kontynuujemy dyskusję o przyszłości web developmentu. Sprawdźcie przydatne materiały tutaj: [Dokumentacja MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript).`,
                tags: [tags[0]._id]
            });
        }

        console.log('✅ Posts created (including bulk for pagination).');

        // 6. Create interactions
        // Add some random likes
        for (let i = 0; i < posts.length; i++) {
            const likeCount = Math.floor(Math.random() * 5);
            for (let j = 0; j < likeCount; j++) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                try {
                    await PostLike.create({ postId: posts[i]._id, userId: randomUser._id });
                } catch (e) { /* ignore duplicate likes */ }
            }
            await Post.findByIdAndUpdate(posts[i]._id, { likeCount });
        }

        // Add a block to show functionality
        await TopicBlock.create({
            topicId: programming._id,
            userId: users[5]._id, // Stella
            blockedBy: admin._id,
            reason: 'Too many QA questions!',
            exceptions: [subtopics[0]._id] // Still allowed in JS
        });

        console.log('✅ Interactions and blocks created.');

        console.log('\n🚀 Expanded database seeding completed successfully!');
        console.log('--- Credentials ---');
        console.log('Admin: admin@progtalk.com / admin123');
        console.log('Users (all): user123');
        console.log('-------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
