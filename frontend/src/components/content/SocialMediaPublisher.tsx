'use client';

import React, { useState } from 'react';
import { GeneratedContent } from './ContentGenerator';

interface SocialMediaPublisherProps {
  content: GeneratedContent;
  onPublished: () => void;
}

export interface SocialMediaAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  name: string;
  username: string;
  avatar: string;
  connected: boolean;
  followers: number;
}

export interface PublishingSchedule {
  id: string;
  platform: string;
  scheduledTime: Date;
  status: 'scheduled' | 'published' | 'failed';
  content: string;
}

export const SocialMediaPublisher: React.FC<SocialMediaPublisherProps> = ({
  content,
  onPublished
}) => {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [publishingMode, setPublishingMode] = useState<'now' | 'schedule'>('now');
  const [scheduledTime, setScheduledTime] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);

  // Mock social media accounts
  const socialAccounts: SocialMediaAccount[] = [
    {
      id: 'fb-1',
      platform: 'facebook',
      name: 'Car Sales AI',
      username: 'carsalesai',
      avatar: 'https://via.placeholder.com/40',
      connected: true,
      followers: 1250
    },
    {
      id: 'fb-2',
      platform: 'facebook',
      name: 'Dealership Page',
      username: 'dealershippage',
      avatar: 'https://via.placeholder.com/40',
      connected: true,
      followers: 890
    },
    {
      id: 'ig-1',
      platform: 'instagram',
      name: 'Car Sales AI',
      username: '@carsalesai',
      avatar: 'https://via.placeholder.com/40',
      connected: false,
      followers: 0
    },
    {
      id: 'tw-1',
      platform: 'twitter',
      name: 'Car Sales AI',
      username: '@carsalesai',
      avatar: 'https://via.placeholder.com/40',
      connected: false,
      followers: 0
    }
  ];

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handlePublish = async () => {
    if (selectedAccounts.length === 0) {
      alert('Please select at least one social media account');
      return;
    }

    setPublishing(true);

    try {
      // Simulate publishing process
      const publishPromises = selectedAccounts.map(async (accountId) => {
        const account = socialAccounts.find(acc => acc.id === accountId);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          id: `post-${Date.now()}-${accountId}`,
          accountId,
          platform: account?.platform,
          accountName: account?.name,
          content: content.text,
          publishedAt: publishingMode === 'now' ? new Date() : new Date(scheduledTime),
          status: 'published',
          postUrl: `https://${account?.platform}.com/posts/${Math.random().toString(36).substr(2, 9)}`
        };
      });

      const results = await Promise.all(publishPromises);
      setPublishedPosts(results);
      
      // Show success message
      setTimeout(() => {
        onPublished();
      }, 2000);

    } catch (error) {
      console.error('Error publishing content:', error);
      alert('Failed to publish content. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return '📘';
      case 'instagram': return '📷';
      case 'twitter': return '🐦';
      case 'linkedin': return '💼';
      default: return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'bg-blue-600';
      case 'instagram': return 'bg-pink-600';
      case 'twitter': return 'bg-blue-400';
      case 'linkedin': return 'bg-blue-700';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Publish to Social Media</h2>
        <p className="text-gray-600">
          Share your content across your social media platforms
        </p>
      </div>

      {/* Content Preview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Content to Publish</h3>
        <div className="text-gray-700 whitespace-pre-wrap">{content.text}</div>
        {content.hashtags.length > 0 && (
          <div className="mt-2 text-blue-600 text-sm">
            {content.hashtags.join(' ')}
          </div>
        )}
      </div>

      {/* Publishing Mode */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Publishing Mode</h3>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="now"
              checked={publishingMode === 'now'}
              onChange={(e) => setPublishingMode(e.target.value as 'now' | 'schedule')}
              className="mr-2"
            />
            <span className="text-gray-700">Publish Now</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="schedule"
              checked={publishingMode === 'schedule'}
              onChange={(e) => setPublishingMode(e.target.value as 'now' | 'schedule')}
              className="mr-2"
            />
            <span className="text-gray-700">Schedule for Later</span>
          </label>
        </div>

        {publishingMode === 'schedule' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Time
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Social Media Accounts */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Select Accounts</h3>
        <div className="space-y-3">
          {socialAccounts.map((account) => (
            <div
              key={account.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedAccounts.includes(account.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${!account.connected ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => account.connected && handleAccountToggle(account.id)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg ${getPlatformColor(account.platform)}`}>
                {getPlatformIcon(account.platform)}
              </div>
              
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{account.name}</div>
                    <div className="text-sm text-gray-500">@{account.username}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{account.followers.toLocaleString()} followers</div>
                    {!account.connected && (
                      <div className="text-xs text-red-600">Not connected</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="ml-3">
                <input
                  type="checkbox"
                  checked={selectedAccounts.includes(account.id)}
                  onChange={() => account.connected && handleAccountToggle(account.id)}
                  disabled={!account.connected}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Publishing Progress */}
      {publishing && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-blue-700">
              Publishing to {selectedAccounts.length} account{selectedAccounts.length > 1 ? 's' : ''}...
            </span>
          </div>
        </div>
      )}

      {/* Published Posts */}
      {publishedPosts.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Published Posts</h3>
          <div className="space-y-3">
            {publishedPosts.map((post) => (
              <div key={post.id} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                  ✓
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-medium text-green-900">{post.accountName}</div>
                  <div className="text-sm text-green-700">
                    Published at {post.publishedAt.toLocaleTimeString()}
                  </div>
                </div>
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Post →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publishing Tips */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">💡 Publishing Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Best times to post: 9 AM - 3 PM on weekdays</li>
          <li>• Include relevant hashtags for better reach</li>
          <li>• Engage with comments to boost visibility</li>
          <li>• Use high-quality images for better engagement</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
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
          onClick={handlePublish}
          disabled={publishing || selectedAccounts.length === 0}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            publishing || selectedAccounts.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {publishing ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Publishing...
            </div>
          ) : (
            `Publish to ${selectedAccounts.length} Account${selectedAccounts.length !== 1 ? 's' : ''}`
          )}
        </button>
      </div>

      {/* Analytics Preview */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📊 Expected Performance</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {Math.floor(Math.random() * 500) + 100}
            </div>
            <div className="text-blue-700">Reach</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {Math.floor(Math.random() * 50) + 10}
            </div>
            <div className="text-blue-700">Engagement</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {Math.floor(Math.random() * 20) + 5}%
            </div>
            <div className="text-blue-700">CTR</div>
          </div>
        </div>
      </div>
    </div>
  );
};
