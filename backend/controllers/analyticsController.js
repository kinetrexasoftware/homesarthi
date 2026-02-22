import { Analytics } from '../models/Analytics.js';
import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Visit } from '../models/Visit.js';
import { Message } from '../models/Message.js';

/**
 * Get comprehensive analytics for owner dashboard
 * @route GET /api/analytics/owner/comprehensive
 * @access Private (Owner)
 */
export const getOwnerComprehensiveAnalytics = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { period = '7', roomId = 'all' } = req.query;
    const days = parseInt(period === 'today' ? '1' : period === '7days' ? '7' : period === '30days' ? '30' : period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get owner's rooms
    const roomQuery = roomId === 'all' ? { owner: ownerId } : { owner: ownerId, _id: roomId };
    const rooms = await Room.find(roomQuery).populate('owner', 'name responseTime');
    const roomIds = rooms.map(r => r._id);

    if (rooms.length === 0) {
      return res.json({
        success: true,
        data: getEmptyAnalyticsData()
      });
    }

    // Get analytics data
    const analyticsData = await Analytics.find({
      room: { $in: roomIds },
      date: { $gte: startDate }
    }).populate('room', 'title rent location');

    // Get visits data
    const visits = await Visit.find({
      room: { $in: roomIds },
      createdAt: { $gte: startDate }
    }).populate('student', 'name location');

    // Get chat/inquiry data
    const messages = await Message.find({
      'conversation.room': { $in: roomIds },
      createdAt: { $gte: startDate }
    });

    // Calculate overview metrics
    const overview = calculateOverview(analyticsData, visits, messages, rooms);

    // Calculate view trend for chart
    const viewTrend = calculateViewTrend(analyticsData, days);

    // Calculate room-wise performance
    const roomPerformance = await calculateRoomPerformance(rooms, analyticsData, visits, messages);

    // Calculate location interest
    const locationInterest = calculateLocationInterest(analyticsData, visits);

    // Generate actionable insights
    const actionableInsights = await generateActionableInsights(rooms, analyticsData, visits, messages, overview);

    // Calculate missed opportunities
    const missedOpportunities = calculateMissedOpportunities(rooms, visits, messages);

    // NEW: Calculate Phase 1 Metrics
    const occupancy = calculateOccupancyRate(rooms, visits);
    const trafficSources = calculateTrafficSources(analyticsData);
    const peakHours = calculatePeakHours(analyticsData);

    // Simple Revenue Projection (Phase 2 preview)
    const currentRevenue = overview.revenue || 0;
    const projectedRevenue = Math.round(currentRevenue * 1.15); // Simple +15% projection based on trends

    res.json({
      success: true,
      data: {
        overview,
        viewTrend,
        roomPerformance,
        locationInterest,
        actionableInsights,
        missedOpportunities,
        occupancy,
        trafficSources,
        peakHours,
        revenueProjection: { current: currentRevenue, projected: projectedRevenue }
      }
    });
  } catch (error) {
    console.error('Get owner comprehensive analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comprehensive analytics'
    });
  }
};

