import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    getHomeMetrics,
    getTestimonials,
    getRecentActivity,
    getFeaturedLocations,
    getFAQs
} from '../controllers/homeController.js';

const router = express.Router();

// Rate Limiters
const metricsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20 // Limit each IP to 20 requests per minute
});

router.get('/metrics/home', metricsLimiter, getHomeMetrics);
router.get('/testimonials', getTestimonials);
router.get('/activity/recent', getRecentActivity);
router.get('/locations/featured', getFeaturedLocations);
router.get('/faqs', getFAQs);

export default router;
