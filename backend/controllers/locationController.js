import Location from "../models/Location.js";
import { validationResult } from "express-validator";

export const saveLocation = async (req, res, next) => {
    try {
        // 1. Validation error handling
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { placeId, formattedAddress, latitude, longitude, name, types } = req.body;

        // 2. Check if location already exists
        let location = await Location.findOne({ placeId });

        if (location) {
            // If it exists, we can return it (or update it if needed, but place data rarely changes fast)
            return res.status(200).json({
                success: true,
                message: "Location already saved",
                data: location,
            });
        }

        // 3. Create new location
        location = await Location.create({
            placeId,
            formattedAddress,
            latitude,
            longitude,
            name,
            types,
        });

        res.status(201).json({
            success: true,
            message: "Location saved successfully",
            data: location,
        });
    } catch (error) {
        next(error);
    }
};
