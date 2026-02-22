import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Notification } from '../models/Notification.js';

dotenv.config();

const clean = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected for cleanup...');

        // Delete all message notifications where sender is the same as the user (self-notifications)
        const result = await Notification.deleteMany({
            type: 'message',
            title: { $in: ['hridesh kumar', 'Hridesh Kumar', 'Hridesh kumar'] }
        });

        console.log(`Successfully cleaned up ${result.deletedCount} self-notifications.`);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
};

clean();
