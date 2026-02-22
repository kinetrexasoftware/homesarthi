import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const RoomSchema = new mongoose.Schema({}, { strict: false });
const Room = mongoose.model('Room', RoomSchema);

async function debugQuery() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb+srv://hirdeshkumarchaurasia_db_user:Hridesh%402005@cluster0.kmsdc9q.mongodb.net/';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const city = "Lucknow";
        const state = "Uttar Pradesh";

        const query = {
            'verification.status': 'approved',
            isActive: true,
            'availability.status': 'available'
        };

        if (city) {
            query['location.address.city'] = new RegExp(city, 'i');
        }
        if (state) {
            query['location.address.state'] = new RegExp(state, 'i');
        }

        console.log('Query:', JSON.stringify(query, (k, v) => v instanceof RegExp ? v.toString() : v, 2));

        const count = await Room.countDocuments(query);
        console.log('Count:', count);

        const samples = await Room.find(query).limit(2);
        console.log('Sample IDs:', samples.map(s => s._id));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}
debugQuery();
