import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Analytics } from '../models/Analytics.js';

/**
 * AI-powered recommendation engine for StayHome platform
 * Provides personalized room recommendations based on user preferences,
 * behavior patterns, and machine learning insights
 */
export class AIRecommendationEngine {
  constructor() {
    // Weights for different recommendation factors
    this.weights = {
      location: 0.3,
      price: 0.25,
      amenities: 0.2,
      userPreferences: 0.15,
      popularity: 0.1
    };

    // Default recommendation limits
    this.defaultLimits = {
      personalized: 20,
      trending: 15,
      beginner: 10
    };
  }

  /**
   * Get personalized room recommendations for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Additional filters
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} Array of recommended rooms with scores
   */
  async getPersonalizedRecommendations(userId, filters = {}, limit = this.defaultLimits.personalized) {
    try {
      // Fetch user data and preferences
      const user = await User.findById(userId).select('preferences savedRooms college');
      if (!user) {
        return this.getTrendingRooms(filters, limit);
      }

      // Get user's interaction history
      const userInteractions = await this.getUserInteractionHistory(userId);

      // Build user preferences from behavior and explicit preferences
      const userPreferences = await this.buildUserPreferences(user, userInteractions);

      // Find candidate rooms
      const candidateRooms = await this.findCandidateRooms(userPreferences, filters);

      // Score and rank rooms
      const scoredRooms = await this.scoreAndRankRooms(candidateRooms, userPreferences, userInteractions);

      // Return top recommendations
      return scoredRooms.slice(0, limit);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Get trending rooms based on recent activity
   * @param {Object} filters - Additional filters
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} Array of trending rooms
   */
  async getTrendingRooms(filters = {}, limit = this.defaultLimits.trending) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Aggregate analytics data for trending calculation
      const trendingData = await Analytics.aggregate([
        {
          $match: {
            date: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$room',
            totalViews: { $sum: '$metrics.views' },
            totalInquiries: { $sum: '$metrics.inquiries' },
            totalFavorites: { $sum: '$metrics.favorites' },
            totalVisitRequests: { $sum: '$metrics.visitRequests' },
            daysActive: { $addToSet: '$date' }
          }
        },
        {
          $addFields: {
            daysCount: { $size: '$daysActive' },
            dailyAverageViews: { $divide: ['$totalViews', { $size: '$daysActive' }] }
          }
        },
        {
          $addFields: {
            trendingScore: {
              $add: [
                { $multiply: ['$totalViews', 0.3] },
                { $multiply: ['$totalInquiries', 2] },
                { $multiply: ['$totalFavorites', 1.5] },
                { $multiply: ['$totalVisitRequests', 3] },
                { $multiply: ['$dailyAverageViews', 0.5] }
              ]
            }
          }
        },
        {
          $sort: { trendingScore: -1 }
        },
        {
          $limit: limit * 2 // Get more candidates for filtering
        }
      ]);

      // Get room details and apply filters
      const roomIds = trendingData.map(item => item._id);
      let rooms = [];

      if (roomIds.length > 0) {
        const query = {
          _id: { $in: roomIds },
          isActive: true,
          'availability.status': 'available'
        };

        if (process.env.NODE_ENV === 'production') {
          query['verification.status'] = 'approved';
        }

        // Apply additional filters
        if (filters.city) query['location.address.city'] = filters.city;
        if (filters.maxRent) query['rent.amount'] = { $lte: filters.maxRent };
        if (filters.roomType) query.roomType = filters.roomType;

        rooms = await Room.find(query).populate('owner', 'name avatar').limit(limit);
      }

      // FALLBACK: If no trending data from analytics OR no rooms found with those IDs
      if (rooms.length === 0) {
        const fallbackQuery = {
          isActive: true,
          'availability.status': 'available'
        };
        if (process.env.NODE_ENV === 'production') {
          fallbackQuery['verification.status'] = 'approved';
        }
        if (filters.city) fallbackQuery['location.address.city'] = filters.city;

        rooms = await Room.find(fallbackQuery)
          .populate('owner', 'name avatar')
          .sort({ 'stats.views': -1, createdAt: -1 })
          .limit(limit);

        return rooms.map(r => r.toObject());
      }

      // Attach trending scores
      const trendingMap = new Map(trendingData.map(item => [item._id.toString(), item.trendingScore]));

      return rooms.map(room => ({
        ...room.toObject(),
        trendingScore: trendingMap.get(room._id.toString()) || 0
      })).sort((a, b) => b.trendingScore - a.trendingScore);
    } catch (error) {
      console.error('Error getting trending rooms:', error);
      return [];
    }
  }

  /**
   * Get beginner-friendly recommendations for new users
   * @param {Object} filters - Location and other filters
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} Array of beginner-friendly rooms
   */
  async getBeginnerRecommendations(filters = {}, limit = this.defaultLimits.beginner) {
    try {
      const query = {
        isActive: true,
        'availability.status': 'available',
        'rent.amount': { $lte: 15000 } // Under ₹15,000
      };

      if (process.env.NODE_ENV === 'production') {
        query['verification.status'] = 'approved';
      }

      // Apply location filter if coordinates provided
      if (filters.longitude && filters.latitude) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [filters.longitude, filters.latitude]
            },
            $maxDistance: 10000 // 10km radius
          }
        };
      } else if (filters.city) {
        query['location.address.city'] = filters.city;
      }

      const rooms = await Room.find(query)
        .populate('owner', 'name avatar phone')
        .sort({ 'stats.views': -1, rating: -1 })
        .limit(limit);

      return rooms.map(room => ({
        ...room.toObject(),
        recommendationReason: 'Popular and highly rated for beginners'
      }));
    } catch (error) {
      console.error('Error getting beginner recommendations:', error);
      return [];
    }
  }

  /**
   * Build user preferences from explicit settings and behavior
   * @param {Object} user - User object
   * @param {Object} interactions - User interaction history
   * @returns {Object} User preferences object
   */
  async buildUserPreferences(user, interactions) {
    const preferences = {
      priceRange: { min: 0, max: 20000 },
      location: null,
      roomType: null,
      amenities: [],
      genderPreference: user.preferences?.privacy?.showGender ? null : 'any'
    };

    // Use explicit preferences if available
    if (user.preferences?.priceRange) {
      preferences.priceRange = user.preferences.priceRange;
    }

    // Adjust price range based on user behavior and college location
    if (interactions.averagePrice) {
      const maxPrice = Math.max(interactions.averagePrice * 1.3, preferences.priceRange.max);
      preferences.priceRange.max = Math.min(maxPrice, 50000); // Cap at ₹50,000
    }

    // Infer location preferences from saved rooms and searches
    if (interactions.commonLocations && interactions.commonLocations.length > 0) {
      preferences.location = interactions.commonLocations[0];
    } else if (user.college) {
      // Use college location as fallback
      preferences.location = await this.getCollegeLocation(user.college);
    }

    // Infer room type preferences
    if (interactions.commonRoomTypes && interactions.commonRoomTypes.length > 0) {
      preferences.roomType = interactions.commonRoomTypes[0];
    }

    // Infer amenity preferences
    if (interactions.commonAmenities && interactions.commonAmenities.length > 0) {
      preferences.amenities = interactions.commonAmenities.slice(0, 3);
    }

    return preferences;
  }

  /**
   * Find candidate rooms based on user preferences
   * @param {Object} preferences - User preferences
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Array of candidate rooms
   */
  async findCandidateRooms(preferences, filters = {}) {
    const query = {
      isActive: true,
      'availability.status': 'available'
    };

    // Strict verification only in production
    if (process.env.NODE_ENV === 'production') {
      query['verification.status'] = 'approved';
    }

    // Price filter
    if (preferences.priceRange) {
      query['rent.amount'] = {
        $gte: preferences.priceRange.min,
        $lte: preferences.priceRange.max
      };
    }

    // Location filter
    if (preferences.location && preferences.location.coordinates) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: preferences.location.coordinates
          },
          $maxDistance: 20000 // 20km radius
        }
      };
    }

    // Room type filter
    if (preferences.roomType) {
      query.roomType = preferences.roomType;
    }

    // Gender preference filter
    if (preferences.genderPreference && preferences.genderPreference !== 'any') {
      query.genderPreference = { $in: [preferences.genderPreference, 'any'] };
    }

    // Amenity filters
    if (preferences.amenities && preferences.amenities.length > 0) {
      query.amenities = { $in: preferences.amenities };
    }

    // Apply additional filters
    if (filters.city) query['location.address.city'] = filters.city;
    if (filters.roomType) query.roomType = filters.roomType;
    if (filters.amenities) query.amenities = { $all: filters.amenities };

    let rooms = await Room.find(query)
      .populate('owner', 'name avatar verified')
      .limit(200); // Limit for performance

    // FALLBACK: If no rooms found in the city, search globally within preferences
    if (rooms.length === 0 && filters.city) {
      const fallbackQuery = { ...query };
      delete fallbackQuery['location.address.city'];
      rooms = await Room.find(fallbackQuery)
        .populate('owner', 'name avatar verified')
        .limit(200);
    }

    return rooms;
  }

  /**
   * Score and rank rooms based on user preferences and interactions
   * @param {Array} rooms - Array of candidate rooms
   * @param {Object} preferences - User preferences
   * @param {Object} interactions - User interaction history
   * @returns {Promise<Array>} Array of scored and ranked rooms
   */
  async scoreAndRankRooms(rooms, preferences, interactions) {
    const scoredRooms = await Promise.all(
      rooms.map(async (room) => {
        const score = await this.calculateSimilarityScore(room, preferences, interactions);

        return {
          ...room.toObject(),
          recommendationScore: score,
          matchReasons: this.generateMatchReasons(room, preferences, score)
        };
      })
    );

    // Sort by score descending
    return scoredRooms.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Calculate similarity score between room and user preferences
   * @param {Object} room - Room object
   * @param {Object} preferences - User preferences
   * @param {Object} interactions - User interaction history
   * @returns {number} Similarity score (0-100)
   */
  async calculateSimilarityScore(room, preferences, interactions) {
    let totalScore = 0;
    let totalWeight = 0;

    // Location score
    if (preferences.location && preferences.location.coordinates && room.location?.coordinates) {
      const distance = this.calculateDistance(
        preferences.location.coordinates,
        room.location.coordinates
      );

      // Score based on distance (closer = higher score)
      const locationScore = Math.max(0, 100 - (distance / 1000) * 5); // 5 points per km
      totalScore += locationScore * this.weights.location;
      totalWeight += this.weights.location;
    }

    // Price score
    if (preferences.priceRange && room.rent?.amount) {
      const priceRatio = room.rent.amount / ((preferences.priceRange.min + preferences.priceRange.max) / 2);
      const priceScore = Math.max(0, 100 - Math.abs(priceRatio - 1) * 50);
      totalScore += priceScore * this.weights.price;
      totalWeight += this.weights.price;
    }

    // Amenities score
    if (preferences.amenities && preferences.amenities.length > 0) {
      const matchingAmenities = preferences.amenities.filter(amenity =>
        room.amenities?.includes(amenity)
      );
      const amenityScore = (matchingAmenities.length / preferences.amenities.length) * 100;
      totalScore += amenityScore * this.weights.amenities;
      totalWeight += this.weights.amenities;
    }

    // User preference match score
    let preferenceScore = 0;
    if (preferences.roomType && room.roomType === preferences.roomType) {
      preferenceScore += 30;
    }
    if (preferences.genderPreference &&
      (room.genderPreference === preferences.genderPreference || room.genderPreference === 'any')) {
      preferenceScore += 20;
    }
    if (room.verification?.status === 'approved') {
      preferenceScore += 25;
    }
    if (room.rating && room.rating >= 4) {
      preferenceScore += 25;
    }

    totalScore += preferenceScore * this.weights.userPreferences;
    totalWeight += this.weights.userPreferences;

    // Popularity score based on room stats
    if (room.stats) {
      const popularityScore = Math.min(100,
        (room.stats.views || 0) * 0.1 +
        (room.stats.favorites || 0) * 2 +
        (room.stats.inquiries || 0) * 5
      );
      totalScore += popularityScore * this.weights.popularity;
      totalWeight += this.weights.popularity;
    }

    // Return normalized score
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Generate reasons why this room matches user preferences
   * @param {Object} room - Room object
   * @param {Object} preferences - User preferences
   * @param {number} score - Match score
   * @returns {Array} Array of match reason strings
   */
  generateMatchReasons(room, preferences, score) {
    const reasons = [];

    if (score >= 80) reasons.push('Excellent match for your preferences');
    else if (score >= 60) reasons.push('Good match for your preferences');
    else if (score >= 40) reasons.push('Decent match with room for improvement');

    if (preferences.location && preferences.location.coordinates && room.location?.coordinates) {
      const distance = this.calculateDistance(
        preferences.location.coordinates,
        room.location.coordinates
      );
      if (distance < 2000) reasons.push('Very close to your preferred location');
      else if (distance < 5000) reasons.push('Conveniently located');
    }

    if (preferences.priceRange &&
      room.rent?.amount >= preferences.priceRange.min &&
      room.rent?.amount <= preferences.priceRange.max) {
      reasons.push('Within your budget range');
    }

    if (preferences.amenities && preferences.amenities.length > 0) {
      const matching = preferences.amenities.filter(a => room.amenities?.includes(a));
      if (matching.length > 0) {
        reasons.push(`Has ${matching.length} of your preferred amenities`);
      }
    }

    if (room.rating && room.rating >= 4) {
      reasons.push('Highly rated by other students');
    }

    if (room.verification?.status === 'approved') {
      reasons.push('Verified listing');
    }

    return reasons;
  }

  /**
   * Get user interaction history for personalization
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User interaction data
   */
  async getUserInteractionHistory(userId) {
    try {
      // Get saved rooms
      const user = await User.findById(userId).select('savedRooms');
      const savedRooms = user?.savedRooms || [];

      // Get rooms user has viewed (from analytics)
      const viewedRooms = await Analytics.distinct('room', {
        'visitors.user': userId
      });

      // Get rooms from saved and viewed
      const interactedRoomIds = [...new Set([...savedRooms, ...viewedRooms])];

      if (interactedRoomIds.length === 0) {
        return {
          averagePrice: null,
          commonLocations: [],
          commonRoomTypes: [],
          commonAmenities: []
        };
      }

      // Analyze interaction patterns
      const interactedRooms = await Room.find({
        _id: { $in: interactedRoomIds }
      }).select('rent.amount location roomType amenities');

      const totalPrice = interactedRooms.reduce((sum, room) => sum + (room.rent?.amount || 0), 0);
      const averagePrice = totalPrice / interactedRooms.length;

      // Find common locations
      const locationCounts = {};
      interactedRooms.forEach(room => {
        if (room.location?.address?.city) {
          locationCounts[room.location.address.city] =
            (locationCounts[room.location.address.city] || 0) + 1;
        }
      });

      const commonLocations = Object.entries(locationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([city, count]) => ({ city, count }));

      // Find common room types
      const roomTypeCounts = {};
      interactedRooms.forEach(room => {
        if (room.roomType) {
          roomTypeCounts[room.roomType] = (roomTypeCounts[room.roomType] || 0) + 1;
        }
      });

      const commonRoomTypes = Object.entries(roomTypeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([type, count]) => ({ type, count }));

      // Find common amenities
      const amenityCounts = {};
      interactedRooms.forEach(room => {
        if (room.amenities) {
          room.amenities.forEach(amenity => {
            amenityCounts[amenity] = (amenityCounts[amenity] || 0) + 1;
          });
        }
      });

      const commonAmenities = Object.entries(amenityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([amenity, count]) => ({ amenity, count }));

      return {
        averagePrice,
        commonLocations,
        commonRoomTypes: commonRoomTypes.map(item => item.type),
        commonAmenities: commonAmenities.map(item => item.amenity)
      };
    } catch (error) {
      console.error('Error getting user interaction history:', error);
      return {
        averagePrice: null,
        commonLocations: [],
        commonRoomTypes: [],
        commonAmenities: []
      };
    }
  }

  /**
   * Get college location coordinates
   * @param {string} collegeName - College name
   * @returns {Promise<Object|null>} Location object with coordinates
   */
  /**
   * Get college location coordinates
   * @param {string} collegeName - College name
   * @returns {Promise<Object|null>} Location object with coordinates
   */
  async getCollegeLocation(collegeName) {
    try {
      const College = (await import('../models/College.js')).default;
      const college = await College.findOne({
        $or: [
          { name: { $regex: new RegExp(collegeName, 'i') } },
          { aliases: { $in: [new RegExp(collegeName, 'i')] } }
        ]
      });

      if (college && college.location?.coordinates) {
        return {
          coordinates: college.location.coordinates,
          city: college.address?.city
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching college location:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {Array} coord1 - [longitude, latitude]
   * @param {Array} coord2 - [longitude, latitude]
   * @returns {number} Distance in meters
   */
  calculateDistance(coord1, coord2) {
    if (!Array.isArray(coord1) || !Array.isArray(coord2) || coord1.length < 2 || coord2.length < 2) {
      return Infinity;
    }
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

// Export singleton instance
export const aiRecommendationEngine = new AIRecommendationEngine();
