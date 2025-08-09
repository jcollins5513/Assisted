'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MarketingTemplate } from './TemplateSelector';

export interface UploadedImage {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview: string;
  uploadedAt: Date;
  status: 'uploading' | 'uploaded' | 'error';
  error?: string;
}

interface ImageUploaderProps {
  onImagesUploaded: (images: UploadedImage[]) => void;
  selectedTemplate: MarketingTemplate | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImagesUploaded, 
  selectedTemplate 
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedImage[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file),
      uploadedAt: new Date(),
      status: 'uploading'
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
    setUploading(true);

    // Simulate upload process
    setTimeout(() => {
      setUploadedImages(prev => 
        prev.map(img => 
          newImages.some(newImg => newImg.id === img.id) 
            ? { ...img, status: 'uploaded' as const }
            : img
        )
      );
      setUploading(false);
    }, 2000);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const removeImage = useCallback((imageId: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleContinue = () => {
    const uploadedImagesOnly = uploadedImages.filter(img => img.status === 'uploaded');
    onImagesUploaded(uploadedImagesOnly);
  };

  const canContinue = uploadedImages.length > 0 && uploadedImages.every(img => img.status === 'uploaded');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Images</h2>
        <p className="text-gray-600">
          Upload images for your {selectedTemplate?.name.toLowerCase()} content
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Drop images here or click to browse
        </h3>
        <p className="text-gray-600 mb-4">
          Support for JPG, PNG, WebP up to 10MB each
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-primary px-6 py-3"
        >
          Choose Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-blue-700">Uploading images...</span>
          </div>
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Uploaded Images ({uploadedImages.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className="border border-gray-200 rounded-lg p-4 relative group"
              >
                {/* Image Preview */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 truncate text-sm">
                      {image.name}
                    </h4>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {formatFileSize(image.size)}
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    {image.status === 'uploading' && (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-xs text-blue-600">Uploading...</span>
                      </>
                    )}
                    {image.status === 'uploaded' && (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs text-green-600">Uploaded</span>
                      </>
                    )}
                    {image.status === 'error' && (
                      <>
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-xs text-red-600">Error</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Tips */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">💡 Tips for better results:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use high-quality images (minimum 1200x630px for social media)</li>
          <li>• Ensure good lighting and clear vehicle visibility</li>
          <li>• Include multiple angles of the vehicle</li>
          <li>• Keep file sizes under 10MB for faster processing</li>
        </ul>
      </div>

      {/* Continue Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            canContinue
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue to Content Generation
        </button>
      </div>
    </div>
  );
};
