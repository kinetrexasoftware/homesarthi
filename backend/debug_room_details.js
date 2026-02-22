import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const RoomSchema = new mongoose.Schema({}, { strict: false });
const Room = mongoose.model('Room', RoomSchema);

async function checkRooms() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb+srv://hirdeshkumarchaurasia_db_user:Hridesh%402005@cluster0.kmsdc9q.mongodb.net/';
        await mongoose.connect(uri);
        const r = await Room.findOne({ title: /BRAHMAND/i });
        if (r) {
            console.log('Room Found:');
            console.log({
                roomType: r.roomType,
                sharingType: r.sharingType,
                genderPreference: r.genderPreference,
                amenities: r.amenities
            });
        }
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}
checkRooms();
