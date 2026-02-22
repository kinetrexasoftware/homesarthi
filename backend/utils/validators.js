import validator from 'validator';

/**
 * Comprehensive validation utilities for the StayHome application
 * Provides input validation, sanitization, and business rule validation
 */

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

/**
 * User input validation
 */
export const userValidators = {
  /**
   * Validate email format and constraints
   */
  email: (email) => {
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required', 'email');
    }

    const trimmedEmail = email.trim();
    if (!validator.isEmail(trimmedEmail)) {
      throw new ValidationError('Please provide a valid email address', 'email');
    }

    if (trimmedEmail.length > 254) {
      throw new ValidationError('Email address is too long', 'email');
    }

    return trimmedEmail.toLowerCase();
  },

  /**
   * Validate password strength
   */
  password: (password) => {
    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required', 'password');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long', 'password');
    }

    if (password.length > 128) {
      throw new ValidationError('Password cannot exceed 128 characters', 'password');
    }

    // Check for basic complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new ValidationError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'password'
      );
    }

    return password;
  },

  /**
   * Validate name fields
   */
  name: (name, fieldName = 'name') => {
    if (!name || typeof name !== 'string') {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }

    const trimmedName = validator.trim(name);
    if (trimmedName.length < 2) {
      throw new ValidationError(`${fieldName} must be at least 2 characters long`, fieldName);
    }

    if (trimmedName.length > 50) {
      throw new ValidationError(`${fieldName} cannot exceed 50 characters`, fieldName);
    }

    if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      throw new ValidationError(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`, fieldName);
    }

    return trimmedName;
  },

  /**
   * Validate phone number
   */
  phone: (phone) => {
    if (!phone || typeof phone !== 'string') {
      throw new ValidationError('Phone number is required', 'phone');
    }

    const trimmedPhone = phone.replace(/\s+/g, '');
    if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(trimmedPhone)) {
      throw new ValidationError('Please provide a valid Indian phone number', 'phone');
    }

    return trimmedPhone;
  },

  /**
   * Validate user role
   */
  role: (role) => {
    const validRoles = ['student', 'owner', 'admin'];
    if (!role || !validRoles.includes(role)) {
      throw new ValidationError('Invalid user role', 'role');
    }
    return role;
  },

  /**
   * Validate college name
   */
  college: (college) => {
    if (!college || typeof college !== 'string') {
      throw new ValidationError('College name is required for students', 'college');
    }

    const trimmedCollege = validator.trim(college);
    if (trimmedCollege.length < 3) {
      throw new ValidationError('College name must be at least 3 characters long', 'college');
    }

    if (trimmedCollege.length > 100) {
      throw new ValidationError('College name cannot exceed 100 characters', 'college');
    }

    return trimmedCollege;
  }
};

/**
 * Room listing validation
 */
export const roomValidators = {
  /**
   * Validate room title
   */
  title: (title) => {
    if (!title || typeof title !== 'string') {
      throw new ValidationError('Room title is required', 'title');
    }

    const trimmedTitle = validator.trim(title);
    if (trimmedTitle.length < 10) {
      throw new ValidationError('Title must be at least 10 characters long', 'title');
    }

    if (trimmedTitle.length > 100) {
      throw new ValidationError('Title cannot exceed 100 characters', 'title');
    }

    return trimmedTitle;
  },

  /**
   * Validate room description
   */
  description: (description) => {
    if (!description || typeof description !== 'string') {
      throw new ValidationError('Room description is required', 'description');
    }

    const trimmedDescription = validator.trim(description);
    if (trimmedDescription.length < 50) {
      throw new ValidationError('Description must be at least 50 characters long', 'description');
    }

    if (trimmedDescription.length > 2000) {
      throw new ValidationError('Description cannot exceed 2000 characters', 'description');
    }

    return trimmedDescription;
  },

  /**
   * Validate rent amount
   */
  rentAmount: (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      throw new ValidationError('Rent amount is required', 'rent.amount');
    }

    const numAmount = Number(amount);
    if (numAmount <= 0) {
      throw new ValidationError('Rent amount must be greater than 0', 'rent.amount');
    }

    if (numAmount > 100000) {
      throw new ValidationError('Rent amount cannot exceed ₹1,00,000', 'rent.amount');
    }

    return numAmount;
  },

  /**
   * Validate room type
   */
  roomType: (roomType) => {
    const validTypes = ['single', 'shared', 'apartment', 'house'];
    if (!roomType || !validTypes.includes(roomType)) {
      throw new ValidationError('Invalid room type', 'roomType');
    }
    return roomType;
  },

  /**
   * Validate coordinates
   */
  coordinates: (longitude, latitude) => {
    if (longitude === null || longitude === undefined || isNaN(longitude)) {
      throw new ValidationError('Longitude is required', 'longitude');
    }
    if (latitude === null || latitude === undefined || isNaN(latitude)) {
      throw new ValidationError('Latitude is required', 'latitude');
    }

    const lng = Number(longitude);
    const lat = Number(latitude);

    if (lng < -180 || lng > 180) {
      throw new ValidationError('Longitude must be between -180 and 180', 'longitude');
    }
    if (lat < -90 || lat > 90) {
      throw new ValidationError('Latitude must be between -90 and 90', 'latitude');
    }

    return [lng, lat];
  },

  /**
   * Validate address
   */
  address: (address) => {
    if (!address || typeof address !== 'string') {
      throw new ValidationError('Address is required', 'address');
    }

    const trimmedAddress = validator.trim(address);
    if (trimmedAddress.length < 10) {
      throw new ValidationError('Address must be at least 10 characters long', 'address');
    }

    if (trimmedAddress.length > 200) {
      throw new ValidationError('Address cannot exceed 200 characters', 'address');
    }

    return trimmedAddress;
  },

  /**
   * Validate amenities array
   */
  amenities: (amenities) => {
    if (!Array.isArray(amenities)) {
      throw new ValidationError('Amenities must be an array', 'amenities');
    }

    const validAmenities = [
      'wifi', 'parking', 'laundry', 'kitchen', 'ac', 'heater',
      'gym', 'security', 'water_heater', 'washing_machine',
      'microwave', 'fridge', 'tv', 'balcony', 'furnished'
    ];

    const invalidAmenities = amenities.filter(amenity => !validAmenities.includes(amenity));
    if (invalidAmenities.length > 0) {
      throw new ValidationError(`Invalid amenities: ${invalidAmenities.join(', ')}`, 'amenities');
    }

    if (amenities.length > 10) {
      throw new ValidationError('Cannot specify more than 10 amenities', 'amenities');
    }

    return [...new Set(amenities)]; // Remove duplicates
  },

  /**
   * Validate gender preference
   */
  genderPreference: (genderPreference) => {
    const validPreferences = ['male', 'female', 'any'];
    if (!genderPreference || !validPreferences.includes(genderPreference)) {
      throw new ValidationError('Invalid gender preference', 'genderPreference');
    }
    return genderPreference;
  }
};

/**
 * Message/Chat validation
 */
export const messageValidators = {
  /**
   * Validate message content
   */
  content: (content) => {
    if (!content || typeof content !== 'string') {
      throw new ValidationError('Message content is required', 'content');
    }

    const trimmedContent = validator.trim(content);
    if (trimmedContent.length === 0) {
      throw new ValidationError('Message cannot be empty', 'content');
    }

    if (trimmedContent.length > 1000) {
      throw new ValidationError('Message cannot exceed 1000 characters', 'content');
    }

    // Check for potentially harmful content
    if (validator.contains(trimmedContent.toLowerCase(), ['<script', 'javascript:', 'onload=', 'onerror='])) {
      throw new ValidationError('Message contains potentially harmful content', 'content');
    }

    return trimmedContent;
  },

  /**
   * Validate recipient ID
   */
  recipientId: (recipientId) => {
    if (!recipientId || typeof recipientId !== 'string') {
      throw new ValidationError('Recipient ID is required', 'recipientId');
    }

    if (!validator.isMongoId(recipientId)) {
      throw new ValidationError('Invalid recipient ID', 'recipientId');
    }

    return recipientId;
  }
};

/**
 * Review validation
 */
export const reviewValidators = {
  /**
   * Validate rating
   */
  rating: (rating) => {
    if (rating === null || rating === undefined || isNaN(rating)) {
      throw new ValidationError('Rating is required', 'rating');
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      throw new ValidationError('Rating must be between 1 and 5', 'rating');
    }

    if (!Number.isInteger(numRating)) {
      throw new ValidationError('Rating must be a whole number', 'rating');
    }

    return numRating;
  },

  /**
   * Validate review comment
   */
  comment: (comment) => {
    if (!comment || typeof comment !== 'string') {
      throw new ValidationError('Review comment is required', 'comment');
    }

    const trimmedComment = validator.trim(comment);
    if (trimmedComment.length < 10) {
      throw new ValidationError('Review comment must be at least 10 characters long', 'comment');
    }

    if (trimmedComment.length > 500) {
      throw new ValidationError('Review comment cannot exceed 500 characters', 'comment');
    }

    return trimmedComment;
  },

  /**
   * Validate cleanliness/communication/accuracy ratings
   */
  aspectRating: (rating, aspect) => {
    if (rating === null || rating === undefined || isNaN(rating)) {
      throw new ValidationError(`${aspect} rating is required`, aspect);
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      throw new ValidationError(`${aspect} rating must be between 1 and 5`, aspect);
    }

    return numRating;
  }
};

/**
 * Visit/Scheduling validation
 */
export const visitValidators = {
  /**
   * Validate requested date
   */
  requestedDate: (date) => {
    if (!date) {
      throw new ValidationError('Requested date is required', 'requestedDate');
    }

    const requestedDate = new Date(date);
    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    if (isNaN(requestedDate.getTime())) {
      throw new ValidationError('Invalid date format', 'requestedDate');
    }

    if (requestedDate < minDate) {
      throw new ValidationError('Visit must be scheduled at least 24 hours in advance', 'requestedDate');
    }

    if (requestedDate > maxDate) {
      throw new ValidationError('Visit cannot be scheduled more than 30 days in advance', 'requestedDate');
    }

    // Check if it's a weekday (Monday-Friday) and reasonable hours
    const dayOfWeek = requestedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      throw new ValidationError('Visits can only be scheduled on weekdays', 'requestedDate');
    }

    return requestedDate;
  },

  /**
   * Validate requested time
   */
  requestedTime: (time) => {
    if (!time || typeof time !== 'string') {
      throw new ValidationError('Requested time is required', 'requestedTime');
    }

    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      throw new ValidationError('Invalid time format (use HH:MM)', 'requestedTime');
    }

    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    // Allow visits between 9 AM and 6 PM
    const minMinutes = 9 * 60;
    const maxMinutes = 18 * 60;

    if (totalMinutes < minMinutes || totalMinutes > maxMinutes) {
      throw new ValidationError('Visits can only be scheduled between 9:00 AM and 6:00 PM', 'requestedTime');
    }

    return time;
  },

  /**
   * Validate visit notes
   */
  notes: (notes) => {
    if (notes && typeof notes !== 'string') {
      throw new ValidationError('Visit notes must be a string', 'notes');
    }

    if (notes && notes.length > 300) {
      throw new ValidationError('Visit notes cannot exceed 300 characters', 'notes');
    }

    return notes ? validator.trim(notes) : '';
  }
};

/**
 * Report validation
 */
export const reportValidators = {
  /**
   * Validate report reason
   */
  reason: (reason) => {
    const validReasons = [
      'fake_listing', 'inappropriate_content', 'fraud', 'spam',
      'harassment', 'other'
    ];

    if (!reason || !validReasons.includes(reason)) {
      throw new ValidationError('Invalid report reason', 'reason');
    }

    return reason;
  },

  /**
   * Validate report description
   */
  description: (description) => {
    if (!description || typeof description !== 'string') {
      throw new ValidationError('Report description is required', 'description');
    }

    const trimmedDescription = validator.trim(description);
    if (trimmedDescription.length < 20) {
      throw new ValidationError('Report description must be at least 20 characters long', 'description');
    }

    if (trimmedDescription.length > 1000) {
      throw new ValidationError('Report description cannot exceed 1000 characters', 'description');
    }

    return trimmedDescription;
  }
};

/**
 * General utility validators
 */
export const generalValidators = {
  /**
   * Validate MongoDB ObjectId
   */
  objectId: (id, fieldName = 'id') => {
    if (!id || typeof id !== 'string') {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }

    if (!validator.isMongoId(id)) {
      throw new ValidationError(`Invalid ${fieldName}`, fieldName);
    }

    return id;
  },

  /**
   * Validate pagination parameters
   */
  pagination: (page = 1, limit = 10) => {
    const numPage = Math.max(1, parseInt(page) || 1);
    const numLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

    return { page: numPage, limit: numLimit };
  },

  /**
   * Sanitize string input
   */
  sanitizeString: (str, maxLength = 1000) => {
    if (!str || typeof str !== 'string') return '';

    let sanitized = validator.escape(str);
    sanitized = validator.trim(sanitized);

    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  },

  /**
   * Validate file upload
   */
  fileUpload: (file, options = {}) => {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
    } = options;

    if (!file) {
      throw new ValidationError('File is required', 'file');
    }

    if (file.size > maxSize) {
      throw new ValidationError(`File size cannot exceed ${maxSize / (1024 * 1024)}MB`, 'file');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`, 'file');
    }

    const extension = '.' + file.originalname.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new ValidationError(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`, 'file');
    }

    return file;
  }
};

/**
 * Business rule validators
 */
export const businessValidators = {
  /**
   * Validate room availability for user
   */
  canUserViewRoom: (user, room) => {
    if (!room.isActive) {
      throw new ValidationError('This room listing is no longer available');
    }

    if (room.verification.status !== 'approved') {
      throw new ValidationError('This room listing is pending verification');
    }

    if (room.availability.status !== 'available') {
      throw new ValidationError('This room is currently not available for viewing');
    }

    // Check gender preference
    if (room.genderPreference !== 'any' && user.gender !== room.genderPreference) {
      throw new ValidationError('This room is not available for your gender preference');
    }

    return true;
  },

  /**
   * Validate if user can leave review
   */
  canUserReviewRoom: async (userId, roomId, ReviewModel) => {
    // Check if user has visited or inquired about the room
    const hasInteraction = await ReviewModel.findOne({
      room: roomId,
      $or: [
        { student: userId },
        // Add logic to check visits/inquiries if needed
      ]
    });

    if (!hasInteraction) {
      throw new ValidationError('You can only review rooms you have interacted with');
    }

    // Check if user already reviewed this room
    const existingReview = await ReviewModel.findOne({
      room: roomId,
      student: userId
    });

    if (existingReview) {
      throw new ValidationError('You have already reviewed this room');
    }

    return true;
  },

  /**
   * Validate visit scheduling constraints
   */
  canScheduleVisit: (user, room, requestedDate) => {
    // Check if user is verified
    if (!user.verified) {
      throw new ValidationError('Account verification required to schedule visits');
    }

    // Check room availability
    if (room.availability.status !== 'available') {
      throw new ValidationError('This room is not available for visits');
    }

    // Check if date is not in the past
    if (requestedDate <= new Date()) {
      throw new ValidationError('Visit date must be in the future');
    }

    return true;
  }
};
