import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Auth from '../models/Auth.model.js';
import Role from '../models/Role.model.js';

dotenv.config();

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
    console.log('Roles created:', userRole._id, adminRole._id);

    // 2. Gán adminRole cho user có role: 'admin' (field cũ)
    const adminResult = await Auth.updateMany(
        { role: 'admin' },
        { $set: { roleId: adminRole._id }, $unset: { role: '' } }
    );
    console.log(`Admin users migrated: ${adminResult.modifiedCount}`);

    // 3. Gán userRole cho tất cả user còn lại chưa có roleId
    const userResult = await Auth.updateMany(
        { roleId: { $exists: false } },
        { $set: { roleId: userRole._id }, $unset: { role: '' } }
    );
    console.log(`Regular users migrated: ${userResult.modifiedCount}`);

    await mongoose.disconnect();
    console.log('Done!');
};

migrate().catch(console.error);
