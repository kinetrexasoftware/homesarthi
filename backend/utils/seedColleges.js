import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import College from '../models/College.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://hirdeshkumarchaurasia_db_user:Hridesh%402005@cluster0.kmsdc9q.mongodb.net/';

const seedColleges = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        const dataPath = path.join(__dirname, '../data/colleges.json');
        if (!fs.existsSync(dataPath)) {
            console.error('Colleges data file not found at:', dataPath);
            process.exit(1);
        }

        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        console.log(`Found ${data.length} colleges in JSON.`);

        const formatted = data.map(c => ({
            name: c.name,
            location: {
                type: 'Point',
                coordinates: [c.coordinates.longitude, c.coordinates.latitude]
            },
            address: {
                city: c.city || 'Lucknow',
                state: 'Uttar Pradesh'
            },
            type: 'college',
            verified: true,
            popularityScore: Math.floor(Math.random() * 100)
        }));

        console.log('Clearing existing colleges...');
        await College.deleteMany({ type: 'college' });

        console.log('Inserting data...');
        await College.insertMany(formatted);

        console.log('Seeding complete! Successfully added', formatted.length, 'colleges.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedColleges();
