'use client';

import React from 'react';
import Link from 'next/link';

const quickAccessCards = [
  {
    name: 'Sales Training',
    description: 'Real-time conversation analysis and negotiation coaching',
    href: '/sales-training',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    color: 'bg-blue-500',
    status: 'Active',
    statusColor: 'text-green-600',
    metrics: {
      sessions: '12',
      improvement: '+15%',
    },
  },
  {
    name: 'Content Creator',
    description: 'Generate marketing content and social media posts',
    href: '/content-creator',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'bg-green-500',
    status: 'Ready',
    statusColor: 'text-blue-600',
    metrics: {
      posts: '8',
      engagement: '+23%',
    },
  },
  {
    name: 'Remote Execution',
    description: 'Background removal and image processing automation',
    href: '/remote-execution',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-purple-500',
    status: 'Connected',
    statusColor: 'text-green-600',
    metrics: {
      processed: '45',
      efficiency: '+30%',
    },
  },
];

export default function QuickAccessCards() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {quickAccessCards.map((card) => (
        <Link
          key={card.name}
          href={card.href}
          className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div>
            <span className={`inline-flex p-3 rounded-lg ${card.color} text-white`}>
              {card.icon}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
              {card.name}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {card.description}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${card.statusColor} bg-gray-100`}>
              {card.status}
            </span>
            <div className="text-right">
              {card.metrics.sessions && (
                <p className="text-sm text-gray-600">
                  {card.metrics.sessions} sessions
                </p>
              )}
              {card.metrics.posts && (
                <p className="text-sm text-gray-600">
                  {card.metrics.posts} posts
                </p>
              )}
              {card.metrics.processed && (
                <p className="text-sm text-gray-600">
                  {card.metrics.processed} processed
                </p>
              )}
              <p className="text-sm font-medium text-green-600">
                {card.metrics.improvement || card.metrics.engagement || card.metrics.efficiency}
              </p>
            </div>
          </div>
          <span
            className="absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
            aria-hidden="true"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
            </svg>
          </span>
        </Link>
      ))}
    </div>
  );
}
