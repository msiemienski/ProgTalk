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

        const userData = [
            { email: 'john@example.com', name: 'John Coder', bio: 'Just here for the JS tips.' },
            { email: 'dev_jane@example.com', name: 'Jane Dev', bio: 'Fullstack enthusiast.' },
            { email: 'bob@example.com', name: 'Bob Builder', bio: 'I like infrastructure.' },
            { email: 'alice@example.com', name: 'Alice in DevLand', bio: 'Curious about everything.' },
            { email: 'charlie@example.com', name: 'Charlie Bitme', bio: 'Backend wizard.' },
            { email: 'stella@example.com', name: 'Stella Artois', bio: 'Quality Assurance is my passion.' },
        ];

        const users = {};
        for (const data of userData) {
            const user = await User.create({
                email: data.email,
                password: userPassword,
                role: 'user',
                status: 'active',
                profile: { name: data.name, bio: data.bio },
                approvedAt: new Date(),
                approvedBy: admin._id,
            });
            users[data.email] = user;
        }

        console.log('✅ Users created.');

        // 2. Create Tags
        const tags = [];
        const tagNames = ['JavaScript', 'TypeScript', 'Vue.js', 'React', 'Node.js', 'MongoDB', 'Docker', 'CSS', 'Architecture', 'Python', 'Go', 'Kubernetes', 'AWS', 'Azure'];
        const colors = ['#f7df1e', '#3178c6', '#42b883', '#61dafb', '#339933', '#47a248', '#2496ed', '#1572b6', '#ff4d4d', '#3776ab', '#00add8', '#326ce5', '#FF9900', '#007FFF'];

        for (let i = 0; i < tagNames.length; i++) {
            tags.push(await Tag.create({
                name: tagNames[i],
                category: 'concept',
                color: colors[i],
                createdBy: admin._id
            }));
        }

        console.log('✅ Tags created.');

        // 3. Create Topics hierarchy
        const createTopic = async (name, description, parentId = null, mainMod = admin) => {
            const topic = await Topic.create({
                name,
                description,
                parentId,
                mainModeratorId: mainMod._id
            });

            // Increment parent's subtopic count
            if (parentId) {
                await Topic.findByIdAndUpdate(parentId, { $inc: { subtopicCount: 1 } });
            }

            // Create TopicModerator entry
            await TopicModerator.create({
                topicId: topic._id,
                userId: mainMod._id,
                assignedBy: admin._id,
                isMain: true
            });

            return topic;
        };

        const addModerator = async (topicId, userId) => {
            try {
                await TopicModerator.create({
                    topicId,
                    userId,
                    assignedBy: admin._id,
                    isMain: false
                });
            } catch (e) { /* ignore duplicate */ }
        };

        // Programming subtree
        const tProgramming = await createTopic('Programming', 'General discussions about coding.', null, admin);
        await addModerator(tProgramming._id, mod._id);

        const tJS = await createTopic('JavaScript', 'The language of the web.', tProgramming._id, users['john@example.com']);
        const tVue = await createTopic('Vue.js', 'Progressive Framework.', tJS._id, users['john@example.com']);
        const tNode = await createTopic('Node.js', 'Server-side runtime.', tJS._id, users['dev_jane@example.com']);

        const tPython = await createTopic('Python', 'Snake language for AI and script.', tProgramming._id, users['charlie@example.com']);

        // Web subtree
        const tWeb = await createTopic('Web Development', 'Building apps.', null, admin);
        await addModerator(tWeb._id, users['alice@example.com']);
        const tFrontend = await createTopic('Frontend', 'Everything UI.', tWeb._id, users['alice@example.com']);
        const tBackend = await createTopic('Backend', 'Servers and DBs.', tWeb._id, users['charlie@example.com']);

        // DevOps subtree
        const tDevOps = await createTopic('DevOps & Infrastructure', 'Tools and cloud.', null, admin);
        const tDocker = await createTopic('Docker', 'Container mastery.', tDevOps._id, admin);
        const tCloud = await createTopic('Cloud Services', 'The cloud giants.', tDevOps._id, users['bob@example.com']);
        const tAWS = await createTopic('AWS', 'Amazon Web Services.', tCloud._id, users['bob@example.com']);
        const tAzure = await createTopic('Azure', 'Microsoft Cloud.', tCloud._id, users['bob@example.com']);

        console.log('✅ Topics hierarchy created.');

        // 4. Create blocks with exceptions
        // Stella (QA) is blocked in Programming but has access to JS (Inherited exception Node/Vue)
        await TopicBlock.create({
            topicId: tProgramming._id,
            userId: users['stella@example.com']._id,
            blockedBy: admin._id,
            reason: 'Quality Assurance experts must focus on implementation details.',
            exceptions: [tJS._id]
        });

        // Charlie is blocked in DevOps but has access to Cloud Services (Recursion test: Cloud -> AWS, Azure)
        await TopicBlock.create({
            topicId: tDevOps._id,
            userId: users['charlie@example.com']._id,
            blockedBy: admin._id,
            reason: 'Charlie is banned from general DevOps discussions but cloud is okay.',
            exceptions: [tCloud._id]
        });

        // Jane Dev is blocked in Web Development with NO exceptions
        await TopicBlock.create({
            topicId: tWeb._id,
            userId: users['dev_jane@example.com']._id,
            blockedBy: admin._id,
            reason: 'Access denied for general Web Dev.',
            exceptions: []
        });

        console.log('✅ Blocks with exceptions created.');

        // 5. Create Posts
        const createPost = async (topic, author, content, postTags = []) => {
            return await Post.create({
                topicId: topic._id,
                authorId: author._id,
                content,
                tags: postTags
            });
        };

        await createPost(tJS, users['john@example.com'], 'Welcome to the JavaScript subtopic! Feel free to ask about ES2024.', [tags[0]._id]);
        await createPost(tVue, users['john@example.com'], 'Check out the new Composition API tips.', [tags[2]._id]);
        await createPost(tNode, users['dev_jane@example.com'], 'Native testing in Node.js 20 is actually great.', [tags[4]._id]);
        await createPost(tAWS, users['bob@example.com'], 'AWS Lambda now supports even faster cold starts.', [tags[12]._id]);
        await createPost(tDocker, admin, 'Multi-stage builds are a must for production images.', [tags[6]._id]);

        // Add some "Inherited Moderator" status proof posts
        await createPost(tProgramming, mod, 'As a moderator of the entire Programming section, I welcome you.', [tags[8]._id]);
        await createPost(tWeb, users['alice@example.com'], 'Alice here, helping organize Web discussions.', [tags[7]._id]);

        console.log('✅ Posts created.');

        console.log('\n🚀 Advanced seeding completed successfully!');
        console.log('--- Case Study ---');
        console.log('1. Stella: Blocked in Root "Programming", but can see "JS", "Vue" and "Node" (Exceptions inherited).');
        console.log('2. Charlie: Blocked in Root "DevOps", but can see "Cloud", "AWS" and "Azure" (Recursive exceptions).');
        console.log('3. Jane Dev: Blocked in "Web Dev" - zero access to that tree.');
        console.log('--- Credentials ---');
        console.log('Admin: admin@progtalk.com / admin123');
        console.log('Users: user123');
        console.log('-------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
