'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const faqItems = [
  {
    question: 'How do I start a sales training session?',
    answer: 'Navigate to the Sales Training module and click the "Start Recording" button. The system will begin analyzing your conversation in real-time and provide feedback on your sales techniques.',
  },
  {
    question: 'Can I customize the content templates?',
    answer: 'Yes! In the Content Creator module, you can select from various templates and customize them with your own text, images, and branding elements.',
  },
  {
    question: 'How does the remote background removal work?',
    answer: 'The remote execution system connects to your local machine to process images. Upload your images through the interface, and the system will automatically remove backgrounds using AI-powered tools.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. All data is encrypted in transit and at rest. We follow industry best practices for data security and privacy protection.',
  },
  {
    question: 'Can I export my sales performance data?',
    answer: 'Yes, you can export your performance metrics and conversation analysis data in various formats including PDF and CSV for further analysis.',
  },
];

const videoTutorials = [
  {
    title: 'Getting Started with Sales Training',
    duration: '5:23',
    description: 'Learn how to use the real-time conversation analysis feature.',
    thumbnail: '/api/placeholder/320/180',
  },
  {
    title: 'Creating Marketing Content',
    duration: '8:45',
    description: 'Step-by-step guide to creating engaging social media content.',
    thumbnail: '/api/placeholder/320/180',
  },
  {
    title: 'Remote Image Processing',
    duration: '6:12',
    description: 'How to set up and use the background removal feature.',
    thumbnail: '/api/placeholder/320/180',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics' },
    { id: 'sales', name: 'Sales Training' },
    { id: 'content', name: 'Content Creation' },
    { id: 'remote', name: 'Remote Execution' },
    { id: 'settings', name: 'Settings & Configuration' },
  ];

  const filteredFaq = faqItems.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Find answers to your questions and learn how to use the Car Sales AI Assistant.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="max-w-2xl">
            <label htmlFor="search" className="sr-only">
              Search help articles
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search for help articles..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {filteredFaq.map((item, index) => (
                <details key={index} className="group">
                  <summary className="flex justify-between items-center cursor-pointer list-none">
                    <h3 className="text-sm font-medium text-gray-900 group-open:text-blue-600">
                      {item.question}
                    </h3>
                    <span className="ml-6 flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400 group-open:text-blue-600 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-3 text-sm text-gray-600">
                    <p>{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Video Tutorials */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Video Tutorials</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videoTutorials.map((tutorial, index) => (
                <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    <div className="flex items-center justify-center h-32">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900">{tutorial.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">{tutorial.duration}</p>
                    <p className="mt-2 text-sm text-gray-600">{tutorial.description}</p>
                    <button className="mt-3 text-sm text-blue-600 hover:text-blue-500 font-medium">
                      Watch Video →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Still Need Help?</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Contact Support</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Contact Support
                </button>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Send Feedback</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Help us improve by sharing your thoughts and suggestions.
                </p>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Send Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
