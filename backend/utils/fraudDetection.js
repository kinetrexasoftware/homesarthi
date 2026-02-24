import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import Analytics from '../models/Analytics.js';

/**
 * Fraud Detection Engine for HomeSarthi Platform
 * Detects suspicious activities, fake listings, spam, and fraudulent behavior
 */
export class FraudDetectionEngine {
  constructor() {
    this.suspiciousPatterns = {
      // Account creation patterns
      rapidAccountCreation: {
        threshold: 5, // accounts per hour
        timeWindow: 60 * 60 * 1000, // 1 hour
        severity: 'medium'
      },

      // Listing patterns
      bulkListingCreation: {
        threshold: 10, // listings per day
        timeWindow: 24 * 60 * 60 * 1000, // 1 day
        severity: 'high'
      },

      // Messaging patterns
      spamMessaging: {
        threshold: 20, // messages per hour
        timeWindow: 60 * 60 * 1000, // 1 hour
        severity: 'high'
      },

      // IP-based patterns
      multipleAccountsFromIP: {
        threshold: 3, // accounts per IP
        severity: 'high'
      }
    };

    this.riskScores = {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
      critical: 0.95
    };
  }

  /**
   * Analyze user account for fraud indicators
   * @param {string} userId - User ID to analyze
   * @returns {Promise<Object>} Fraud analysis result
   */
  async analyzeUserAccount(userId) {
    try {
      const user = await User.findById(userId).select('+verificationDocuments');
      if (!user) {
        throw new Error('User not found');
      }

      const analysis = {
        userId,
        riskScore: 0,
        riskLevel: 'low',
        flags: [],
        recommendations: [],
        analyzedAt: new Date()
      };

      // Check account creation patterns
      const accountCreationRisk = await this.checkAccountCreationPatterns(user);
      analysis.riskScore += accountCreationRisk.score;
      analysis.flags.push(...accountCreationRisk.flags);

      // Check profile completeness and verification
      const profileRisk = this.checkProfileCompleteness(user);
      analysis.riskScore += profileRisk.score;
      analysis.flags.push(...profileRisk.flags);

      // Check listing behavior (if owner)
      if (user.role === 'owner') {
        const listingRisk = await this.checkListingBehavior(userId);
        analysis.riskScore += listingRisk.score;
        analysis.flags.push(...listingRisk.flags);
      }

      // Check messaging behavior
      const messagingRisk = await this.checkMessagingBehavior(userId);
      analysis.riskScore += messagingRisk.score;
      analysis.flags.push(...messagingRisk.flags);

      // Check for reported violations
      const reportRisk = await this.checkReportedViolations(userId);
      analysis.riskScore += reportRisk.score;
      analysis.flags.push(...reportRisk.flags);

      // Normalize risk score
      analysis.riskScore = Math.min(1, analysis.riskScore);

      // Determine risk level
      analysis.riskLevel = this.calculateRiskLevel(analysis.riskScore);

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing user account:', error);
      return {
        userId,
        riskScore: 0.5,
        riskLevel: 'medium',
        flags: ['analysis_error'],
        recommendations: ['Manual review required'],
        analyzedAt: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Analyze room listing for fraud indicators
   * @param {string} roomId - Room ID to analyze
   * @returns {Promise<Object>} Fraud analysis result
   */
  async analyzeRoomListing(roomId) {
    try {
      const room = await Room.findById(roomId).populate('owner', 'name email role createdAt');
      if (!room) {
        throw new Error('Room not found');
      }

      const analysis = {
        roomId,
        riskScore: 0,
        riskLevel: 'low',
        flags: [],
        recommendations: [],
        analyzedAt: new Date()
      };

      // Check listing content quality
      const contentRisk = this.checkListingContentQuality(room);
      analysis.riskScore += contentRisk.score;
      analysis.flags.push(...contentRisk.flags);

      // Check pricing anomalies
      const pricingRisk = await this.checkPricingAnomalies(room);
      analysis.riskScore += pricingRisk.score;
      analysis.flags.push(...pricingRisk.flags);

      // Check owner behavior
      const ownerRisk = await this.analyzeUserAccount(room.owner._id);
      analysis.riskScore += ownerRisk.riskScore * 0.3; // Weight owner risk lower
      analysis.flags.push(...ownerRisk.flags.map(flag => `owner_${flag}`));

      // Check for duplicate listings
      const duplicateRisk = await this.checkDuplicateListings(room);
      analysis.riskScore += duplicateRisk.score;
      analysis.flags.push(...duplicateRisk.flags);

      // Check image authenticity (placeholder for future ML integration)
      const imageRisk = this.checkImageAuthenticity(room);
      analysis.riskScore += imageRisk.score;
      analysis.flags.push(...imageRisk.flags);

      // Normalize risk score
      analysis.riskScore = Math.min(1, analysis.riskScore);

      // Determine risk level
      analysis.riskLevel = this.calculateRiskLevel(analysis.riskScore);

      // Generate recommendations
      analysis.recommendations = this.generateListingRecommendations(analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing room listing:', error);
      return {
        roomId,
        riskScore: 0.5,
        riskLevel: 'medium',
        flags: ['analysis_error'],
        recommendations: ['Manual review required'],
        analyzedAt: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check account creation patterns for fraud
   * @param {Object} user - User object
   * @returns {Object} Risk analysis result
   */
  async checkAccountCreationPatterns(user) {
    const result = { score: 0, flags: [] };

    try {
      const oneHourAgo = new Date(Date.now() - this.suspiciousPatterns.rapidAccountCreation.timeWindow);

      // Check for rapid account creation from same IP (if IP logging is available)
      // This would require IP logging middleware

      // Check for similar email patterns
      const similarEmails = await User.countDocuments({
        email: { $regex: new RegExp(user.email.split('@')[1]) },
        createdAt: { $gte: oneHourAgo }
      });

      if (similarEmails > this.suspiciousPatterns.rapidAccountCreation.threshold) {
        result.score += this.riskScores.medium;
        result.flags.push('bulk_email_domain_registration');
      }

      // Check for accounts created in very short succession
      const recentAccounts = await User.countDocuments({
        createdAt: { $gte: oneHourAgo }
      });

      if (recentAccounts > this.suspiciousPatterns.rapidAccountCreation.threshold) {
        result.score += this.riskScores.low;
        result.flags.push('high_account_creation_rate');
      }

    } catch (error) {
      console.error('Error checking account creation patterns:', error);
    }

    return result;
  }

  /**
   * Check profile completeness and verification status
   * @param {Object} user - User object
   * @returns {Object} Risk analysis result
   */
  checkProfileCompleteness(user) {
    const result = { score: 0, flags: [] };

    // Check verification status
    if (!user.verified) {
      result.score += this.riskScores.medium;
      result.flags.push('unverified_account');
    }

    // Check profile completeness
    const requiredFields = ['name', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !user[field]);

    if (missingFields.length > 0) {
      result.score += this.riskScores.low;
      result.flags.push('incomplete_profile');
    }

    // Check avatar presence
    if (!user.avatar || !user.avatar.url) {
      result.score += this.riskScores.low;
      result.flags.push('no_profile_picture');
    }

    // Check verification documents
    if (!user.verificationDocuments || user.verificationDocuments.length === 0) {
      result.score += this.riskScores.low;
      result.flags.push('no_verification_documents');
    }

    return result;
  }

  /**
   * Check listing behavior for suspicious patterns
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Risk analysis result
   */
  async checkListingBehavior(userId) {
    const result = { score: 0, flags: [] };

    try {
      const oneDayAgo = new Date(Date.now() - this.suspiciousPatterns.bulkListingCreation.timeWindow);

      // Check for bulk listing creation
      const recentListings = await Room.countDocuments({
        owner: userId,
        createdAt: { $gte: oneDayAgo }
      });

      if (recentListings > this.suspiciousPatterns.bulkListingCreation.threshold) {
        result.score += this.riskScores.high;
        result.flags.push('bulk_listing_creation');
      }

      // Check for listings with identical content
      const userListings = await Room.find({ owner: userId }).select('title description rent.amount');
      const duplicateContent = this.findDuplicateContent(userListings);

      if (duplicateContent.length > 0) {
        result.score += this.riskScores.medium;
        result.flags.push('duplicate_listing_content');
      }

    } catch (error) {
      console.error('Error checking listing behavior:', error);
    }

    return result;
  }

  /**
   * Check messaging behavior for spam indicators
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Risk analysis result
   */
  async checkMessagingBehavior(userId) {
    const result = { score: 0, flags: [] };

    try {
      const oneHourAgo = new Date(Date.now() - this.suspiciousPatterns.spamMessaging.timeWindow);

      // Check message frequency
      const recentMessages = await Message.countDocuments({
        sender: userId,
        createdAt: { $gte: oneHourAgo }
      });

      if (recentMessages > this.suspiciousPatterns.spamMessaging.threshold) {
        result.score += this.riskScores.high;
        result.flags.push('high_message_frequency');
      }

      // Check for repetitive messages
      const messages = await Message.find({
        sender: userId,
        createdAt: { $gte: oneHourAgo }
      }).select('content').limit(50);

      const repetitiveContent = this.findRepetitiveContent(messages);
      if (repetitiveContent.length > 0) {
        result.score += this.riskScores.medium;
        result.flags.push('repetitive_messages');
      }

    } catch (error) {
      console.error('Error checking messaging behavior:', error);
    }

    return result;
  }

  /**
   * Check for reported violations
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Risk analysis result
   */
  async checkReportedViolations(userId) {
    const result = { score: 0, flags: [] };

    try {
      // Check reports against this user
      const reports = await Report.countDocuments({
        reportedUser: userId,
        status: 'pending'
      });

      if (reports > 0) {
        result.score += this.riskScores.medium * Math.min(reports, 3) / 3;
        result.flags.push(`has_pending_reports_${reports}`);
      }

      // Check resolved reports
      const resolvedReports = await Report.countDocuments({
        reportedUser: userId,
        status: 'resolved',
        resolution: 'guilty'
      });

      if (resolvedReports > 0) {
        result.score += this.riskScores.high * Math.min(resolvedReports, 5) / 5;
        result.flags.push(`previous_violations_${resolvedReports}`);
      }

    } catch (error) {
      console.error('Error checking reported violations:', error);
    }

    return result;
  }

  /**
   * Check listing content quality
   * @param {Object} room - Room object
   * @returns {Object} Risk analysis result
   */
  checkListingContentQuality(room) {
    const result = { score: 0, flags: [] };

    // Check title quality
    if (!room.title || room.title.length < 10) {
      result.score += this.riskScores.low;
      result.flags.push('poor_title_quality');
    }

    // Check description quality
    if (!room.description || room.description.length < 50) {
      result.score += this.riskScores.medium;
      result.flags.push('poor_description_quality');
    }

    // Check for suspicious keywords
    const suspiciousKeywords = ['fake', 'test', 'spam', 'scam', 'money', 'urgent'];
    const content = `${room.title} ${room.description}`.toLowerCase();

    const foundSuspicious = suspiciousKeywords.some(keyword => content.includes(keyword));
    if (foundSuspicious) {
      result.score += this.riskScores.medium;
      result.flags.push('suspicious_keywords');
    }

    // Check image count
    if (!room.images || room.images.length < 3) {
      result.score += this.riskScores.low;
      result.flags.push('insufficient_images');
    }

    return result;
  }

  /**
   * Check for pricing anomalies
   * @param {Object} room - Room object
   * @returns {Promise<Object>} Risk analysis result
   */
  async checkPricingAnomalies(room) {
    const result = { score: 0, flags: [] };

    try {
      // Get average price for similar rooms in the same city
      const similarRooms = await Room.find({
        'location.address.city': room.location?.address?.city,
        roomType: room.roomType,
        _id: { $ne: room._id },
        'verification.status': 'approved'
      }).select('rent.amount');

      if (similarRooms.length > 0) {
        const avgPrice = similarRooms.reduce((sum, r) => sum + r.rent.amount, 0) / similarRooms.length;
        const priceRatio = room.rent.amount / avgPrice;

        // Flag if price is too low (potentially fake) or too high
        if (priceRatio < 0.3) {
          result.score += this.riskScores.medium;
          result.flags.push('suspiciously_low_price');
        } else if (priceRatio > 3) {
          result.score += this.riskScores.low;
          result.flags.push('suspiciously_high_price');
        }
      }

    } catch (error) {
      console.error('Error checking pricing anomalies:', error);
    }

    return result;
  }

  /**
   * Check for duplicate listings
   * @param {Object} room - Room object
   * @returns {Promise<Object>} Risk analysis result
   */
  async checkDuplicateListings(room) {
    const result = { score: 0, flags: [] };

    try {
      // Check for similar titles and descriptions
      const similarListings = await Room.countDocuments({
        _id: { $ne: room._id },
        $or: [
          { title: { $regex: new RegExp(room.title, 'i') } },
          { description: { $regex: new RegExp(room.description.substring(0, 100), 'i') } }
        ],
        owner: room.owner
      });

      if (similarListings > 0) {
        result.score += this.riskScores.medium;
        result.flags.push('potential_duplicate_listing');
      }

    } catch (error) {
      console.error('Error checking duplicate listings:', error);
    }

    return result;
  }

  /**
   * Check image authenticity (placeholder for ML integration)
   * @param {Object} room - Room object
   * @returns {Object} Risk analysis result
   */
  checkImageAuthenticity(room) {
    const result = { score: 0, flags: [] };

    // Placeholder for future ML-based image analysis
    // This could check for:
    // - Stock photos
    // - Manipulated images
    // - Inappropriate content
    // - Image quality

    if (!room.images || room.images.length === 0) {
      result.score += this.riskScores.high;
      result.flags.push('no_images');
    }

    return result;
  }

  /**
   * Find duplicate content in listings
   * @param {Array} listings - Array of listing objects
   * @returns {Array} Array of duplicate groups
   */
  findDuplicateContent(listings) {
    const duplicates = [];
    const seen = new Set();

    for (let i = 0; i < listings.length; i++) {
      for (let j = i + 1; j < listings.length; j++) {
        const similarity = this.calculateTextSimilarity(
          `${listings[i].title} ${listings[i].description}`,
          `${listings[j].title} ${listings[j].description}`
        );

        if (similarity > 0.8) { // 80% similarity threshold
          const key = [i, j].sort().join('-');
          if (!seen.has(key)) {
            duplicates.push([listings[i], listings[j]]);
            seen.add(key);
          }
        }
      }
    }

    return duplicates;
  }

  /**
   * Find repetitive content in messages
   * @param {Array} messages - Array of message objects
   * @returns {Array} Array of repetitive message groups
   */
  findRepetitiveContent(messages) {
    const repetitive = [];
    const contentCount = {};

    messages.forEach(msg => {
      const content = msg.content.toLowerCase().trim();
      contentCount[content] = (contentCount[content] || 0) + 1;
    });

    Object.entries(contentCount).forEach(([content, count]) => {
      if (count > 3) { // Same message sent more than 3 times
        repetitive.push({ content, count });
      }
    });

    return repetitive;
  }

  /**
   * Calculate text similarity using simple algorithm
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Similarity score (0-1)
   */
  calculateTextSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate risk level from score
   * @param {number} score - Risk score (0-1)
   * @returns {string} Risk level
   */
  calculateRiskLevel(score) {
    if (score >= this.riskScores.critical) return 'critical';
    if (score >= this.riskScores.high) return 'high';
    if (score >= this.riskScores.medium) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on analysis
   * @param {Object} analysis - Fraud analysis result
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.flags.includes('unverified_account')) {
      recommendations.push('Request account verification');
    }

    if (analysis.flags.includes('incomplete_profile')) {
      recommendations.push('Require profile completion');
    }

    if (analysis.flags.includes('bulk_listing_creation')) {
      recommendations.push('Limit listing creation rate');
    }

    if (analysis.flags.includes('high_message_frequency')) {
      recommendations.push('Implement message rate limiting');
    }

    if (analysis.flags.includes('suspicious_keywords')) {
      recommendations.push('Review listing content manually');
    }

    if (analysis.flags.includes('suspiciously_low_price')) {
      recommendations.push('Verify pricing authenticity');
    }

    if (analysis.riskLevel === 'critical') {
      recommendations.push('Immediate account suspension recommended');
    } else if (analysis.riskLevel === 'high') {
      recommendations.push('Enhanced monitoring required');
    }

    if (recommendations.length === 0) {
      recommendations.push('No action required');
    }

    return recommendations;
  }

  /**
   * Generate listing-specific recommendations
   * @param {Object} analysis - Fraud analysis result
   * @returns {Array} Array of recommendations
   */
  generateListingRecommendations(analysis) {
    const recommendations = [];

    if (analysis.flags.includes('poor_title_quality')) {
      recommendations.push('Improve listing title');
    }

    if (analysis.flags.includes('poor_description_quality')) {
      recommendations.push('Enhance listing description');
    }

    if (analysis.flags.includes('insufficient_images')) {
      recommendations.push('Add more listing photos');
    }

    if (analysis.flags.includes('suspicious_keywords')) {
      recommendations.push('Remove suspicious content');
    }

    if (analysis.flags.includes('potential_duplicate_listing')) {
      recommendations.push('Review for duplicate content');
    }

    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      recommendations.push('Manual review required before approval');
    }

    if (recommendations.length === 0) {
      recommendations.push('Listing appears legitimate');
    }

    return recommendations;
  }

  /**
   * Report suspicious activity for manual review
   * @param {string} type - Type of activity ('user', 'listing', 'message')
   * @param {string} id - ID of the item
   * @param {Array} flags - Fraud flags detected
   * @param {number} riskScore - Risk score
   * @returns {Promise<Object>} Report creation result
   */
  async reportSuspiciousActivity(type, id, flags, riskScore) {
    try {
      // Create a report for manual review
      const report = new Report({
        type: 'fraud_suspicion',
        reportedItem: {
          type,
          id
        },
        reason: 'Automated fraud detection',
        description: `Suspicious activity detected: ${flags.join(', ')}`,
        priority: riskScore > this.riskScores.high ? 'high' : 'medium',
        metadata: {
          flags,
          riskScore,
          detectedAt: new Date(),
          detectionMethod: 'automated'
        }
      });

      await report.save();

      return {
        success: true,
        reportId: report._id,
        message: 'Suspicious activity reported for review'
      };
    } catch (error) {
      console.error('Error reporting suspicious activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const fraudDetectionEngine = new FraudDetectionEngine();
