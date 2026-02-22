import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email'
    }
  },
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: function () { return !this.googleId; },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: function () { return !this.googleId; },
    validate: {
      validator: function (phone) {
        if (!phone) return true; // Allow empty for google users
        return /^\+?[\d\s\-\(\)]+$/.test(phone);
      },
      message: 'Please enter a valid phone number'
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  pushToken: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    trim: true
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['student', 'owner', 'admin'],
    default: 'student'
  },
  college: {
    type: String,
    trim: true
  },
  avatar: {
    url: String,
    publicId: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['id_proof', 'address_proof', 'college_id'],
      required: true
    },
    url: String,
    publicId: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  savedRooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'active'
  },
  suspensionReason: String,
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  suspendedAt: Date,
  lastLogin: Date,
  location: {
    city: {
      type: String,
      trim: true,
      set: (v) => v ? v.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : v
    },
    state: {
      type: String,
      trim: true,
      set: (v) => v ? v.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : v
    },
    country: { type: String, default: 'India' },
    pincode: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      // Category-level control
      categories: {
        messages: { type: Boolean, default: true },      // Chat notifications
        visits: { type: Boolean, default: true },        // Visit request/updates
        roomUpdates: { type: Boolean, default: true },   // Room approval/status
        admin: { type: Boolean, default: true },         // Admin actions
        support: { type: Boolean, default: true },       // Support tickets
        marketing: { type: Boolean, default: false }     // Promotional (opt-in)
      },
      // Quiet hours (users won't get push notifications during this time)
      quietHours: {
        enabled: { type: Boolean, default: false },
        start: { type: String, default: '22:00' },
        end: { type: String, default: '08:00' }
      }
    },
    privacy: {
      showPhone: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: false }
    }
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  deletionRequested: {
    type: Boolean,
    default: false
  },
  deletionRequestedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ verified: 1 });
userSchema.index({ 'location.city': 1 });
userSchema.index({ 'location.state': 1 });
userSchema.index({ role: 1, 'location.city': 1 });

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function () {
  let completion = 0;
  if (this.name) completion += 30;
  if (this.avatar && this.avatar.url) completion += 40;
  if (this.bio) completion += 30;
  return completion;
});

// Virtual for full profile completion status
userSchema.virtual('isProfileComplete').get(function () {
  return this.profileCompletion === 100;
});

// Pre-save middleware to generate customId
userSchema.pre('save', async function (next) {
  if (this.customId) return next();

  let prefix = '';
  if (this.role === 'owner') prefix = '9';
  else if (this.role === 'student') prefix = '0';
  else if (this.role === 'admin') prefix = '1';

  if (!prefix) return next();

  let isUnique = false;
  let newId = '';

  while (!isUnique) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
    newId = prefix + randomDigits;

    // Check if ID already exists
    const existingUser = await this.constructor.findOne({ customId: newId });
    if (!existingUser) {
      isUnique = true;
    }
  }

  this.customId = newId;
  next();
});

// Pre-save middleware to auto-verify admin and owner
userSchema.pre('save', function (next) {
  if ((this.role === 'admin' || this.role === 'owner') && !this.verified) {
    this.verified = true;
  }
  next();
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Instance method to generate numeric OTP
userSchema.methods.generateResetOtp = function () {
  // Generate 6 digit random number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash it and store it (optional, but good practice, here we store plain for simplicity/debugging if needed, 
  // but to match previous pattern let's store it directly as it is short lived)
  // Actually, let's just store it. 
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 5 * 60 * 1000; // 5 minutes (as requested)

  return otp;
};

// Static method to find users by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role, isBlocked: false });
};

// Static method to get user stats
userSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        verified: { $sum: { $cond: ['$verified', 1, 0] } },
        blocked: { $sum: { $cond: ['$isBlocked', 1, 0] } }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      total: stat.count,
      verified: stat.verified,
      blocked: stat.blocked,
      active: stat.count - stat.blocked
    };
    return acc;
  }, {});
};

export const User = mongoose.model('User', userSchema);