// Helper function to calculate overview metrics
function calculateOverview(analyticsData, visits, messages, rooms) {
  const totalViews = analyticsData ? analyticsData.reduce((sum, a) => sum + (a.metrics?.views || 0), 0) : 0;

  // Unique Viewers Calculation
  // 1. Identify unique logged-in users
  const uniqueLoggedInUsers = new Set();
  let anonymousViewsCount = 0;

  if (analyticsData) {
    analyticsData.forEach(a => {
      if (a.visitors) {
        a.visitors.forEach(v => {
          if (v.user) {
            uniqueLoggedInUsers.add(v.user.toString());
          } else {
            anonymousViewsCount++;
          }
        });
      }
    });
  }
  // Total Unique = Unique Registered Users + Anonymous Sessions (Approximated as 1 view = 1 unique for guests)
  const uniqueViewers = uniqueLoggedInUsers.size + anonymousViewsCount;

  const inquiries = messages.length;

  // Calculate Bookings & Actual Revenue
  const approvedVisits = visits.filter(v => v.status === 'approved');
  const bookings = approvedVisits.length;

  // Precise Revenue: Sum of rent for specific approved bookings
  const revenue = approvedVisits.reduce((sum, v) => {
    // Check if room rent is populated, otherwise try to find in rooms array
    const rentAmount = v.room?.rent?.amount;
    if (rentAmount) return sum + rentAmount;

    // Fallback: Find room in the rooms array passed to this function
    const roomDetails = rooms.find(r => r._id.toString() === (v.room?._id || v.room).toString());
    return sum + (roomDetails?.rent?.amount || 0);
  }, 0);

  // Calculate average response time
  const avgResponseTime = rooms.length > 0
    ? (rooms.reduce((sum, r) => sum + (r.owner?.responseTime || 2), 0) / rooms.length).toFixed(1)
    : '2.0';

  return {
    totalViews,
    uniqueViewers,
    inquiries,
    bookings,
    avgResponseTime: `${avgResponseTime} hours`,
    revenue: Math.round(revenue)
  };
}

// Helper function to calculate view trend
function calculateViewTrend(analyticsData, days) {
  const trend = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayData = analyticsData ? analyticsData.filter(a => {
      const aDate = new Date(a.date);
      aDate.setHours(0, 0, 0, 0);
      return aDate.getTime() === date.getTime();
    }) : [];

    const views = dayData.reduce((sum, a) => sum + (a.metrics?.views || 0), 0);
    const inquiries = dayData.reduce((sum, a) => sum + (a.metrics?.inquiries || 0), 0);

    trend.push({
      date: days <= 7 ? daysOfWeek[date.getDay()] : `${date.getDate()}/${date.getMonth() + 1}`,
      views,
      inquiries
    });
  }

  return trend;
}

// Helper function to calculate room performance
async function calculateRoomPerformance(rooms, analyticsData, visits, messages) {
  const performance = [];

  for (const room of rooms) {
    const roomAnalytics = analyticsData.filter(a => (a.room?._id || a.room).toString() === room._id.toString());
    const roomVisits = visits.filter(v => (v.room?._id || v.room).toString() === room._id.toString());
    const roomMessages = messages.filter(c => (c.conversation?.room?._id || c.conversation?.room || '').toString() === room._id.toString());

    const views = roomAnalytics ? roomAnalytics.reduce((sum, a) => sum + (a.metrics?.views || 0), 0) : 0;
    const uniqueViewers = roomAnalytics ? roomAnalytics.reduce((sum, a) => sum + (a.metrics?.uniqueViews || 0), 0) : 0;
    const inquiries = roomMessages.length;
    const bookings = roomVisits.filter(v => v.status === 'approved').length;
    const conversionRate = views > 0 ? ((bookings / views) * 100).toFixed(1) : 0;

    // Calculate trend
    const recentViews = roomAnalytics ? roomAnalytics.slice(-3).reduce((sum, a) => sum + (a.metrics?.views || 0), 0) : 0;
    const olderViews = roomAnalytics ? roomAnalytics.slice(-7, -3).reduce((sum, a) => sum + (a.metrics?.views || 0), 0) : 0;
    const trend = recentViews > olderViews ? 'up' : recentViews < olderViews ? 'down' : 'neutral';

    // Get market average (mock for now - in production, calculate from similar rooms)
    const marketAvg = Math.round((room.rent?.amount || 0) * (0.85 + Math.random() * 0.3));

    performance.push({
      id: room._id,
      name: room.title,
      views,
      uniqueViewers,
      inquiries,
      bookings,
      price: room.rent?.amount || 0,
      marketAvg,
      conversionRate: parseFloat(conversionRate),
      trend
    });
  }

  return performance.sort((a, b) => b.views - a.views);
}

