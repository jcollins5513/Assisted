'use client';

import React, { useState } from 'react';
import { GeneratedContent } from './ContentGenerator';

interface ContentPreviewProps {
  content: GeneratedContent;
  onApprove: () => void;
  onEdit: () => void;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  onApprove,
  onEdit
}) => {
  const [editedContent, setEditedContent] = useState(content.text);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(content.hashtags);
  const [previewMode, setPreviewMode] = useState<'social' | 'email' | 'web'>('social');

  const handleContentEdit = (newContent: string) => {
    setEditedContent(newContent);
  };

  const toggleHashtag = (hashtag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(hashtag)
        ? prev.filter(h => h !== hashtag)
        : [...prev, hashtag]
    );
  };

  const addCustomHashtag = (hashtag: string) => {
    if (hashtag && !selectedHashtags.includes(hashtag)) {
      setSelectedHashtags(prev => [...prev, hashtag]);
    }
  };

  const renderSocialMediaPreview = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md mx-auto">
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          CS
        </div>
        <div className="ml-3">
          <div className="font-semibold text-gray-900">Car Sales AI</div>
          <div className="text-sm text-gray-500">Just now</div>
        </div>
      </div>
      
      {content.suggestedImage && (
        <div className="mb-3">
          <img
            src={content.suggestedImage}
            alt="Vehicle"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}
      
      <div className="text-gray-900 mb-3 whitespace-pre-wrap">
        {editedContent}
      </div>
      
      {selectedHashtags.length > 0 && (
        <div className="text-blue-600 text-sm">
          {selectedHashtags.join(' ')}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <div className="flex space-x-4 text-gray-500">
          <button className="flex items-center space-x-1">
            <span>👍</span>
            <span className="text-sm">Like</span>
          </button>
          <button className="flex items-center space-x-1">
            <span>💬</span>
            <span className="text-sm">Comment</span>
          </button>
          <button className="flex items-center space-x-1">
            <span>🔄</span>
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmailPreview = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Car Sales AI</h2>
        <p className="text-gray-600">Your trusted automotive partner</p>
      </div>
      
      <div className="prose max-w-none">
        <p className="text-lg text-gray-900 leading-relaxed">
          {editedContent}
        </p>
        
        {content.suggestedImage && (
          <div className="my-6 text-center">
            <img
              src={content.suggestedImage}
              alt="Vehicle"
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
          <p className="text-gray-700">📞 (555) 123-4567</p>
          <p className="text-gray-700">📍 123 Main Street, City, State</p>
          <p className="text-gray-700">🌐 www.carsalesai.com</p>
        </div>
      </div>
    </div>
  );

  const renderWebPreview = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-4xl mx-auto">
      <header className="bg-gray-900 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Car Sales AI</h1>
          <nav className="flex space-x-4">
            <a href="#" className="hover:text-gray-300">Home</a>
            <a href="#" className="hover:text-gray-300">Inventory</a>
            <a href="#" className="hover:text-gray-300">Services</a>
            <a href="#" className="hover:text-gray-300">Contact</a>
          </nav>
        </div>
      </header>
      
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Vehicle</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {editedContent}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedHashtags.map((hashtag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {hashtag}
                </span>
              ))}
            </div>
            
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
              Learn More
            </button>
          </div>
          
          {content.suggestedImage && (
            <div>
              <img
                src={content.suggestedImage}
                alt="Vehicle"
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview & Edit Content</h2>
        <p className="text-gray-600">
          Review your generated content and make any final adjustments before publishing
        </p>
      </div>

      {/* Preview Mode Selector */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setPreviewMode('social')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              previewMode === 'social'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📱 Social Media
          </button>
          <button
            onClick={() => setPreviewMode('email')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              previewMode === 'email'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📧 Email
          </button>
          <button
            onClick={() => setPreviewMode('web')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              previewMode === 'web'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🌐 Website
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Content Editor */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Text
            </label>
            <textarea
              value={editedContent}
              onChange={(e) => handleContentEdit(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Edit your content here..."
            />
            <div className="mt-2 text-sm text-gray-500">
              {editedContent.length} characters
            </div>
          </div>

          {/* Hashtag Management */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hashtags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {content.hashtags.map((hashtag, index) => (
                <button
                  key={index}
                  onClick={() => toggleHashtag(hashtag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedHashtags.includes(hashtag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {hashtag}
                </button>
              ))}
            </div>
            
            {/* Add Custom Hashtag */}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add custom hashtag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    addCustomHashtag(input.value);
                    input.value = '';
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Add custom hashtag..."]') as HTMLInputElement;
                  if (input) {
                    addCustomHashtag(input.value);
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                Add
              </button>
            </div>
          </div>

          {/* Content Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Content Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Quality Score:</span>
                <span className="ml-2 font-medium text-green-600">{content.quality}/100</span>
              </div>
              <div>
                <span className="text-gray-600">Character Count:</span>
                <span className="ml-2 font-medium">{editedContent.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Hashtag Count:</span>
                <span className="ml-2 font-medium">{selectedHashtags.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Generated:</span>
                <span className="ml-2 font-medium">
                  {content.generatedAt.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {previewMode === 'social' && 'Social Media Preview'}
            {previewMode === 'email' && 'Email Preview'}
            {previewMode === 'web' && 'Website Preview'}
          </h3>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {previewMode === 'social' && renderSocialMediaPreview()}
            {previewMode === 'email' && renderEmailPreview()}
            {previewMode === 'web' && renderWebPreview()}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={onEdit}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          ← Back to Edit
        </button>
        
        <div className="flex space-x-4">
          <button
            onClick={() => {
              // Save as draft functionality
              alert('Content saved as draft!');
            }}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Save as Draft
          </button>
          
          <button
            onClick={onApprove}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            Approve & Continue →
          </button>
        </div>
      </div>
    </div>
  );
};
