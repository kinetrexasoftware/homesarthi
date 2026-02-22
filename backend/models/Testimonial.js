import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    college: { type: String, required: true },
    city: { type: String, required: true },
    message: { type: String, required: true, maxlength: 200 },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export const Testimonial = mongoose.model('Testimonial', testimonialSchema);