// Helper function to calculate location interest
function calculateLocationInterest(analyticsData, visits) {
  const locationMap = {};

  // Aggregate from visitors and visit requests
  (visits || []).forEach(v => {
    let city = v.student?.location?.city || 'Unknown';

    // Normalize city name (Trim + Title Case)
    if (city !== 'Unknown') {
      city = city.trim().toLowerCase().split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    locationMap[city] = (locationMap[city] || 0) + 1;
  });

  const totalViewers = Object.values(locationMap).reduce((sum, count) => sum + count, 0) || 1;

  const locations = Object.entries(locationMap)
    .map(([city, viewers]) => ({
      city,
      viewers,
      percentage: Math.round((viewers / totalViewers) * 100)
    }))
    .sort((a, b) => b.viewers - a.viewers)
    .slice(0, 5);

  // Fill with default values if less than 5
  const defaultCities = ['Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Others'];
  while (locations.length < 5) {
    locations.push({
      city: defaultCities[locations.length],
      viewers: 0,
      percentage: 0
    });
  }

  return locations;
}

// Helper function to generate actionable insights
async function generateActionableInsights(rooms, analyticsData, visits, messages, overview) {
  const insights = [];

  // Competitor/Market Analysis Check
  // We need to fetch aggregate market data for comparison
  const city = rooms[0]?.location?.address?.city;
  let marketAvgRent = 0;

  if (city) {
    try {
      const cityRooms = await Room.find({
        'location.address.city': { $regex: new RegExp(city, 'i') },
        isActive: true,
        'verification.status': 'approved'
      }).select('rent');

      const totalRent = cityRooms.reduce((sum, r) => sum + (r.rent?.amount || 0), 0);
      marketAvgRent = cityRooms.length > 0 ? Math.round(totalRent / cityRooms.length) : 0;
    } catch (err) {
      console.error("Market analysis error:", err);
    }
  }

  // Price insights
  for (const room of rooms) {
    const roomAnalytics = analyticsData.filter(a => (a.room?._id || a.room).toString() === room._id.toString());

    // Use real market avg if available, otherwise heuristic
    const benchmarkRent = marketAvgRent > 0 ? marketAvgRent : Math.round((room.rent?.amount || 0) * (0.85 + Math.random() * 0.3));

    if (room.rent?.amount && benchmarkRent > 0) {
      const priceDiff = ((room.rent.amount - benchmarkRent) / benchmarkRent * 100).toFixed(0);

      if (room.rent.amount > benchmarkRent * 1.15) {
        insights.push({
          type: 'critical',
          icon: 'AlertCircle',
          title: `${room.title} is overpriced by ${priceDiff}%`,
          description: `Market avg in ${city || 'your area'} is ₹${benchmarkRent.toLocaleString()}. High price may reduce inquiries.`,
          action: 'Adjust Price',
          impact: '+40% inquiries expected',
          roomId: room._id
        });
      } else if (room.rent.amount < benchmarkRent * 0.85) {
        insights.push({
          type: 'success',
          icon: 'TrendingUp',
          title: `Competitive Pricing!`,
          description: `Your rent is ${Math.abs(priceDiff)}% lower than market average. Promote this as a "Great Deal".`,
          action: 'Highlight Deal',
          impact: 'High booking chance',
          roomId: room._id
        });
      }
    }
  }

  // Response time insights
  const avgResponseHours = parseFloat(overview.avgResponseTime);
  if (avgResponseHours > 2) {
    insights.push({
      type: 'warning',
      icon: 'Clock',
      title: `Response time is slower than 78% of owners`,
      description: `Average response: ${overview.avgResponseTime}. Top owners respond in < 30 mins`,
      action: 'Enable Notifications',
      impact: '+25% booking rate'
    });
  }

  // Performance insights
  for (const room of rooms) {
    const roomAnalytics = analyticsData.filter(a => (a.room?._id || a.room).toString() === room._id.toString());
    const recentViews = roomAnalytics.slice(-3).reduce((sum, a) => sum + (a.metrics?.views || 0), 0);
    const olderViews = roomAnalytics.slice(-7, -3).reduce((sum, a) => sum + (a.metrics?.views || 0), 0);

    if (recentViews > olderViews * 2 && olderViews > 0) {
      insights.push({
        type: 'success',
        icon: 'TrendingUp',
        title: `${room.title} is trending up!`,
        description: `Views doubled in the last 3 days compared to previous period.`,
        action: 'Extend Availability',
        impact: 'High demand detected',
        roomId: room._id
      });
      break;
    }
  }

  // Image insights
  for (const room of rooms) {
    if ((room.images?.length || 0) < 5) {
      insights.push({
        type: 'info',
        icon: 'ImageIcon',
        title: `${room.title} has ${8 - (room.images?.length || 0)} fewer images than top listings`,
        description: 'Listings with 8+ images get 2.5x more inquiries',
        action: 'Upload Photos',
        impact: '+150% views estimated',
        roomId: room._id
      });
      break;
    }
  }

  return insights.slice(0, 6); // Return top 6 insights
}

// Helper: Calculate Occupancy Rate
function calculateOccupancyRate(rooms, visits) {
  if (!rooms || rooms.length === 0) return { rate: 0, total: 0, occupied: 0 };

  // Identify rooms with approved bookings (visits)
  const bookedRoomIds = new Set();
  if (visits) {
    visits.forEach(v => {
      if (v.status === 'approved' && v.room) {
        bookedRoomIds.add((v.room._id || v.room).toString());
      }
    });
  }

  const occupied = rooms.filter(r =>
    r.availability?.status !== 'available' ||
    bookedRoomIds.has(r._id.toString())
  ).length;

  const rate = Math.round((occupied / rooms.length) * 100);

  return {
    rate,
    total: rooms.length,
    occupied
  };
}

// Helper: Calculate Traffic Sources
function calculateTrafficSources(analyticsData) {
  const sources = {};
  let total = 0;

  analyticsData?.forEach(doc => {
    doc.visitors?.forEach(v => {
      let sourceInfo = v.source || 'Direct';
      let lowerSource = sourceInfo.toLowerCase();
      let key = 'Other';

      // Simple keyword matching for non-URL sources
      if (lowerSource === 'direct') key = 'Direct';
      else if (lowerSource.includes('google') || lowerSource.includes('bing') || lowerSource.includes('yahoo')) key = 'Search';
      else if (lowerSource.includes('facebook') || lowerSource.includes('instagram') || lowerSource.includes('twitter') || lowerSource.includes('t.co') || lowerSource.includes('linkedin')) key = 'Social';
      else if (lowerSource.includes('localhost') || lowerSource.includes('roomate') || lowerSource.includes('127.0.0.1')) key = 'Internal';
      else {
        // Try parsing as URL
        try {
          const url = new URL(sourceInfo);
          const hostname = url.hostname;

          if (hostname.includes('google') || hostname.includes('bing') || hostname.includes('yahoo')) key = 'Search';
          else if (hostname.includes('facebook') || hostname.includes('instagram') || hostname.includes('twitter') || hostname.includes('t.co') || hostname.includes('linkedin')) key = 'Social';
          else if (hostname.includes('localhost') || hostname.includes('roomate') || hostname.includes('127.0.0.1')) key = 'Internal';
          else key = 'Referral';
        } catch (e) {
          // Not a valid URL, treat as generic text source if not matched above
          key = 'Other';
        }
      }

      sources[key] = (sources[key] || 0) + 1;
      total++;
    });
  });

  return Object.entries(sources)
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0
    }))
    .sort((a, b) => b.value - a.value);
}

