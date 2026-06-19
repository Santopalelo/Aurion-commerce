import { useRef, useState } from 'react';
import { Upload, X, ImageIcon, Star, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

/**
 * Multi-Image Uploader
 *
 * Handles:
 * - Existing images (already on Cloudinary) — with delete
 * - New images (local files waiting to upload) — with preview + remove
 * - Drag & drop
 * - Multi-file selection
 * - Validation (size, type, count)
 */
const ImageUploader = ({
  existingImages = [],   // [{ url, publicId, isPrimary, ... }]
  newImages = [],        // [File, File, ...]
  onNewImagesChange,     // (files) => void
  onExistingDelete,      // (publicId) => void
  maxImages = 10,
  maxSizeMB = 5,
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalCount = existingImages.length + newImages.length;
  const canAddMore = totalCount < maxImages;

  // ============================================
  // FILE HANDLING
  // ============================================
  const handleFiles = (files) => {
    const fileArray = Array.from(files);

    if (totalCount + fileArray.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const validFiles = [];
    fileArray.forEach((file) => {
      // Check type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return;
      }

      // Check size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${file.name} is larger than ${maxSizeMB}MB`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      onNewImagesChange([...newImages, ...validFiles]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files?.length > 0) {
      handleFiles(e.target.files);
      e.target.value = ''; // Reset so same file can be selected again
    }
  };

  // ============================================
  // DRAG & DROP
  // ============================================
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // ============================================
  // REMOVE NEW IMAGE (not yet uploaded)
  // ============================================
  const removeNewImage = (index) => {
    onNewImagesChange(newImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {(existingImages.length > 0 || newImages.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Existing images */}
          {existingImages.map((img, index) => (
            <div
              key={img.publicId || index}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group"
            >
              <img
                src={img.url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Main
                </div>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={() => onExistingDelete(img.publicId)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* New images (pending upload) */}
          {newImages.map((file, index) => (
            <div
              key={`new-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary-300 border-dashed bg-primary-50 group"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`New ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* "New" badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded">
                New
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeNewImage(index)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            'w-full rounded-lg border-2 border-dashed p-8 cursor-pointer transition-all text-center',
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-primary-400'
          )}
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-dark">
              {isDragging ? 'Drop images here' : 'Click to upload or drag images here'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WebP up to {maxSizeMB}MB ({totalCount}/{maxImages} images)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;