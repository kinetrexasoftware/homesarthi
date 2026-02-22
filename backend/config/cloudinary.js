import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

/**
 * Upload image to Cloudinary from a local file path
 * @param {String} filePath - path to the local file
 * @param {String} folder - cloudinary folder name
 */
const uploadOnCloudinary = async (filePath, folder = 'avatars') => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  try {
    if (!filePath) return null;

    // Upload the file to cloudinary
    const response = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "auto",
      transformation: [
        { width: 1000, height: 1000, crop: "limit" },
        { quality: "auto", fetch_format: "auto" }
      ]
    });

    // File has been uploaded successfully
    console.log("File is uploaded on cloudinary", response.url);

    // Remove the locally saved temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return response;

  } catch (error) {
    console.error('Cloudinary Upload Error:', error);

    // Remove the locally saved temporary file if upload failed
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return null;
  }
};

/**
 * Delete image from Cloudinary
 * @param {String} publicId
 */
const deleteFromCloudinary = async (publicId) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  try {
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    return null;
  }
};

export default uploadOnCloudinary;
export { deleteFromCloudinary };