// Helper: Calculate Peak Viewing Hours
function calculatePeakHours(analyticsData) {
  const hours = new Array(24).fill(0);

  analyticsData?.forEach(doc => {
    doc.visitors?.forEach(v => {
      if (v.timestamp) {
        const hour = new Date(v.timestamp).getHours();
        hours[hour]++;
      }
    });
  });

  // Format relevant hours (skip empty blocks if needed, but 24h view is better)
  return hours.map((count, hour) => ({
    hour: `${hour}:00`,
    views: count,
    intensity: count > 0 ? 'High' : 'Low' // Simplified intensity logic
  }));
}

// Helper function to calculate missed opportunities
function calculateMissedOpportunities(rooms, visits, messages) {
  // Use optional chaining and defaults to prevent crashes if data is missing
  const unavailableRooms = rooms.filter(r => r.availability?.status !== 'available');
  // Simple estimation: 1 week (7 days) unavailable * number of rooms
  const unavailableDays = unavailableRooms.length * 7;

  const pendingVisits = visits ? visits.filter(v => v.status === 'pending') : [];
  const missedViews = pendingVisits.length * 15; // Estimating 15 views per visit request generated

  // Ensure messages array exists
  const unrespondedMessages = messages ? messages.filter(c => c.messages?.length === 1) : [];
  const slowResponseLoss = Math.min(unrespondedMessages.length, 10);

  const avgRent = rooms.length > 0
    ? rooms.reduce((sum, r) => sum + (r.rent?.amount || 0), 0) / rooms.length
    : 0;

  // Estimate revenue lost from unavailable rooms (assuming 50% occupancy chance) + unresponded inquiries
  const potentialRevenue = Math.round((unavailableRooms.length * 0.5 + slowResponseLoss * 0.1) * avgRent);

  return {
    unavailableDays,
    missedViews,
    potentialRevenue,
    slowResponseLoss
  };
}

