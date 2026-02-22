import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    placeId: {
      type: String,
      required: true,
      unique: true,
    },
    formattedAddress: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    name: {
      type: String, // Store name of the place (e.g., "Harvard University")
    },
    types: {
      type: [String], // Store types like ['university', 'point_of_interest']
    },
  },
  { timestamps: true }
);

// GeoJSON index for geospatial queries (finding things "near" this location)
locationSchema.index({ latitude: 1, longitude: 1 });

const Location = mongoose.model("Location", locationSchema);

export default Location;
