import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress image using expo-image-manipulator
 * @param {string} uri - The local URI of the image to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Object>} - Resolves with the manipulated image result
 */
export const compressImage = async (uri, { maxWidth = 1200, maxHeight = 1200, quality = 0.7 } = {}) => {
    try {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: maxWidth } }], // Simplification: Resize by width
            { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );
        return result;
    } catch (error) {
        console.error('Image compression error:', error);
        throw error;
    }
};
