import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ADMIN_EMAIL = 'admin@progtalk.com';
const ADMIN_PASSWORD = 'admin123';

async function seedAdmin() {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

        if (existingAdmin) {
            console.log(`ℹ️ Admin user already exists (Role: ${existingAdmin.role}, Status: ${existingAdmin.status})`);

            // Ensure it has admin rights and active status
            if (existingAdmin.role !== 'admin' || existingAdmin.status !== 'active') {
                console.log('🔄 Updating existing user to Admin/Active status...');
                existingAdmin.role = 'admin';
                existingAdmin.status = 'active';
                await existingAdmin.save();
                console.log('✅ Updated successfully.');
            }
        } else {
            console.log('🌱 Creating new admin user...');
            const admin = new User({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD, // Will be hashed by pre-save hook in User model
                role: 'admin',
                status: 'active',
                profile: {
                    name: 'Global Admin',
                    bio: 'Automated system administrator'
                },
                approvedAt: new Date()
            });

            await admin.save();
            console.log('✅ Admin user created successfully!');
        }

        console.log('\nCredentials:');
        console.log(`📧 Email: ${ADMIN_EMAIL}`);
        console.log(`🔑 Password: ${ADMIN_PASSWORD}`);

    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
        process.exit();
    }
}

seedAdmin();