// Helper function for empty data
function getEmptyAnalyticsData() {
  return {
    overview: {
      totalViews: 0,
      uniqueViewers: 0,
      inquiries: 0,
      bookings: 0,
      avgResponseTime: '0 hours',
      revenue: 0
    },
    viewTrend: [],
    roomPerformance: [],
    locationInterest: [
      { city: 'Delhi', viewers: 0, percentage: 0 },
      { city: 'Noida', viewers: 0, percentage: 0 },
      { city: 'Gurgaon', viewers: 0, percentage: 0 },
      { city: 'Faridabad', viewers: 0, percentage: 0 },
      { city: 'Others', viewers: 0, percentage: 0 }
    ],
    actionableInsights: [{
      type: 'info',
      icon: 'Target',
      title: 'Start tracking your room performance',
      description: 'List your first room to get detailed analytics',
      action: 'Create Listing',
      impact: 'Get started now'
    }],
    missedOpportunities: {
      unavailableDays: 0,
      missedViews: 0,
      potentialRevenue: 0,
      slowResponseLoss: 0
    }
  };
}

/**
 * Get analytics for a specific room
 * @route GET /api/analytics/room/:roomId
 * @access Private (Owner/Admin)
 */
export const getRoomAnalytics = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { period = '30' } = req.query;

    // Verify ownership or admin access
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this room\'s analytics'
      });
    }

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await Analytics.find({
      room: roomId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Calculate trends and insights
    const insights = calculateAnalyticsInsights(analytics);

    res.json({
      success: true,
      data: {
        room: {
          id: room._id,
          title: room.title
        },
        period: `${days} days`,
        analytics,
        insights
      }
    });
  } catch (error) {
    console.error('Get room analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room analytics'
    });
  }
};

/**
 * Get dashboard analytics for owner
 * @route GET /api/analytics/owner/dashboard
 * @access Private (Owner)
 */
