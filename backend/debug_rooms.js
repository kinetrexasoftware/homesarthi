import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const RoomSchema = new mongoose.Schema({
    title: String,
    location: {
        address: {
            city: String,
            state: String
        },
        coordinates: [Number]
    },
    verification: {
        status: String
    },
    isActive: Boolean,
    availability: {
        status: String
    }
}, { strict: false });

const Room = mongoose.model('Room', RoomSchema);

async function checkRooms() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb+srv://hirdeshkumarchaurasia_db_user:Hridesh%402005@cluster0.kmsdc9q.mongodb.net/';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const rooms = await Room.find({});
        console.log(`Total rooms found: ${rooms.length}`);

        rooms.forEach((r, i) => {
            console.log(`\nRoom ${i + 1}: ${r.title}`);
            console.log(`  City: ${r.location?.address?.city}`);
            console.log(`  State: ${r.location?.address?.state}`);
            console.log(`  Status: ${r.verification?.status}`);
            console.log(`  Active: ${r.isActive}`);
            console.log(`  Available: ${r.availability?.status}`);
            console.log(`  Coords: ${JSON.stringify(r.location?.coordinates)}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkRooms();
