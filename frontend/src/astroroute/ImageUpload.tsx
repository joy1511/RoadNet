/**
 * ImageUpload Component
 * Drag-and-drop image upload for satellite imagery
 */

import React, { useCallback, useState } from 'react';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(file.type)) {
      return 'Please upload a PNG, JPG, or TIFF image';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }

    return null;
  }, []);

  // Handle file selection
  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  // Handle drag events
  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        if (e.type === 'dragenter' || e.type === 'dragover') {
          setDragActive(true);
        } else if (e.type === 'dragleave') {
          setDragActive(false);
        }
      }
    },
    [disabled]
  );

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  // Handle file input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const files = e.target.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/tiff"
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Text */}
          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Drop image here' : 'Upload Satellite Image'}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Drag and drop or click to browse
            </p>
          </div>

          {/* Supported formats */}
          <div className="text-xs text-gray-500">
            <p>Supported: PNG, JPG, TIFF</p>
            <p>Max size: 50MB</p>
          </div>

          {/* Browse button */}
          {!dragActive && (
            <button
              type="button"
              disabled={disabled}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              Browse Files
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h4 className="text-sm font-semibold mb-2">Tips for best results:</h4>
        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
          <li>Use high-resolution satellite imagery (minimum 1024x1024px)</li>
          <li>Ensure clear visibility of roads (minimal cloud cover)</li>
          <li>RGB or multispectral images work best</li>
          <li>Georeferenced images (with coordinate metadata) are ideal</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUpload;
