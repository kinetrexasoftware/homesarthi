
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const updateRecentUserLocation = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find the most recent user
        const user = await User.findOne().sort({ createdAt: -1 });

        if (!user) {
            console.log('No users found.');
            return;
        }

        console.log(`Found most recent user: ${user.name} (${user.email})`);
        console.log('Current Location:', user.location);

        if (!user.location || !user.location.city) {
            console.log('Updating location to Lucknow, Uttar Pradesh...');
            user.location = {
                city: 'Lucknow',
                state: 'Uttar Pradesh',
                country: 'India'
            };
            await user.save();
            console.log('User location updated successfully.');
        } else {
            console.log('User already has location set.');
        }

        // Also check if there are other users without location and update them to Lucknow for demo purposes
        // This helps fill the chart
        const result = await User.updateMany(
            { 'location.city': { $exists: false } },
            {
                $set: {
                    location: {
                        city: 'Lucknow',
                        state: 'Uttar Pradesh',
                        country: 'India'
                    }
                }
            }
        );
        console.log(`Updated ${result.modifiedCount} other users with missing location data to default (Lucknow).`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

updateRecentUserLocation();
