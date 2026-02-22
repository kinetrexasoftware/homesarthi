import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import uploadOnCloudinary from '../config/cloudinary.js';

const router = express.Router();

router.post('/image', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image'
            });
        }

        const result = await uploadOnCloudinary(req.file.path, 'rooms');

        if (!result) {
            return res.status(500).json({
                success: false,
                message: 'Cloudinary upload failed'
            });
        }

        res.json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id
            }
        });

    } catch (error) {
        console.error('Upload route error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
