import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.join(__dirname, '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

console.log('\n=== Environment Variables ===');
console.log('MONGO_URI:', process.env.MONGO_URI ? `${process.env.MONGO_URI.substring(0, 30)}...` : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('CLOUDINARY_NAME:', process.env.CLOUDINARY_NAME || 'NOT SET');

console.log('\n=== Testing MongoDB Connection ===');
import mongoose from 'mongoose';

try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.name);
    await mongoose.disconnect();
    console.log('✅ Disconnected');
    process.exit(0);
} catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
}
