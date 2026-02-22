import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    aliases: [{
        type: String,
        trim: true
    }],
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true
        }
    },
    address: {
        city: String,
        state: String,
        zipCode: String
    },
    type: {
        type: String,
        enum: ['college', 'university', 'landmark', 'area'],
        default: 'college'
    },
    verified: {
        type: Boolean,
        default: false
    },
    popularityScore: {
        type: Number,
        default: 0
    },
    metadata: {
        osmId: String,
        website: String
    }
}, { timestamps: true });

// GeoJSON index for radius search
collegeSchema.index({ location: '2dsphere' });

// Text index for basic search fallback
collegeSchema.index({ name: 'text', aliases: 'text' });

const College = mongoose.model('College', collegeSchema);

export default College;
