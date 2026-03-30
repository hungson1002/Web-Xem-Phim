import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.PORT = process.env.PORT || '4000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_local_secret';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const mongod = await MongoMemoryServer.create({
    instance: {
        dbName: 'web_xem_phim'
    }
});

process.env.MONGODB_URI = mongod.getUri();
console.log(`[memory-db] MongoDB started at ${process.env.MONGODB_URI}`);

await import('./src/server.js');

const shutdown = async () => {
    try {
        await mongod.stop();
    } finally {
        process.exit(0);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