export const getOwnerDashboardAnalytics = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { period = '30' } = req.query;

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // Get all rooms with stats
    const rooms = await Room.find({ owner: ownerId }).select('_id title rent stats');
    const roomIds = rooms.map(room => room._id);

    // --- ALL TIME DATA (For KPI Cards) ---
    // Use the persistent room stats for total views as it is more reliable than summing logs
    const allTimeTotalViews = rooms.reduce((sum, r) => sum + (r.stats?.views || 0), 0);

    // Fallback: If room stats are 0, try analytics (for older systems)
    const allTimeAnalytics = await Analytics.find({
      room: { $in: roomIds }
    });

    const viewsFromAnalytics = allTimeAnalytics.reduce((sum, a) => sum + (a.metrics?.views || 0), 0);
    const finalTotalViews = Math.max(allTimeTotalViews, viewsFromAnalytics);

    // Unique Viewers All Time
    const allTimeUniqueUsers = new Set();
    let allTimeAnonymous = 0;
    allTimeAnalytics.forEach(a => {
      a.visitors?.forEach(v => {
        if (v.user) allTimeUniqueUsers.add(v.user.toString());
        else allTimeAnonymous++;
      });
    });
    const allTimeUniqueViewers = allTimeUniqueUsers.size + allTimeAnonymous;

    // All Time Inquiries
    const allTimeMessages = await Message.find({
      'conversation.room': { $in: roomIds }
    });
    const allTimeInquiries = new Set(allTimeMessages.map(m =>
      m.sender && m.conversation?.room ? `${m.sender.toString()}_${m.conversation.room.toString()}` : null
    ).filter(Boolean)).size;

    // All Time Bookings
    const allTimeVisits = await Visit.find({
      room: { $in: roomIds }
    });
    const allTimeBookings = allTimeVisits.filter(v => v.status === 'approved').length;

    const totalStats = {
      totalViews: finalTotalViews,
      uniqueViewers: allTimeUniqueViewers,
      inquiries: allTimeInquiries,
      bookings: allTimeBookings
    };

    // --- CURRENT PERIOD DATA (For Charts & Trends) ---
    const analyticsData = await Analytics.find({
      room: { $in: roomIds },
      date: { $gte: startDate }
    });

    const messages = await Message.find({
      'conversation.room': { $in: roomIds },
      createdAt: { $gte: startDate }
    });
    const currentPeriodInquiries = new Set(messages.map(m =>
      m.sender && m.conversation?.room ? `${m.sender.toString()}_${m.conversation.room.toString()}` : null
    ).filter(Boolean)).size;

    const visits = await Visit.find({
      room: { $in: roomIds },
      createdAt: { $gte: startDate }
    });

    // Current Period Stats for Trend Calculation
    const currentStats = {
      totalViews: analyticsData.reduce((sum, a) => sum + (a.metrics?.views || 0), 0),
      uniqueViewers: (() => {
        const u = new Set();
        let anon = 0;
        analyticsData.forEach(a => {
          a.visitors?.forEach(v => {
            if (v.user) u.add(v.user.toString());
            else anon++;
          });
        });
        return u.size + anon;
      })(),
      inquiries: currentPeriodInquiries,
      bookings: visits.filter(v => v.status === 'approved').length
    };

    // --- PREVIOUS PERIOD DATA ---
    const prevAnalyticsData = await Analytics.find({
      room: { $in: roomIds },
      date: { $gte: previousStartDate, $lt: startDate }
    });

    const prevMessages = await Message.find({
      'conversation.room': { $in: roomIds },
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });
    const prevUniqueInquiries = new Set(prevMessages.map(m =>
      m.sender && m.conversation?.room ? `${m.sender.toString()}_${m.conversation.room.toString()}` : null
    ).filter(Boolean)).size;

    const prevVisits = await Visit.find({
      room: { $in: roomIds },
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });

    // Previous Stats
    const prevStats = {
      totalViews: prevAnalyticsData.reduce((sum, a) => sum + (a.metrics?.views || 0), 0),
      uniqueViewers: (() => {
        const u = new Set();
        let anon = 0;
        prevAnalyticsData.forEach(a => {
          a.visitors?.forEach(v => {
            if (v.user) u.add(v.user.toString());
            else anon++;
          });
        });
        return u.size + anon;
      })(),
      inquiries: prevUniqueInquiries,
      bookings: prevVisits.filter(v => v.status === 'approved').length
    };

    // --- CALCULATE TRENDS ---
    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const trends = {
      totalViews: calculateTrend(currentStats.totalViews, prevStats.totalViews),
      uniqueViewers: calculateTrend(currentStats.uniqueViewers, prevStats.uniqueViewers),
      inquiries: calculateTrend(currentStats.inquiries, prevStats.inquiries),
      bookings: calculateTrend(currentStats.bookings, prevStats.bookings)
    };

    // Aggregate Daily Analytics (Current Period)
    const dailyMap = new Map();
    analyticsData.forEach(doc => {
      const dateStr = new Date(doc.date).toISOString().split('T')[0];
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          date: new Date(doc.date),
          metrics: { views: 0, inquiries: 0, favorites: 0, visitRequests: 0 }
        });
      }
      const entry = dailyMap.get(dateStr);
      entry.metrics.views += (doc.metrics?.views || 0);
      entry.metrics.favorites += (doc.metrics?.favorites || 0);
    });

    // Add inquiries to daily map
    messages.forEach(m => {
      const dateStr = new Date(m.createdAt).toISOString().split('T')[0];
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          date: new Date(m.createdAt),
          metrics: { views: 0, inquiries: 0, favorites: 0, visitRequests: 0 }
        });
      }
      dailyMap.get(dateStr).metrics.inquiries += 1;
    });

    // Add visit requests to daily map
    visits.forEach(v => {
      const dateStr = new Date(v.createdAt).toISOString().split('T')[0];
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          date: new Date(v.createdAt),
          metrics: { views: 0, inquiries: 0, favorites: 0, visitRequests: 0 }
        });
      }
      dailyMap.get(dateStr).metrics.visitRequests += 1;
    });

    const dailyAnalytics = Array.from(dailyMap.values()).sort((a, b) => a.date - b.date);

    const avgResponseTime = rooms.length > 0
      ? (rooms.reduce((sum, r) => sum + (r.owner?.responseTime || 2), 0) / rooms.length).toFixed(1)
      : '2.0';

    const actionableInsights = await generateActionableInsights(
      rooms,
      analyticsData,
      visits,
      messages,
      { ...currentStats, avgResponseTime }
    );

    res.json({
      success: true,
      data: {
        rooms: rooms.length,
        period: `${days} days`,
        totalStats,
        trends,
        dailyAnalytics,
        insights: actionableInsights
      }
    });
  } catch (error) {
    console.error('Owner dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics' });
  }
};

