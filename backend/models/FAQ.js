import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, enum: ['general', 'students', 'owners'], default: 'general' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const FAQ = mongoose.model('FAQ', faqSchema);
