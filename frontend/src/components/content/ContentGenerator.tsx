'use client';

import React, { useState, useEffect } from 'react';
import { MarketingTemplate, GeneratedContent } from './TemplateSelector';
import { ImageUploader } from './ImageUploader';
import { ContentPreview } from './ContentPreview';
import { SocialMediaPublisher } from './SocialMediaPublisher';
import { contentAPI } from '@/services/api';

interface ContentGeneratorProps {
  selectedTemplate: MarketingTemplate;
  onContentGenerated?: (content: GeneratedContent) => void;
}

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  selectedTemplate,
  onContentGenerated,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data with template fields
  useEffect(() => {
    const initialData: Record<string, any> = {};
    selectedTemplate.fields.forEach(field => {
      initialData[field.name] = '';
    });
    setFormData(initialData);
    setErrors({});
  }, [selectedTemplate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    selectedTemplate.fields.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name].toString().trim() === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  };

  const generateContent = async () => {
    if (!validateForm()) {
      return;
    }

    setGenerating(true);

    try {
      // Call real API to generate content
      const response = await contentAPI.generateContent({
        templateId: selectedTemplate.id,
        formData,
        instructions: customInstructions,
      });

      if (response.data) {
        setGeneratedContent(response.data);
        setSelectedVariation(0);
        onContentGenerated?.(response.data);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = (files: File[]) => {
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const handleImageRemove = (index: number) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSaveContent = async () => {
    if (!generatedContent) return;

    try {
      await contentAPI.saveContent({
        templateId: selectedTemplate.id,
        generatedContent,
        formData,
      });
      
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Fields */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Fill in the Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedTemplate.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className={`w-full rounded-md border ${
                    errors[field.name] ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 focus:border-blue-500 focus:ring-blue-500`}
                />
              ) : field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={`w-full rounded-md border ${
                    errors[field.name] ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 focus:border-blue-500 focus:ring-blue-500`}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full rounded-md border ${
                    errors[field.name] ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 focus:border-blue-500 focus:ring-blue-500`}
                />
              )}
              
              {errors[field.name] && (
                <p className="text-sm text-red-600">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Custom Instructions */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Instructions (Optional)
          </label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Add any specific instructions for content generation..."
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={generateContent}
            disabled={generating}
            className="btn btn-primary w-full py-3"
          >
            {generating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating Content...
              </div>
            ) : (
              'Generate Content'
            )}
          </button>
        </div>
      </div>

      {/* Image Upload */}
      <ImageUploader
        onImagesUploaded={handleImageUpload}
        onImageRemove={handleImageRemove}
        uploadedImages={uploadedImages}
      />

      {/* Generated Content Preview */}
      {generatedContent && (
        <ContentPreview
          content={generatedContent}
          selectedVariation={selectedVariation}
          onVariationChange={setSelectedVariation}
          onSave={handleSaveContent}
        />
      )}

      {/* Social Media Publishing */}
      {generatedContent && (
        <SocialMediaPublisher
          content={generatedContent}
          onPublished={() => {
            alert('Content published successfully!');
          }}
        />
      )}
    </div>
  );
};
