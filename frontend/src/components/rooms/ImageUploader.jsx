import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ImageUploader = ({ images, onImagesChange, onUpload, onRemove, loading, maxImages = 10 }) => {
  const [previews, setPreviews] = useState(images || []);

  // Update previews if images prop changes (useful for initial data load)
  useEffect(() => {
    if (images && images.length > 0) {
      setPreviews(images);
    }
  }, [images]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (previews.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder5MB = file.size <= 5 * 1024 * 1024;

      if (!isImage) toast.error(`${file.name} is not an image`);
      if (!isUnder5MB) toast.error(`${file.name} is larger than 5MB`);

      return isImage && isUnder5MB;
    });

    const newPreviews = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    const updated = [...previews, ...newPreviews];
    setPreviews(updated);

    if (onUpload) {
      onUpload(validFiles);
    } else if (onImagesChange) {
      onImagesChange(updated);
    }
  };

  const handleRemove = (index) => {
    const updated = previews.filter((_, idx) => idx !== index);
    setPreviews(updated);

    if (onRemove) {
      onRemove(index);
    } else if (onImagesChange) {
      onImagesChange(updated);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Property Images ({previews.length}/{maxImages})
      </label>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {previews.map((item, idx) => (
          <div key={idx} className="relative group">
            <img
              src={item.preview || item.url}
              alt={`Preview ${idx + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {previews.length < maxImages && (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            <Upload className="text-gray-400 mb-2" size={32} />
            <span className="text-sm text-gray-500">Upload Image</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      <p className="text-sm text-gray-500">
        <ImageIcon size={16} className="inline mr-1" />
        Max {maxImages} images, 5MB each. Supported: JPG, PNG, GIF
      </p>
    </div>
  );
};

export default ImageUploader;
