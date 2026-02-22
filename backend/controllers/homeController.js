import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Testimonial } from '../models/Testimonial.js';
import { Visit } from '../models/Visit.js';
import { FAQ } from '../models/FAQ.js';

// Get Platform Metrics
export const getHomeMetrics = async (req, res) => {
    try {
        const metrics = await Room.aggregate([
            { $match: { 'verification.status': 'approved' } },
            {
                $facet: {
                    roomCount: [{ $count: 'count' }],
                    cities: [
                        { $group: { _id: { $toLower: { $trim: { input: '$location.address.city' } } } } },
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const owners = await User.countDocuments({ role: 'owner', verified: true });

        const activeListings = metrics[0]?.roomCount[0]?.count || 0;
        const citiesCovered = metrics[0]?.cities[0]?.count || 0;

        // Average Response Time Calculation could be expensive, caching recommended in prod
        // Simplified for now: return hours
        const avgResponseTimeHours = 4; // Placeholder until Message model aggregation implemented

        res.json({
            success: true,
            data: {
                activeListings,
                verifiedOwners: owners,
                citiesCovered,
                avgResponseTimeHours
            }
        });
    } catch (error) {
        console.error('Metrics Error:', error);
        res.status(500).json({ success: false, message: 'Metrics unavailable' });
    }
};

// Get Verified Testimonials
export const getTestimonials = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        const testimonials = await Testimonial.find({ isVerified: true })
            .sort('-createdAt')
            .limit(limit)
            .select('studentName college city message');

        res.json({ success: true, data: testimonials });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch testimonials' });
    }
};

// Get Recent Activity
export const getRecentActivity = async (req, res) => {
    try {
        const activities = await Promise.all([
            // Recent approved rooms
            Room.find({ 'verification.status': 'approved' })
                .sort('-verification.verifiedAt')
                .limit(5)
                .select('location.address.city createdAt')
                .lean()
                .then(rooms => rooms.map(r => ({
                    type: 'NEW_LISTING',
                    location: r.location.address.city,
                    timestamp: r.createdAt
                }))),

            // Recent completed visits
            Visit.find({ status: 'completed' })
                .sort('-updatedAt')
                .limit(5)
                .populate('room', 'location.address.city')
                .lean()
                .then(visits => visits.map(v => ({
                    type: 'ROOM_FOUND', // Proxy for room found
                    location: v.room?.location?.address?.city || 'Unknown',
                    timestamp: v.updatedAt
                })))
        ]);

        const mixedActivity = activities.flat()
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        res.json({ success: true, data: mixedActivity });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch activity' });
    }
};

// Get Featured Locations
export const getFeaturedLocations = async (req, res) => {
    try {
        const locations = await Room.aggregate([
            { $match: { 'verification.status': 'approved' } },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: '$location.address.city' } } },
                    listingCount: { $sum: 1 },
                    originalName: { $first: '$location.address.city' }
                }
            },
            { $sort: { listingCount: -1 } },
            { $limit: 12 },
            {
                $project: {
                    cityName: '$originalName',
                    listingCount: 1,
                    _id: 0
                }
            }
        ]);

        res.json({ success: true, data: locations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch locations' });
    }
};

// Get FAQs
export const getFAQs = async (req, res) => {
    try {
        const category = req.query.category || 'general';
        const faqs = await FAQ.find({ isActive: true, category })
            .sort('order')
            .select('question answer');

        res.json({ success: true, data: faqs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch FAQs' });
    }
};
