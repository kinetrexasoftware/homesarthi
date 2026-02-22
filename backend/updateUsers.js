import mongoose from 'mongoose';
import { User } from './models/User.js';

const MONGO_URI = 'mongodb+srv://hirdeshkumarchaurasia_db_user:Hridesh%402005@cluster0.kmsdc9q.mongodb.net/';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({ customId: { $exists: false } });
        console.log(`Found ${users.length} users without customId`);

        for (const user of users) {
            let prefix = '';
            if (user.role === 'owner') prefix = '9';
            else if (user.role === 'student') prefix = '0';
            else if (user.role === 'admin') prefix = '1';

            if (!prefix) continue;

            let isUnique = false;
            let newId = '';

            while (!isUnique) {
                const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
                newId = prefix + randomDigits;
                const existingUser = await User.findOne({ customId: newId });
                if (!existingUser) isUnique = true;
            }

            await User.updateOne({ _id: user._id }, { $set: { customId: newId } });
            console.log(`Updated ${user.email} with customId: ${newId}`);
        }

        console.log('Update complete');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error updating users:', error);
        process.exit(1);
    }
}

run();
