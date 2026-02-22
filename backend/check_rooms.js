import mongoose from 'mongoose';
import { Room } from './models/Room.js';

async function checkRooms() {
    try {
        const MONGO_URI = 'mongodb+srv://hirdeshkumarchaurasia_db_user:Hridesh%402005@cluster0.kmsdc9q.mongodb.net/';
        await mongoose.connect(MONGO_URI);
        const admin = mongoose.connection.useDb('admin').admin();
        const dbs = await admin.listDatabases();
        console.log('Databases:', dbs.databases.map(d => d.name));

        for (const dbInfo of dbs.databases) {
            const db = mongoose.connection.useDb(dbInfo.name);
            const collections = await db.db.listCollections().toArray();
            console.log(`DB: ${dbInfo.name}, Collections:`, collections.map(c => c.name));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRooms();
