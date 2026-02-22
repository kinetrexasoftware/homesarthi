import User from '../models/User.js';

/**
 * Middleware to check if user has required role(s)
 * @param {...string} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
export const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Refresh user data from database to ensure latest role
      const user = await User.findById(req.user._id).select('role isBlocked verified');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Account has been blocked. Contact support for assistance.'
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
      }

      // Add refreshed user data to request
      req.user = { ...req.user, ...user.toObject() };
      next();
    } catch (error) {
      console.error('Role check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authorization check'
      });
    }
  };
};

/**
 * Middleware to check if user owns the resource or is admin
 * @param {string} resourceIdParam - Parameter name containing resource ID
 * @param {string} resourceModel - Mongoose model name for the resource
 * @param {string} ownerField - Field name that contains owner ID (default: 'owner')
 * @returns {Function} Express middleware function
 */
export const requireOwnershipOrAdmin = (resourceIdParam, resourceModel, ownerField = 'owner') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required'
        });
      }

      // Import the model dynamically
      const Model = (await import(`../models/${resourceModel}.js`))[resourceModel];

      const resource = await Model.findById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      const isOwner = resource[ownerField]?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.'
        });
      }

      // Add resource to request for use in subsequent middleware/controllers
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during ownership check'
      });
    }
  };
};

/**
 * Middleware to check if user is verified (for certain operations)
 * @param {boolean} strict - If true, blocks unverified users; if false, just adds verification status
 * @returns {Function} Express middleware function
 */
export const requireVerification = (strict = true) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Refresh user verification status
      const user = await User.findById(req.user._id).select('verified role');

      if (strict && !user.verified && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Account verification required. Please verify your account to continue.'
        });
      }

      // Add verification status to request
      req.user.verified = user.verified;
      next();
    } catch (error) {
      console.error('Verification check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during verification check'
      });
    }
  };
};

/**
 * Middleware to check subscription/feature access (for future use)
 * @param {string} feature - Feature name to check access for
 * @returns {Function} Express middleware function
 */
export const requireFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // For now, allow all verified users access to basic features
      // This can be extended with subscription logic later
      const user = await User.findById(req.user._id).select('verified role subscription');

      // Admins have access to all features
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has required verification/feature access
      const hasAccess = user.verified && (!user.subscription || user.subscription.features?.includes(feature));

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Access to ${feature} requires account verification or premium subscription`
        });
      }

      next();
    } catch (error) {
      console.error('Feature access check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during feature access check'
      });
    }
  };
};

/**
 * Middleware to validate user permissions for messaging
 * @param {string} action - Action being performed ('send', 'view', 'delete')
 * @returns {Function} Express middleware function
 */
export const validateMessagingPermissions = (action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = await User.findById(req.user._id).select('role isBlocked verified');

      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Messaging is disabled for blocked accounts'
        });
      }

      // Additional checks based on action
      switch (action) {
        case 'send':
          if (!user.verified && user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Account verification required to send messages'
            });
          }
          break;

        case 'view':
          // Basic verification check for viewing messages
          break;

        default:
          break;
      }

      next();
    } catch (error) {
      console.error('Messaging permissions check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during permissions check'
      });
    }
  };
};
