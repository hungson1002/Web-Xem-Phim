import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Dùng raw collection để bypass Mongoose strict mode
    const collection = mongoose.connection.collection('auths');

    const result = await collection.updateMany(
        { role: { $exists: true } },
        { $unset: { role: '' } }
    );

    console.log(`Removed "role" field from ${result.modifiedCount} documents`);
    await mongoose.disconnect();
    console.log('Done!');
};

run().catch(console.error);
