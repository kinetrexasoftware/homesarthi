import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import bcrypt from 'bcryptjs';

const seedTestData = async () => {
  try {
    console.log('🌱 Seeding test data...');

    // Create a verified owner
    const ownerPassword = await bcrypt.hash('password123', 10);
    const owner = await User.create({
      name: 'Test Owner',
      email: 'owner@test.com',
      password: ownerPassword,
      phone: '9876543210',
      role: 'owner',
      verified: true,
      status: 'active'
    });

    // Create a student
    const studentPassword = await bcrypt.hash('password123', 10);
    const student = await User.create({
      name: 'Test Student',
      email: 'student@test.com',
      password: studentPassword,
      phone: '9876543211',
      role: 'student',
      college: 'Test University',
      status: 'active'
    });

    // Create an admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: adminPassword,
      phone: '9876543212',
      role: 'admin',
      verified: true,
      status: 'active'
    });

    // Create approved rooms
    const rooms = await Room.create([
      {
        title: 'Spacious 2BHK Apartment',
        description: 'Beautiful apartment near university campus',
        rent: {
          amount: 15000,
          period: 'month'
        },
        roomType: 'double',
        address: {
          street: '123 University Road',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        },
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716] // Bangalore coordinates
        },
        amenities: ['wifi', 'ac', 'parking'],
        images: [{
          url: 'https://via.placeholder.com/400x300?text=Room+1',
          publicId: 'test1'
        }],
        owner: owner._id,
        verification: {
          status: 'approved',
          verifiedBy: admin._id,
          verifiedAt: new Date()
        },
        availability: {
          status: 'available',
          availableFrom: new Date()
        },
        isActive: true,
        genderPreference: 'any'
      },
      {
        title: 'Cozy Single Room',
        description: 'Perfect for students',
        rent: {
          amount: 8000,
          period: 'month'
        },
        roomType: 'single',
        address: {
          street: '456 College Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        },
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716]
        },
        amenities: ['wifi', 'food'],
        images: [{
          url: 'https://via.placeholder.com/400x300?text=Room+2',
          publicId: 'test2'
        }],
        owner: owner._id,
        verification: {
          status: 'approved',
          verifiedBy: admin._id,
          verifiedAt: new Date()
        },
        availability: {
          status: 'available',
          availableFrom: new Date()
        },
        isActive: true,
        genderPreference: 'any'
      }
    ]);

    console.log('✅ Test data seeded successfully!');
    console.log('📧 Test Accounts:');
    console.log('   Owner: owner@test.com / password123');
    console.log('   Student: student@test.com / password123');
    console.log('   Admin: admin@test.com / admin123');
    console.log(`🏠 Created ${rooms.length} test rooms`);

    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

export default seedTestData;
