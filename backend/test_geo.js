import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const RoomSchema = new mongoose.Schema({}, { strict: false });
const Room = mongoose.model('Room', RoomSchema);

async function testSearch() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error('MONGO_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const searchLat = 26.9363415;
        const searchLng = 80.8980289;
        const searchRadius = 10000;

        const matchQuery = {
            'verification.status': 'approved',
            isActive: true,
            'availability.status': 'available'
        };

        const pipeline = [
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [searchLng, searchLat]
                    },
                    distanceField: 'distance',
                    distanceMultiplier: 1,
                    maxDistance: searchRadius,
                    spherical: true,
                    query: matchQuery
                }
            }
        ];

        const results = await Room.aggregate(pipeline);
        console.log(`Results found: ${results.length}`);
        results.forEach(r => {
            console.log(`- ${r.title}: ${r.distance}m away`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}
testSearch();
