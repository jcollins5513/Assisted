'use client';

import React, { useState, useEffect } from 'react';
import { MarketingTemplate } from './TemplateSelector';
import { UploadedImage } from './ImageUploader';

export interface GeneratedContent {
  id: string;
  text: string;
  hashtags: string[];
  suggestedImage: string;
  variations: string[];
  quality: number;
  generatedAt: Date;
  template: string;
  vehicleData: Record<string, any>;
}

interface ContentGeneratorProps {
  selectedTemplate: MarketingTemplate;
  uploadedImages: UploadedImage[];
  onContentGenerated: (content: GeneratedContent) => void;
}

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  selectedTemplate,
  uploadedImages,
  onContentGenerated
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<number>(0);
  const [customPrompt, setCustomPrompt] = useState('');

  // Initialize form data based on template fields
  useEffect(() => {
    const initialData: Record<string, any> = {};
    selectedTemplate.fields.forEach(field => {
      initialData[field.name] = '';
    });
    setFormData(initialData);
  }, [selectedTemplate]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const validateForm = (): boolean => {
    const requiredFields = selectedTemplate.fields.filter(field => field.required);
    return requiredFields.every(field => formData[field.name] && formData[field.name].trim() !== '');
  };

  const generateContent = async () => {
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    setGenerating(true);

    try {
      // Simulate API call to OpenAI
      const mockGeneratedContent: GeneratedContent = {
        id: `content-${Date.now()}`,
        text: generateMockContent(selectedTemplate, formData),
        hashtags: generateHashtags(selectedTemplate, formData),
        suggestedImage: uploadedImages[0]?.preview || '',
        variations: generateVariations(selectedTemplate, formData),
        quality: Math.floor(Math.random() * 30) + 70, // 70-100
        generatedAt: new Date(),
        template: selectedTemplate.id,
        vehicleData: formData
      };

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));

      setGeneratedContent(mockGeneratedContent);
      setSelectedVariation(0);
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const generateMockContent = (template: MarketingTemplate, data: Record<string, any>): string => {
    const baseContent = template.example;
    
    // Replace placeholders with actual data
    let content = baseContent;
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\b${key}\\b`, 'gi');
      content = content.replace(placeholder, value);
    });

    // Add some variety based on template type
    switch (template.id) {
      case 'just-arrived':
        return `${content} 🚗 Don't miss out on this amazing vehicle! Call us today for more details.`;
      case 'managers-special':
        return `${content} ⏰ Limited time offer - act fast!`;
      case 'financing-offer':
        return `${content} 💳 Apply online or visit us today!`;
      case 'test-drive':
        return `${content} 📞 Schedule your test drive now!`;
      default:
        return content;
    }
  };

  const generateHashtags = (template: MarketingTemplate, data: Record<string, any>): string[] => {
    const baseHashtags = template.tags.map(tag => `#${tag.replace(/\s+/g, '')}`);
    
    // Add vehicle-specific hashtags
    if (data.vehicleMake) {
      baseHashtags.push(`#${data.vehicleMake.replace(/\s+/g, '')}`);
    }
    if (data.vehicleModel) {
      baseHashtags.push(`#${data.vehicleModel.replace(/\s+/g, '')}`);
    }
    if (data.year) {
      baseHashtags.push(`#${data.year}`);
    }

    // Add category-specific hashtags
    switch (template.category) {
      case 'inventory':
        baseHashtags.push('#NewArrival', '#CarSales');
        break;
      case 'promotions':
        baseHashtags.push('#SpecialOffer', '#DealOfTheDay');
        break;
      case 'financing':
        baseHashtags.push('#Financing', '#AutoLoan');
        break;
      case 'engagement':
        baseHashtags.push('#TestDrive', '#VisitUs');
        break;
    }

    return baseHashtags.slice(0, 8); // Limit to 8 hashtags
  };

  const generateVariations = (template: MarketingTemplate, data: Record<string, any>): string[] => {
    const baseContent = generateMockContent(template, data);
    
    return [
      baseContent,
      `${baseContent} 🔥`,
      `${baseContent} ✨`,
      `${baseContent} 🎉`,
      `${baseContent} 💯`
    ];
  };

  const handleContinue = () => {
    if (generatedContent) {
      const finalContent = {
        ...generatedContent,
        text: generatedContent.variations[selectedVariation]
      };
      onContentGenerated(finalContent);
    }
  };

  const canGenerate = validateForm() && !generating;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Content</h2>
        <p className="text-gray-600">
          Fill in the details and let AI create engaging content for your {selectedTemplate.name}
        </p>
      </div>

      {/* Template Form */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Template Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedTemplate.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {field.type === 'text' && (
                <input
                  type="text"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
              
              {field.type === 'number' && (
                <input
                  type="number"
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
              
              {field.type === 'select' && (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
              
              {field.type === 'textarea' && (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Instructions (Optional)
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Add any specific instructions for content generation..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={generateContent}
          disabled={!canGenerate}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            canGenerate
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {generating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Generating Content...
            </div>
          ) : (
            'Generate Content with AI'
          )}
        </button>
      </div>

      {/* Generated Content */}
      {generatedContent && (
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Content</h3>
            
            {/* Content Quality Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Content Quality</span>
                <span className="text-sm text-gray-600">{generatedContent.quality}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generatedContent.quality}%` }}
                ></div>
              </div>
            </div>

            {/* Content Variations */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Variation
              </label>
              <div className="space-y-2">
                {generatedContent.variations.map((variation, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedVariation === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedVariation(index)}
                  >
                    <div className="text-sm text-gray-900">{variation}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggested Hashtags
              </label>
              <div className="flex flex-wrap gap-2">
                {generatedContent.hashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {hashtag}
                  </span>
                ))}
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end">
              <button
                onClick={handleContinue}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                Continue to Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">💡 Content Generation Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Be specific with vehicle details for better results</li>
          <li>• Include pricing information when available</li>
          <li>• Add custom instructions for unique requirements</li>
          <li>• Review and edit generated content before publishing</li>
        </ul>
      </div>
    </div>
  );
};
