import express from "express";
import { body } from "express-validator";
import { saveLocation } from "../controllers/locationController.js";
// Middleware to ensure user is logged in could be added here if this is a protected route
// import { protect } from "../middleware/auth.js"; 

const router = express.Router();

router.post(
    "/save",
    [
        body("placeId").notEmpty().withMessage("Place ID is required"),
        body("formattedAddress").notEmpty().withMessage("Formatted address is required"),
        body("latitude").isNumeric().withMessage("Latitude must be a number"),
        body("longitude").isNumeric().withMessage("Longitude must be a number"),
    ],
    saveLocation
);

export default router;
