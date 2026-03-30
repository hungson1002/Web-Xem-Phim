import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Auth from '../models/Auth.model.js';

dotenv.config();

const migrate = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const result = await Auth.updateMany(
        { role: { $exists: false } },
        { $set: { role: 'user' } }
    );

    console.log(`Updated ${result.modifiedCount} documents`);
    await mongoose.disconnect();
};

migrate().catch(console.error);