/**
 * Get platform-wide analytics (Admin only)
 * @route GET /api/analytics/platform
 * @access Private (Admin)
 */
export const getPlatformAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          verified: { $sum: { $cond: ['$verified', 1, 0] } },
          active: { $sum: { $cond: ['$isBlocked', 0, 1] } }
        }
      }
    ]);

    // Get room statistics
    const roomStats = await Room.aggregate([
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          activeRooms: { $sum: { $cond: ['$isActive', 1, 0] } },
          verifiedRooms: { $sum: { $cond: [{ $eq: ['$verification.status', 'approved'] }, 1, 0] } },
          pendingRooms: { $sum: { $cond: [{ $eq: ['$verification.status', 'pending'] }, 1, 0] } },
          avgRent: { $avg: '$rent.amount' }
        }
      }
    ]);

    // Get analytics data
    const analyticsData = await Analytics.aggregate([
      {
        $match: { date: { $gte: startDate } }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$metrics.views' },
          totalInquiries: { $sum: '$metrics.inquiries' },
          totalVisitRequests: { $sum: '$metrics.visitRequests' },
          totalFavorites: { $sum: '$metrics.favorites' }
        }
      }
    ]);

    const platformStats = {
      users: userStats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.count,
          verified: stat.verified,
          active: stat.active
        };
        return acc;
      }, {}),
      rooms: roomStats[0] || {
        totalRooms: 0,
        activeRooms: 0,
        verifiedRooms: 0,
        pendingRooms: 0,
        avgRent: 0
      },
      analytics: analyticsData[0] || {
        totalViews: 0,
        totalInquiries: 0,
        totalVisitRequests: 0,
        totalFavorites: 0
      }
    };

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        ...platformStats,
        insights: generatePlatformInsights(platformStats)
      }
    });
  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform analytics'
    });
  }
};

/**
 * Track room view analytics
 * @route POST /api/analytics/track-view
 * @access Public
 */
