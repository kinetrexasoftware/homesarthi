import express from 'express';
import {
  getPendingRooms,
  approveRoom,
  rejectRoom,
  getPendingOwners,
  verifyOwner,
  getAllReports,
  resolveReport,
  getDashboardStats,
  getUsers,
  getUserStats,
  suspendUser,
  activateUser,
  approveUser,
  deleteUser,
  getReportAnalytics,
  getGeoRiskData,
  getAuditLogs,
  globalSearch,
  getRooms,
  getUsersByLocation,
  getListingsByLocation,
  getGeographicInsights,
  getBehaviorAnalytics,
  getFinancialAnalytics,
  getConversionAnalytics,
  getUnifiedAnalytics,
  getTimeSeriesAnalytics,
  getComparisonAnalytics,
  getPlatformOverview,
  getGeoDetailedAnalytics,
  downloadRoomReports,
  downloadStudentReports,
  downloadVisitReports
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/search', globalSearch);
router.get('/rooms', getRooms);
router.get('/rooms/export-reports', downloadRoomReports);
router.get('/users/export-students', downloadStudentReports);
router.get('/visits/export', downloadVisitReports);
router.get('/rooms/pending', getPendingRooms);
router.put('/rooms/:id/approve', approveRoom);
router.put('/rooms/:id/reject', rejectRoom);
router.get('/owners/pending', getPendingOwners);
router.put('/owners/:id/verify', verifyOwner);
router.get('/reports', getAllReports);
router.put('/reports/:id/resolve', resolveReport);

// User Management Routes
router.get('/users', getUsers);
router.get('/users/stats', getUserStats);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/activate', activateUser);
router.put('/users/:id/approve', approveUser);
router.delete('/users/:id', deleteUser);

// Analytics & Audit Routes
router.get('/analytics/reports', getReportAnalytics);
router.get('/analytics/geo-risk', getGeoRiskData);
router.get('/analytics/users-by-location', getUsersByLocation);
router.get('/analytics/listings-by-location', getListingsByLocation);
router.get('/analytics/geographic-insights', getGeographicInsights);
router.get('/analytics/behavior', getBehaviorAnalytics);
router.get('/analytics/financial', getFinancialAnalytics);
router.get('/analytics/conversion', getConversionAnalytics);

// Advanced Analytics Routes (NEW - Unified System)
router.get('/analytics/unified', getUnifiedAnalytics);
router.get('/analytics/time-series', getTimeSeriesAnalytics);
router.get('/analytics/comparison', getComparisonAnalytics);
router.get('/analytics/platform-overview', getPlatformOverview);
router.get('/analytics/geo-detailed', getGeoDetailedAnalytics);

router.get('/audit-logs', getAuditLogs);

export default router;
