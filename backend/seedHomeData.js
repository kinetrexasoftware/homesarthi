import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { FAQ } from './models/FAQ.js';
import { Testimonial } from './models/Testimonial.js';

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for Seeding...');

        // FAQs
        const faqs = [
            {
                question: "Is listing verification guaranteed?",
                answer: "All property owners must submit government-issued IDs and ownership proof. Our admin team verifies each listing within 24-48 hours before it goes live.",
                category: "students",
                order: 1
            },
            {
                question: "Can I visit the room before booking?",
                answer: "Yes! Use our built-in visit request feature to schedule a viewing with the owner. We recommend always visiting before making any commitments.",
                category: "students",
                order: 2
            },
            {
                question: "What if I face issues with a listing?",
                answer: "Report any concerns through our platform. Our support team investigates all reports and takes action within 24 hours, including suspension of unverified claims.",
                category: "students",
                order: 3
            },
            {
                question: "Is listing my property free?",
                answer: "Yes, listing is completely free. We don't charge any commission or subscription fees. You only pay if you choose premium promotion features.",
                category: "owners",
                order: 1
            },
            {
                question: "How long does verification take?",
                answer: "Typically 24-48 hours. Upload clear photos of your ID and ownership documents for faster approval.",
                category: "owners",
                order: 2
            }
        ];

        await FAQ.deleteMany({});
        await FAQ.insertMany(faqs);
        console.log('FAQs Seeded');

        // Testimonials (Cleared for Trust-First Approach)
        await Testimonial.deleteMany({});
        console.log('Testimonials Cleared (No hardcoded reviews seeding)');

        console.log('Seeding Complete');
        process.exit(0);

    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
};

seedData();
