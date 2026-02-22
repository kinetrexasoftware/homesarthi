import NodeCache from 'node-cache';
import XLSX from 'xlsx';
import { Parser } from 'json2csv';

// Analytics Cache - 5 minute TTL
const analyticsCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Get cached analytics or fetch fresh data
 */
export const getCachedAnalytics = async (cacheKey, fetchFunction) => {
    const cached = analyticsCache.get(cacheKey);
    if (cached) {
        return { data: cached, fromCache: true };
    }

    const data = await fetchFunction();
    analyticsCache.set(cacheKey, data);
    return { data, fromCache: false };
};

/**
 * Clear specific cache key or entire cache
 */
export const clearAnalyticsCache = (key = null) => {
    if (key) {
        analyticsCache.del(key);
    } else {
        analyticsCache.flushAll();
    }
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (data, fields = null) => {
    try {
        const parser = new Parser({ fields });
        return parser.parse(data);
    } catch (error) {
        throw new Error(`CSV Export Error: ${error.message}`);
    }
};

/**
 * Export data to Excel format
 */
export const exportToExcel = (data, sheetName = 'Analytics') => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
        throw new Error(`Excel Export Error: ${error.message}`);
    }
};

/**
 * Build dynamic match stage for aggregation
 */
export const buildMatchStage = (filters = {}, dateRange = {}) => {
    const match = {};

    // Apply custom filters
    Object.keys(filters).forEach(key => {
        if (filters[key]) {
            // Handle case-insensitive string matching for location fields
            if (key.includes('location') || key.includes('city') || key.includes('state')) {
                match[key] = { $regex: new RegExp(`^${filters[key]}$`, 'i') };
            } else {
                match[key] = filters[key];
            }
        }
    });

    // Apply date range
    if (dateRange.start || dateRange.end) {
        match.createdAt = {};
        if (dateRange.start) match.createdAt.$gte = new Date(dateRange.start);
        if (dateRange.end) match.createdAt.$lte = new Date(dateRange.end);
    }

    return match;
};

/**
 * Build dynamic group stage for aggregation
 */
export const buildGroupStage = (groupBy = [], granularity = null) => {
    const groupStage = { _id: {} };

    // Handle temporal grouping
    if (granularity) {
        const formatMap = {
            daily: '%Y-%m-%d',
            weekly: '%Y-W%U',
            monthly: '%Y-%m',
            yearly: '%Y'
        };

        groupStage._id.period = {
            $dateToString: { format: formatMap[granularity] || formatMap.daily, date: '$createdAt' }
        };
    }

    // Handle custom grouping
    groupBy.forEach(field => {
        if (field === 'city') {
            groupStage._id.city = { $toLower: '$location.city' };
            groupStage.cityName = { $first: '$location.city' };
        } else if (field === 'state') {
            groupStage._id.state = { $toLower: '$location.state' };
            groupStage.stateName = { $first: '$location.state' };
        } else if (field === 'role') {
            groupStage._id.role = '$role';
        } else if (field === 'status') {
            groupStage._id.status = '$status';
        } else {
            groupStage._id[field] = `$${field}`;
        }
    });

    return groupStage;
};

/**
 * Add metric calculations to group stage
 */
export const addMetricCalculations = (groupStage, metrics = []) => {
    const metricDefinitions = {
        count: { $sum: 1 },
        totalUsers: { $sum: 1 },
        students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
        owners: { $sum: { $cond: [{ $eq: ['$role', 'owner'] }, 1, 0] } },
        verified: { $sum: { $cond: ['$verified', 1, 0] } },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        avgRent: { $avg: '$rent.amount' },
        totalRent: { $sum: '$rent.amount' },
        totalDeposit: { $sum: '$rent.deposit' },
        totalViews: { $sum: '$stats.views' },
        totalBookmarks: { $sum: '$stats.bookmarks' },
        activeListings: { $sum: { $cond: ['$isActive', 1, 0] } },
        pendingListings: { $sum: { $cond: [{ $eq: ['$verification.status', 'pending'] }, 1, 0] } },
        approvedListings: { $sum: { $cond: [{ $eq: ['$verification.status', 'approved'] }, 1, 0] } }
    };

    metrics.forEach(metric => {
        if (metricDefinitions[metric]) {
            groupStage[metric] = metricDefinitions[metric];
        }
    });

    return groupStage;
};

/**
 * Format aggregation results
 */
export const formatAggregationResults = (results) => {
    return results.map(item => {
        const formatted = { ...item };

        // Restore proper casing for location fields
        if (item.cityName) formatted._id = item.cityName;
        if (item.stateName) formatted._id = item.stateName;

        // Clean up temporary fields
        delete formatted.cityName;
        delete formatted.stateName;

        return formatted;
    });
};
