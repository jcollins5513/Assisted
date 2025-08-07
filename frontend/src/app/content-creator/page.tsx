'use client';

import React, { useState } from 'react';
import { TemplateSelector } from '@/components/content/TemplateSelector';
import { ImageUploader } from '@/components/content/ImageUploader';
import { ContentGenerator } from '@/components/content/ContentGenerator';
import { ContentPreview } from '@/components/content/ContentPreview';
import { SocialMediaPublisher } from '@/components/content/SocialMediaPublisher';

export default function ContentCreatorPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'template' | 'images' | 'generate' | 'preview' | 'publish'>('template');

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setCurrentStep('images');
  };

  const handleImagesUploaded = (images: any[]) => {
    setUploadedImages(images);
    setCurrentStep('generate');
  };

  const handleContentGenerated = (content: any) => {
    setGeneratedContent(content);
    setCurrentStep('preview');
  };

  const handleContentApproved = () => {
    setCurrentStep('publish');
  };

  const resetWorkflow = () => {
    setSelectedTemplate(null);
    setUploadedImages([]);
    setGeneratedContent(null);
    setCurrentStep('template');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Content Creator
              </h1>
              <p className="text-sm text-gray-600">
                Create engaging marketing content with AI assistance
              </p>
            </div>
            <button
              onClick={resetWorkflow}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            {[
              { key: 'template', label: 'Choose Template', icon: '📋' },
              { key: 'images', label: 'Upload Images', icon: '🖼️' },
              { key: 'generate', label: 'Generate Content', icon: '🤖' },
              { key: 'preview', label: 'Preview & Edit', icon: '👁️' },
              { key: 'publish', label: 'Publish', icon: '📤' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep === step.key 
                    ? 'bg-blue-500 text-white' 
                    : index < ['template', 'images', 'generate', 'preview', 'publish'].indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.icon}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === step.key ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < 4 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    index < ['template', 'images', 'generate', 'preview', 'publish'].indexOf(currentStep)
                      ? 'bg-green-500' 
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Workflow Steps */}
          <div className="lg:col-span-2">
            {currentStep === 'template' && (
              <TemplateSelector onTemplateSelect={handleTemplateSelect} />
            )}
            
            {currentStep === 'images' && (
              <ImageUploader 
                onImagesUploaded={handleImagesUploaded}
                selectedTemplate={selectedTemplate}
              />
            )}
            
            {currentStep === 'generate' && (
              <ContentGenerator
                selectedTemplate={selectedTemplate}
                uploadedImages={uploadedImages}
                onContentGenerated={handleContentGenerated}
              />
            )}
            
            {currentStep === 'preview' && (
              <ContentPreview
                content={generatedContent}
                onApprove={handleContentApproved}
                onEdit={() => setCurrentStep('generate')}
              />
            )}
            
            {currentStep === 'publish' && (
              <SocialMediaPublisher
                content={generatedContent}
                onPublished={() => {
                  alert('Content published successfully!');
                  resetWorkflow();
                }}
              />
            )}
          </div>

          {/* Right Panel - Context Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Workflow Context
              </h3>
              
              {selectedTemplate && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Selected Template</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-medium text-blue-900">{selectedTemplate.name}</div>
                    <div className="text-sm text-blue-700">{selectedTemplate.description}</div>
                  </div>
                </div>
              )}
              
              {uploadedImages.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Uploaded Images</h4>
                  <div className="space-y-2">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <img 
                          src={image.preview} 
                          alt={image.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <span className="text-sm text-gray-600 truncate">{image.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {generatedContent && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Generated Content</h4>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-800 line-clamp-3">
                      {generatedContent.text}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                <p>• Follow the workflow steps to create engaging content</p>
                <p>• Use AI assistance for optimal results</p>
                <p>• Preview before publishing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