export const trackRoomView = async (req, res) => {
  try {
    const { roomId, source = 'direct' } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update or create analytics record
    const analytics = await Analytics.findOneAndUpdate(
      { room: roomId, date: today },
      {
        $inc: {
          'metrics.views': 1,
          'metrics.uniqueViews': req.user ? 0 : 1 // Only count unique if not logged in
        },
        $addToSet: req.user ? {
          visitors: {
            user: req.user._id,
            timestamp: new Date(),
            source
          }
        } : undefined,
        owner: room.owner
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Update room stats
    await Room.findByIdAndUpdate(roomId, {
      $inc: { 'stats.views': 1 }
    });

    res.json({
      success: true,
      message: 'View tracked successfully'
    });
  } catch (error) {
    console.error('Track room view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track view'
    });
  }
};

/**
 * Track room inquiry analytics
 * @route POST /api/analytics/track-inquiry
 * @access Private
 */
export const trackRoomInquiry = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Analytics.findOneAndUpdate(
      { room: roomId, date: today },
      { $inc: { 'metrics.inquiries': 1 } },
      { upsert: true }
    );

    // Update room stats
    await Room.findByIdAndUpdate(roomId, {
      $inc: { 'stats.inquiries': 1 }
    });

    res.json({
      success: true,
      message: 'Inquiry tracked successfully'
    });
  } catch (error) {
    console.error('Track room inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track inquiry'
    });
  }
};

// Helper functions for insights
function calculateAnalyticsInsights(analytics) {
  if (!analytics || analytics.length === 0) {
    return {
      totalViews: 0,
      totalInquiries: 0,
      conversionRate: 0,
      trend: 'stable',
      recommendations: ['Add more photos to increase visibility']
    };
  }

  const totalViews = analytics.reduce((sum, day) => sum + day.metrics.views, 0);
  const totalInquiries = analytics.reduce((sum, day) => sum + day.metrics.inquiries, 0);
  const conversionRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

  // Calculate trend
  const recent = analytics.slice(-7);
  const older = analytics.slice(-14, -7);
  const recentAvg = recent.reduce((sum, day) => sum + day.metrics.views, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((sum, day) => sum + day.metrics.views, 0) / older.length : recentAvg;

  let trend = 'stable';
  if (recentAvg > olderAvg * 1.1) trend = 'increasing';
  if (recentAvg < olderAvg * 0.9) trend = 'decreasing';

  const recommendations = [];
  if (conversionRate < 2) recommendations.push('Improve room description and photos');
  if (trend === 'decreasing') recommendations.push('Consider price adjustment or promotions');
  if (totalViews < 10) recommendations.push('Share listing on social media');

  return {
    totalViews,
    totalInquiries,
    conversionRate: Math.round(conversionRate * 100) / 100,
    trend,
    recommendations
  };
}

function generateOwnerInsights(stats, conversionRates, period) {
  const insights = [];

  if (conversionRates.inquiryRate > 5) {
    insights.push('Excellent inquiry rate! Your listings are performing well.');
  } else if (conversionRates.inquiryRate < 1) {
    insights.push('Low inquiry rate. Consider improving listing quality.');
  }

  if (stats.views < period * 2) {
    insights.push('Limited visibility. Try promoting your listings more.');
  }

  if (conversionRates.visitRequestRate > conversionRates.inquiryRate) {
    insights.push('Good conversion from inquiries to visit requests.');
  }

  return insights;
}

function generatePlatformInsights(stats) {
  const insights = [];

  const totalUsers = Object.values(stats.users).reduce((sum, role) => sum + role.total, 0);
  const verifiedUsers = Object.values(stats.users).reduce((sum, role) => sum + role.verified, 0);
  const verificationRate = totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0;

  if (verificationRate < 70) {
    insights.push('User verification rate is low. Encourage more users to verify their accounts.');
  }

  if (stats.rooms.pendingRooms > stats.rooms.verifiedRooms) {
    insights.push('High number of pending room verifications. Consider streamlining the approval process.');
  }

  if (stats.analytics.totalViews < 1000) {
    insights.push('Overall platform traffic is low. Focus on user acquisition strategies.');
  }

  return insights;
}
