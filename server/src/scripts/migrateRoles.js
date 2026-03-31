import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Auth from '../models/Auth.model.js';
import Role from '../models/Role.model.js';

dotenv.config();

// Điền email hoặc username của tài khoản admin vào đây
const ADMIN_EMAILS = ['ngoctrucnguyen3012@gmail.com'];

const migrate = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // 1. Tạo 2 roles nếu chưa có
    const userRole = await Role.findOneAndUpdate(
        { name: 'user' },
        { name: 'user', description: 'Regular user' },
        { upsert: true, new: true }
    );
    const adminRole = await Role.findOneAndUpdate(
        { name: 'admin' },
        { name: 'admin', description: 'Administrator' },
        { upsert: true, new: true }
    );
    console.log('Roles seeded - user:', userRole._id, '| admin:', adminRole._id);

    // 2. Gán adminRole cho các tài khoản admin theo email
    const adminResult = await Auth.updateMany(
        { email: { $in: ADMIN_EMAILS } },
        { $set: { roleId: adminRole._id } }
    );
    console.log(`Admin users updated: ${adminResult.modifiedCount}`);

    // 3. Gán userRole cho tất cả user còn lại chưa có roleId hoặc roleId là null
    const userResult = await Auth.updateMany(
        { $or: [{ roleId: { $exists: false } }, { roleId: null }] },
        { $set: { roleId: userRole._id } }
    );
    console.log(`Regular users updated: ${userResult.modifiedCount}`);

    // 4. Verify
    const adminCount = await Auth.countDocuments({ roleId: adminRole._id });
    const userCount = await Auth.countDocuments({ roleId: userRole._id });
    console.log(`\nResult: ${adminCount} admin(s), ${userCount} user(s)`);

    await mongoose.disconnect();
    console.log('Done!');
};

migrate().catch(console.error);
