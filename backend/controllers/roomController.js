import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Analytics } from '../models/Analytics.js';
import { Report } from '../models/Report.js';
import uploadOnCloudinary, { deleteFromCloudinary } from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { aiRecommendationEngine } from '../utils/aiRecommendation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const collegesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/colleges.json'), 'utf-8'));

export const createRoom = async (req, res) => {
  try {
    // Extract base data and location data
    const {
      location: locationData,
      rent: rentData,
      availability: availabilityData,
      ...baseData
    } = req.body;

    const roomData = {
      ...baseData,
      owner: req.user._id,
      location: {
        type: 'Point',
        coordinates: locationData?.coordinates || [
          parseFloat(req.body.longitude),
          parseFloat(req.body.latitude)
        ],
        address: locationData?.address || {
          street: req.body.street,
          city: req.body.city,
          state: req.body.state,
          country: req.body.country || 'India',
          zipCode: req.body.zipCode
        },
        landmark: locationData?.landmark || req.body.landmark,
        locationVisibility: locationData?.locationVisibility || req.body.locationVisibility || 'approximate',
        exactLocation: (locationData?.exactLocation || req.body.exactLocation) ? {
          type: 'Point',
          coordinates: locationData?.exactLocation?.coordinates || [
            parseFloat(req.body.exactLocation?.longitude || req.body.exactLongitude),
            parseFloat(req.body.exactLocation?.latitude || req.body.exactLatitude)
          ]
        } : undefined
      },
      rent: rentData || {
        amount: parseFloat(req.body.price || req.body.rentAmount || req.body.rent),
        deposit: parseFloat(req.body.deposit || 0),
        currency: req.body.currency || 'INR',
        period: req.body.period || 'month',
        electricityBillIncluded: req.body.electricityBillIncluded === 'true' || req.body.electricityBillIncluded === true
      },
      // Ensure proper defaults for new rooms
      isActive: true,
      availability: availabilityData || {
        status: 'available',
        availableFrom: new Date(),
        ...req.body.availability
      },
      verification: {
        status: 'pending',
        ...req.body.verification
      }
    };

    // Handle Electric Bill (Mandatory)
    if (req.files && req.files.electricBill) {
      const file = req.files.electricBill[0];
      const result = await uploadOnCloudinary(file.path, 'verification');
      if (result && result.secure_url && result.public_id) {
        roomData.verification = {
          ...roomData.verification,
          electricBill: {
            url: result.secure_url,
            publicId: result.public_id
          }
        };
      }
    }

    // Handle Aadhaar Card (Mandatory)
    if (req.files && req.files.aadhaarCard) {
      const file = req.files.aadhaarCard[0];
      const result = await uploadOnCloudinary(file.path, 'verification');
      if (result && result.secure_url && result.public_id) {
        roomData.verification = {
          ...roomData.verification,
          aadhaarCard: {
            url: result.secure_url,
            publicId: result.public_id
          }
        };
      }
    }

    // Handle Property Images (Max 5)
    if (req.files && req.files.images) {
      const images = [];
      for (const file of req.files.images) {
        const result = await uploadOnCloudinary(file.path, 'rooms');
        if (result && result.secure_url && result.public_id) {
          images.push({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      }
      if (images.length > 0) {
        roomData.images = images.slice(0, 5); // Final safety check for 5 images
      }
    }

    const room = await Room.create(roomData);

    res.status(201).json({
      success: true,
      message: 'Room listing created successfully. Awaiting admin approval.',
      data: { room }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllRooms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      minRent,
      maxRent,
      roomType,
      amenities,
      genderPreference,
      latitude,
      longitude,
      radius = 10000,
      sortBy = '-createdAt',
      search,
      city,
      state,
      electricityBillIncluded,
      availableFrom
    } = req.query;

    const query = {
      'verification.status': 'approved',
      isActive: true,
      'availability.status': 'available'
    };

    // Search by location (city, state, street, landmark, or area name)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { 'location.address.city': searchRegex },
        { 'location.address.state': searchRegex },
        { 'location.address.street': searchRegex },
        { 'location.landmark': searchRegex },
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Only apply city/state text filters if coordinate search is NOT active
    if (!latitude || !longitude) {
      if (city) {
        query['location.address.city'] = new RegExp(`^${city}$`, 'i');
      }
      if (state) {
        // Handle common state variations like UP/Uttar Pradesh
        let stateTerms = [state];
        if (state.toLowerCase() === 'uttar pradesh' || state.toLowerCase() === 'up') {
          stateTerms = ['Uttar Pradesh', 'UP'];
        }
        query['location.address.state'] = { $in: stateTerms.map(s => new RegExp(`^${s}$`, 'i')) };
      }
    }

    if (minRent || maxRent) {
      query['rent.amount'] = {};
      if (minRent) query['rent.amount'].$gte = parseFloat(minRent);
      if (maxRent) query['rent.amount'].$lte = parseFloat(maxRent);
    }

    if (roomType) {
      query.roomType = { $in: roomType.split(',') };
    }

    if (electricityBillIncluded !== undefined) {
      query['rent.electricityBillIncluded'] = electricityBillIncluded === 'true' || electricityBillIncluded === true;
    }

    if (availableFrom) {
      query['availability.availableFrom'] = { $lte: new Date(availableFrom) };
    }

    if (amenities) {
      query.amenities = { $all: amenities.split(',') };
    }

    const { occupancy, furnishing } = req.query;

    console.log('--- Room Search Debug ---');
    console.log('Query Params:', req.query);
    console.log('Base Query:', query);

    if (genderPreference) {
      const genders = genderPreference.split(',');
      if (!genders.includes('any')) {
        genders.push('any');
      }
      query.genderPreference = { $in: genders };
    }

    if (occupancy) {
      // Map frontend occupancy (1, 2, 3) or sharing types to model
      const occMap = { '1': 'single', '2': 'double', '3': 'shared' };
      const categories = occupancy.split(',').map(o => occMap[o] || o);
      // We check roomType for these specific occupancy counts usually, 
      // but let's allow filtering by sharingType if they pass 'private' or 'shared'
      const sharingTypes = categories.filter(c => ['private', 'shared'].includes(c));
      if (sharingTypes.length > 0) {
        query.sharingType = { $in: sharingTypes };
      }
    }

    if (furnishing) {
      query.furnishing = { $in: furnishing.split(',') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let rooms = [];
    let total = 0;

    // If location search is active, prioritize viewport bounds if available
    const { neLat, neLng, swLat, swLng } = req.query;
    if (neLat && neLng && swLat && swLng) {
      query['location'] = {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)],
            [parseFloat(neLng), parseFloat(neLat)]
          ]
        }
      };
    }

    // If location search is active, use $geoNear aggregation for distance calculation
    if (latitude && longitude) {
      const searchLat = parseFloat(latitude);
      const searchLng = parseFloat(longitude);
      const searchRadius = parseInt(radius) || 10000;

      // Build match query without location filter (unless bounds were already added)
      const matchQuery = { ...query };
      console.log('Geo Match Query:', matchQuery);
      console.log('Geo Search Radius:', searchRadius);

      // Use aggregation pipeline for distance calculation
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [searchLng, searchLat]
            },
            distanceField: 'distance',
            distanceMultiplier: 1, // Distance in meters
            maxDistance: searchRadius,
            spherical: true,
            query: matchQuery
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'ownerData'
          }
        },
        {
          $unwind: {
            path: '$ownerData',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            'ownerData.password': 0,
            'ownerData.resetPasswordToken': 0,
            'ownerData.resetPasswordExpire': 0
          }
        },
        {
          $addFields: {
            owner: {
              _id: '$ownerData._id',
              name: '$ownerData.name',
              phone: '$ownerData.phone',
              avatar: '$ownerData.avatar',
              verified: '$ownerData.verified'
            },
            distance: {
              meters: { $round: ['$distance', 0] },
              kilometers: { $round: [{ $divide: ['$distance', 1000] }, 2] }
            }
          }
        },
        {
          // Sort by distance (nearest first) when location search is active
          $sort: { distance: 1 }
        },
        {
          $skip: skip
        },
        {
          $limit: parseInt(limit)
        }
      ];

      // Get total count for pagination
      const countPipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [searchLng, searchLat]
            },
            distanceField: 'distance',
            maxDistance: searchRadius,
            spherical: true,
            query: matchQuery
          }
        },
        {
          $count: 'total'
        }
      ];

      const [roomsResult, countResult] = await Promise.all([
        Room.aggregate(pipeline),
        Room.aggregate(countPipeline)
      ]);

      rooms = roomsResult;
      total = countResult[0]?.total || 0;
    } else {
      // Regular query without location search
      rooms = await Room.find(query)
        .populate('owner', 'name phone avatar verified')
        .sort(sortBy)
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      total = await Room.countDocuments(query);
    }

    res.json({
      success: true,
      data: {
        rooms: rooms.map(room => {
          const roomObj = room.toObject ? room.toObject() : room;
          // Privacy: Remove exact location from list view always to save bandwidth 
          // and prevent accidental leaks. Individual room fetch will handle specific privacy.
          if (roomObj.location) {
            delete roomObj.location.exactLocation;

            // If approximate, we can also obscure the main coordinates slightly if needed,
            // but for now, we rely on the owner having picked a general spot for 'location.coordinates'
            // and a specific spot for 'location.exactLocation'.
          }
          return roomObj;
        }),
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is a valid MongoDB ObjectId
    if (!id || id === 'undefined' || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID provided'
      });
    }

    const room = await Room.findById(id)
      .populate('owner', 'name email phone avatar verified');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Security: Only owner or admin can see non-approved rooms
    const isOwner = req.user && (req.user._id.toString() === room.owner._id.toString() || req.user.role === 'admin');
    if (room.verification?.status !== 'approved' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'This listing is pending verification and is not yet public.'
      });
    }

    // Calculate rating from reviews
    const { Review } = await import('../models/Review.js');
    // Populate student details for reviews
    const reviews = await Review.find({ room: room._id })
      .populate('student', 'name avatar')
      .sort('-createdAt');

    let ratingData = {
      average: 0,
      count: 0
    };

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      ratingData = {
        average: totalRating / reviews.length,
        count: reviews.length
      };
    }

    // Update room rating if it's different and increment views
    const updateData = {};
    if (!room.rating ||
      room.rating.average !== ratingData.average ||
      room.rating.count !== ratingData.count) {
      updateData.rating = ratingData;
    }

    // Increment views directly in the DB
    updateData.$inc = { 'stats.views': 1 };

    if (Object.keys(updateData).length > 0) {
      await Room.updateOne({ _id: room._id }, updateData);
    }

    // Analytics Tracking (Guests + Users)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const source = req.query.source || req.headers.referer || 'Direct';
    const visitorData = {
      timestamp: new Date(),
      source: source
    };
    if (req.user) visitorData.user = req.user._id;

    // Use findOneAndUpdate to atomically handling viewing
    // We try to increment uniqueViews if this specific user/IP hasn't visited today.
    // Since complex conditional updates are hard, we'll increment Total Views and log the Visit.
    // The Analytics Controller calculates Unique views by processing the 'visitors' array.

    await Analytics.findOneAndUpdate(
      { room: room._id, date: today },
      {
        $inc: { 'metrics.views': 1 },
        $push: { visitors: visitorData },
        $set: { owner: room.owner }
      },
      { upsert: true }
    );

    // Ensure rating is included in response
    const roomObj = room.toObject();
    roomObj.rating = ratingData;

    // Determine which location to return based on visibility setting
    // PRIVACY CHECK: Only show exact location if it's set to 'exact' AND 
    // it's not a restricted view (though usually students should see it if owner allowed)
    // isOwner is already defined above

    if (roomObj.location.locationVisibility === 'exact' &&
      roomObj.location.exactLocation?.coordinates?.length === 2) {
      roomObj.displayLocation = {
        type: 'Point',
        coordinates: roomObj.location.exactLocation.coordinates,
        isExact: true
      };
    } else {
      roomObj.displayLocation = {
        type: 'Point',
        coordinates: roomObj.location.coordinates,
        isExact: false
      };
      // CRITICAL: Strip exact location if not authorized or not requested
      if (!isOwner) {
        delete roomObj.location.exactLocation;
      }
    }

    // Always strip exactLocation from the nested location object for non-owners to be safe
    if (!isOwner && roomObj.location) {
      delete roomObj.location.exactLocation;
    }

    res.json({
      success: true,
      data: {
        room: roomObj,
        reviews: reviews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateRoom = async (req, res) => {
  try {
    let room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this room'
      });
    }

    // Handle Electric Bill Update
    if (req.files && req.files.electricBill) {
      const file = req.files.electricBill[0];
      const result = await uploadOnCloudinary(file.path, 'verification');
      if (result && result.secure_url && result.public_id) {
        // Delete old bill if exists
        if (room.verification?.electricBill?.publicId) {
          try { await deleteFromCloudinary(room.verification.electricBill.publicId); } catch (e) { }
        }
        if (!room.verification) room.verification = {};
        room.verification.electricBill = {
          url: result.secure_url,
          publicId: result.public_id
        };
      }
    } else if (req.body.verification?.electricBill) {
      // Web flow: pre-uploaded bill
      if (!room.verification) room.verification = {};
      room.verification.electricBill = req.body.verification.electricBill;
    }

    // Handle Aadhaar Card Update
    if (req.files && req.files.aadhaarCard) {
      const file = req.files.aadhaarCard[0];
      const result = await uploadOnCloudinary(file.path, 'verification');
      if (result && result.secure_url && result.public_id) {
        // Delete old Aadhaar card if exists
        if (room.verification?.aadhaarCard?.publicId) {
          try { await deleteFromCloudinary(room.verification.aadhaarCard.publicId); } catch (e) { }
        }
        if (!room.verification) room.verification = {};
        room.verification.aadhaarCard = {
          url: result.secure_url,
          publicId: result.public_id
        };
      }
    } else if (req.body.verification?.aadhaarCard) {
      // Web flow: pre-uploaded aadhaarCard
      if (!room.verification) room.verification = {};
      room.verification.aadhaarCard = req.body.verification.aadhaarCard;
    }

    // Update verification status if provided
    if (req.body.verification?.status) {
      if (!room.verification) room.verification = {};
      room.verification.status = req.body.verification.status;
    }

    // Handle Image Updates (New Uploads from Mobile or List from Web)
    if (req.files && req.files.images) {
      const newImages = [];
      for (const file of req.files.images) {
        const result = await uploadOnCloudinary(file.path, 'rooms');
        if (result && result.secure_url && result.public_id) {
          newImages.push({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      }
      if (newImages.length > 0) {
        // Mobile flow: append new images to existing ones (up to 5)
        const totalImages = [...(room.images || []), ...newImages];
        room.images = totalImages.slice(0, 5);
      }
    } else if (req.body.images && Array.isArray(req.body.images)) {
      // Web flow: user might have reordered or removed images
      // Ensure we only store valid image objects and limit to 5
      room.images = req.body.images
        .filter(img => img.url && img.publicId)
        .slice(0, 5);
    }

    // Handle location and visibility updates
    if (req.body.location || req.body.city || req.body.latitude || req.body.longitude) {
      if (!room.location) room.location = { type: 'Point', coordinates: [0, 0], address: {} };

      const newLoc = req.body.location || {};

      // Handle flat coordinates
      if (req.body.longitude !== undefined && req.body.latitude !== undefined) {
        room.location.coordinates = [parseFloat(req.body.longitude), parseFloat(req.body.latitude)];
      } else if (newLoc.coordinates) {
        room.location.coordinates = newLoc.coordinates;
      }

      // Handle flat address
      if (!room.location.address) room.location.address = {};
      if (req.body.street) room.location.address.street = req.body.street;
      if (req.body.city) room.location.address.city = req.body.city;
      if (req.body.state) room.location.address.state = req.body.state;
      if (req.body.zipCode || req.body.pincode) room.location.address.zipCode = req.body.zipCode || req.body.pincode;

      if (newLoc.address) {
        room.location.address = { ...room.location.address, ...newLoc.address };
      }

      // Update visibility and landmark
      if (req.body.landmark !== undefined) room.location.landmark = req.body.landmark;
      if (newLoc.landmark !== undefined) room.location.landmark = newLoc.landmark;

      if (req.body.locationVisibility) room.location.locationVisibility = req.body.locationVisibility;
      if (newLoc.locationVisibility) room.location.locationVisibility = newLoc.locationVisibility;

      // Update exact location
      if (req.body.exactLongitude !== undefined && req.body.exactLatitude !== undefined) {
        room.location.exactLocation = {
          type: 'Point',
          coordinates: [parseFloat(req.body.exactLongitude), parseFloat(req.body.exactLatitude)]
        };
      } else if (newLoc.exactLocation) {
        room.location.exactLocation = {
          type: 'Point',
          coordinates: newLoc.exactLocation.coordinates
        };
      }
    }

    // Handle Rent Updates (Robust)
    if (req.body.rent || req.body.price || req.body.rentAmount || req.body.deposit) {
      if (!room.rent) room.rent = { amount: 0, deposit: 0, currency: 'INR', period: 'month' };

      const rentUpdate = req.body.rent || {};
      if (req.body.price || req.body.rentAmount || req.body.rent) {
        room.rent.amount = parseFloat(req.body.price || req.body.rentAmount || req.body.rent);
      } else if (rentUpdate.amount) {
        room.rent.amount = rentUpdate.amount;
      }

      if (req.body.deposit !== undefined) {
        room.rent.deposit = parseFloat(req.body.deposit);
      } else if (rentUpdate.deposit !== undefined) {
        room.rent.deposit = rentUpdate.deposit;
      }

      if (req.body.period) room.rent.period = req.body.period;
      if (rentUpdate.period) room.rent.period = rentUpdate.period;

      if (req.body.electricityBillIncluded !== undefined) {
        room.rent.electricityBillIncluded = req.body.electricityBillIncluded === 'true' || req.body.electricityBillIncluded === true;
      } else if (rentUpdate.electricityBillIncluded !== undefined) {
        room.rent.electricityBillIncluded = rentUpdate.electricityBillIncluded;
      }
    }

    // Handle Availability Updates
    if (req.body.availability || req.body.status || req.body.availabilityStatus) {
      if (!room.availability) room.availability = { status: 'available' };
      const avail = req.body.availability || {};
      room.availability.status = req.body.status || req.body.availabilityStatus || avail.status || room.availability.status;
      if (avail.availableFrom) room.availability.availableFrom = avail.availableFrom;
    }

    // List of keys that should not be directly updated from req.body
    const excludedKeys = ['_id', 'owner', 'createdAt', 'updatedAt', 'location', 'images', 'verification', 'rating', 'stats', 'rent', 'availability', '__v'];

    // Assign other fields from req.body
    Object.keys(req.body).forEach(key => {
      // Handle special case for nested strings sent by mobile (e.g. 'availability.status')
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (parent === 'availability' && child === 'status') {
          if (!room.availability) room.availability = {};
          room.availability.status = req.body[key];
        }
        return;
      }

      if (!excludedKeys.includes(key) && req.body[key] !== undefined) {
        room[key] = req.body[key];
      }
    });

    // Handle images from body (if already uploaded via separate endpoint)
    if (req.body.images && (!req.files || req.files.length === 0)) {
      room.images = req.body.images;
    }

    room = await room.save();

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: { room }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this room'
      });
    }

    for (const image of room.images) {
      await deleteFromCloudinary(image.publicId);
    }

    await Room.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Report a room listing
export const reportRoom = async (req, res) => {
  try {
    const { reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Reason and description are required'
      });
    }

    if (description.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a more detailed description (min 20 chars)'
      });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // 1. Rate Limit: Max 3 reports per user per 24 hours
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReportsCount = await Report.countDocuments({
      reportedBy: req.user._id,
      createdAt: { $gte: dayAgo }
    });

    if (recentReportsCount >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Safety limit: Maximum 3 reports per day. Please try again tomorrow.'
      });
    }

    // 2. Duplicate Check: One report per user per listing
    const existingReport = await Report.findOne({
      reportedBy: req.user._id,
      targetId: room._id,
      reportType: 'room'
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this listing. Our team is investigating.'
      });
    }

    // 3. Trust-Weighted Score Calculation
    let reportWeight = 1.0;
    const userAgeDays = (Date.now() - new Date(req.user.createdAt)) / (1000 * 60 * 60 * 24);

    if (userAgeDays < 7) {
      reportWeight = 0.5; // Newer accounts have less weight to prevent bot attacks
    } else if (req.user.verified) {
      reportWeight = 1.5; // Verified students have higher impact
    }

    // Create the report
    const report = await Report.create({
      reportedBy: req.user._id,
      reportType: 'room',
      targetId: room._id,
      reason,
      description,
      weight: reportWeight
    });

    // 4. Auto-Moderation Logic (Weighted Score)
    const allReports = await Report.find({ targetId: room._id, reportType: 'room' });
    const totalScore = allReports.reduce((sum, r) => sum + (r.weight || 1.0), 0);

    let statusUpdate = {};
    let message = 'Report submitted. Our team will review this listing.';

    if (totalScore >= 10) {
      // Severe threshold: Auto-block
      statusUpdate = {
        isActive: false,
        'verification.status': 'rejected',
        'verification.rejectionReason': `Auto-blocked: Extreme report score reached (${totalScore.toFixed(1)})`
      };
      message = 'Listing has been automatically suspended due to multiple serious reports.';
    } else if (totalScore >= 5) {
      // Warning threshold: Flag for Admin
      statusUpdate = {
        'verification.status': 'flagged'
      };
      message = 'Report received. Listing has been flagged for urgent priority review.';
    }

    await Room.updateOne(
      { _id: room._id },
      {
        $set: {
          'stats.reportScore': totalScore,
          ...statusUpdate
        }
      }
    );

    res.status(201).json({
      success: true,
      message,
      data: { report, score: totalScore }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user._id }).sort('-createdAt');

    res.json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const user = req.user;
    const isFavorite = user.savedRooms.includes(room._id);

    if (isFavorite) {
      user.savedRooms = user.savedRooms.filter(
        id => id.toString() !== room._id.toString()
      );
      room.stats.favorites -= 1;
    } else {
      user.savedRooms.push(room._id);
      room.stats.favorites += 1;
    }

    await user.save();
    await Room.updateOne(
      { _id: room._id },
      { 'stats.favorites': room.stats.favorites }
    );

    // Track analytics for new favorites
    if (!isFavorite) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await Analytics.findOneAndUpdate(
        { room: room._id, date: today },
        {
          $inc: { 'metrics.favorites': 1 },
          $set: { owner: room.owner }
        },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      data: { isFavorite: !isFavorite }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   GET LIST OF COLLEGES
========================= */
export const getColleges = async (req, res) => {
  try {
    res.json({
      success: true,
      data: { colleges: collegesData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch colleges'
    });
  }
};

/* =========================
   SEARCH ROOMS BY COLLEGE
========================= */
export const searchByCollege = async (req, res) => {
  try {
    const { collegeId, maxDistance = 2000 } = req.query; // default 2km radius

    if (!collegeId) {
      return res.status(400).json({
        success: false,
        message: 'College ID is required'
      });
    }

    const college = collegesData.find(c => c.id === collegeId);

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    const { latitude, longitude } = college.coordinates;

    // Use Room.findNearby static method
    const rooms = await Room.findNearby(longitude, latitude, parseInt(maxDistance));

    // We also want to populate owner details like in getAllRooms
    const roomIds = rooms.map(r => r._id);
    const populatedRooms = await Room.find({ _id: { $in: roomIds } })
      .populate('owner', 'name phone avatar verified');

    res.json({
      success: true,
      data: {
        college: college.name,
        rooms: populatedRooms,
        count: populatedRooms.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getPopularCities = async (req, res) => {
  try {
    const popularCities = await Room.aggregate([
      { $match: { 'availability.status': 'available' } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$location.address.city' } } },
          count: { $sum: 1 },
          cityName: { $first: '$location.address.city' },
          state: { $first: '$location.address.state' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
      {
        $project: {
          city: '$cityName',
          count: 1,
          state: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: popularCities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const { type = 'personalized', limit = 10, city } = req.query;
    const userId = req.user?._id;
    const filters = city ? { city } : {};

    let recommendations = [];

    if (type === 'personalized' && userId) {
      recommendations = await aiRecommendationEngine.getPersonalizedRecommendations(userId, filters, parseInt(limit));
    } else if (type === 'trending') {
      recommendations = await aiRecommendationEngine.getTrendingRooms(filters, parseInt(limit));
    } else if (type === 'beginner') {
      recommendations = await aiRecommendationEngine.getBeginnerRecommendations(filters, parseInt(limit));
    } else {
      // Fallback
      recommendations = await aiRecommendationEngine.getTrendingRooms(filters, parseInt(limit));
    }

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        type
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};