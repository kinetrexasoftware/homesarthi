import express from 'express';
import {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getMyRooms,
  toggleFavorite,
  reportRoom,
  getColleges,
  searchByCollege,
  getPopularCities,
  getRecommendations
} from '../controllers/roomController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', getAllRooms);
router.get('/colleges', getColleges); // New: Get list of supported colleges
router.get('/popular-cities', getPopularCities); // New: Get popular cities by listing count
router.get('/search-by-college', searchByCollege); // New: Search rooms by college ID
router.get('/recommendations', protect, getRecommendations);
router.get('/trending', getRecommendations); // Public access to trending
router.get('/my-rooms', protect, authorize('owner'), getMyRooms);
router.get('/:id', getRoomById);
router.post('/', protect, authorize('owner'), upload.fields([{ name: 'images', maxCount: 5 }, { name: 'electricBill', maxCount: 1 }, { name: 'aadhaarCard', maxCount: 1 }]), createRoom);
router.put('/:id', protect, authorize('owner', 'admin'), upload.fields([{ name: 'images', maxCount: 5 }, { name: 'electricBill', maxCount: 1 }, { name: 'aadhaarCard', maxCount: 1 }]), updateRoom);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteRoom);
router.post('/:id/favorite', protect, toggleFavorite);
router.post('/:id/report', protect, reportRoom);

export default router;
