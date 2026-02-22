import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Room title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Room description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Room owner is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Room coordinates are required'],
      validate: {
        validator: function (coords) {
          return coords.length === 2 && coords[0] >= -180 && coords[0] <= 180 &&
            coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Invalid coordinates'
      }
    },
    address: {
      street: String,
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        set: (v) => v ? v.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : v
      },
      state: {
        type: String,
        trim: true,
        set: (v) => v ? v.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : v
      },
      country: {
        type: String,
        default: 'India'
      },
      zipCode: String
    },
    landmark: String,
    locationVisibility: {
      type: String,
      enum: ['approximate', 'exact'],
      default: 'approximate'
    },
    exactLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function (coords) {
            if (!coords || coords.length === 0) return true; // Optional
            return coords.length === 2 && coords[0] >= -180 && coords[0] <= 180 &&
              coords[1] >= -90 && coords[1] <= 90;
          },
          message: 'Invalid exact location coordinates'
        }
      }
    }
  },
  rent: {
    amount: {
      type: Number,
      required: [true, 'Rent amount is required'],
      min: [0, 'Rent cannot be negative']
    },
    deposit: {
      type: Number,
      default: 0,
      min: [0, 'Deposit cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    period: {
      type: String,
      enum: ['month', 'day', 'week'],
      default: 'month'
    },
    negotiable: {
      type: Boolean,
      default: false
    },
    electricityBillIncluded: {
      type: Boolean,
      default: false
    }
  },
  roomType: {
    type: String,
    enum: ['1RK', '1BHK', '2BHK', '3BHK', 'single', 'double', 'triple', 'shared', 'PG', 'Hostel', 'Flat', 'Individual', 'apartment', 'house'],
    required: [true, 'Room type is required']
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available'
    },
    availableFrom: {
      type: Date,
      default: Date.now
    },
    minimumStay: {
      duration: Number, // in months
      unit: {
        type: String,
        enum: ['month', 'day'],
        default: 'month'
      }
    }
  },
  amenities: [{
    type: String,
    enum: [
      'wifi', 'parking', 'laundry', 'kitchen', 'ac', 'heater',
      'gym', 'security', 'water_heater', 'washing_machine',
      'microwave', 'fridge', 'tv', 'balcony', 'furnished',
      'study_room', 'food', 'water_purifier'
    ]
  }],
  sharingType: {
    type: String,
    enum: ['private', 'shared'],
    default: 'private'
  },
  furnishing: {
    type: String,
    enum: ['unfurnished', 'semi-furnished', 'furnished', 'fully-furnished'],
    default: 'semi-furnished'
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required']
  },
  genderPreference: {
    type: String,
    enum: ['male', 'female', 'any'],
    default: 'any'
  },
  images: {
    type: [{
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      },
      isPrimary: {
        type: Boolean,
        default: false
      },
      caption: String
    }],
    validate: {
      validator: function (val) {
        return val.length <= 5;
      },
      message: 'You can only upload up to 5 images (1 thumbnail + 4 room images)'
    }
  },
  verification: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending'
    },
    electricBill: {
      url: {
        type: String,
        required: [true, 'Electric bill photo is mandatory']
      },
      publicId: {
        type: String,
        required: [true, 'Electric bill publicId is required']
      }
    },
    aadhaarCard: {
      url: {
        type: String,
        required: [true, 'Aadhaar card photo is mandatory']
      },
      publicId: {
        type: String,
        required: [true, 'Aadhaar card publicId is required']
      }
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    rejectionReason: String,
    documents: [{
      type: {
        type: String,
        enum: ['property_proof', 'ownership_proof', 'id_proof']
      },
      url: String,
      publicId: String
    }]
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    favorites: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    },
    visitRequests: {
      type: Number,
      default: 0
    },
    reportScore: {
      type: Number,
      default: 0
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  rules: [{
    type: String,
    maxlength: [200, 'Rule cannot exceed 200 characters']
  }],
  nearbyFacilities: [{
    type: {
      type: String,
      enum: ['college', 'hospital', 'market', 'metro', 'bus_stop']
    },
    name: String,
    distance: Number, // in meters
    walkingTime: Number // in minutes
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
roomSchema.index({ location: '2dsphere' });
roomSchema.index({ owner: 1 });
roomSchema.index({ 'verification.status': 1 });
roomSchema.index({ roomType: 1 });
roomSchema.index({ 'rent.amount': 1 });
roomSchema.index({ amenities: 1 });
roomSchema.index({ genderPreference: 1 });
roomSchema.index({ isActive: 1 });
roomSchema.index({ featured: 1 });
roomSchema.index({ createdAt: -1 });

// Virtual for average rating
roomSchema.virtual('averageRating').get(function () {
  if (!this.reviews || this.reviews.length === 0) return 0;
  return this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.reviews.length;
});

// Virtual for review count
roomSchema.virtual('reviewCount').get(function () {
  return this.reviews ? this.reviews.length : 0;
});

// Instance method to increment views
roomSchema.methods.incrementViews = async function () {
  this.stats.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to check if room is available for user
roomSchema.methods.isAvailableFor = function (user) {
  if (!this.isActive) return false;
  if (this.verification.status !== 'approved') return false;
  if (this.availability.status !== 'available') return false;

  // Check gender preference
  if (this.genderPreference !== 'any' && user.gender !== this.genderPreference) {
    return false;
  }

  return true;
};

// Static method to find nearby rooms
roomSchema.statics.findNearby = function (longitude, latitude, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true,
    'verification.status': 'approved',
    'availability.status': 'available'
  });
};

// Static method to get room statistics
roomSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalRooms: { $sum: 1 },
        activeRooms: { $sum: { $cond: ['$isActive', 1, 0] } },
        verifiedRooms: { $sum: { $cond: [{ $eq: ['$verification.status', 'approved'] }, 1, 0] } },
        pendingVerification: { $sum: { $cond: [{ $eq: ['$verification.status', 'pending'] }, 1, 0] } },
        avgRent: { $avg: '$rent.amount' },
        totalViews: { $sum: '$stats.views' },
        totalFavorites: { $sum: '$stats.favorites' }
      }
    }
  ]);

  return stats[0] || {
    totalRooms: 0,
    activeRooms: 0,
    verifiedRooms: 0,
    pendingVerification: 0,
    avgRent: 0,
    totalViews: 0,
    totalFavorites: 0
  };
};

// Pre-save middleware to set primary image
roomSchema.pre('save', function (next) {
  if (this.images && this.images.length > 0 && !this.images.some(img => img.isPrimary)) {
    this.images[0].isPrimary = true;
  }
  next();
});

export const Room = mongoose.model('Room', roomSchema);
