'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Profile Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    defaultValue="John Doe"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    defaultValue="john.doe@example.com"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    defaultValue="sales_manager"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="sales_manager">Sales Manager</option>
                    <option value="sales_representative">Sales Representative</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'light', name: 'Light', description: 'Clean and bright interface' },
                      { id: 'dark', name: 'Dark', description: 'Easy on the eyes in low light' },
                      { id: 'auto', name: 'Auto', description: 'Follows system preference' },
                    ].map((option) => (
                      <label key={option.id} className="flex items-center">
                        <input
                          type="radio"
                          name="theme"
                          value={option.id}
                          checked={theme === option.id}
                          onChange={(e) => setTheme(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{option.name}</p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-4">
                {[
                  { id: 'email', name: 'Email Notifications', description: 'Receive updates via email' },
                  { id: 'push', name: 'Push Notifications', description: 'Get real-time alerts in your browser' },
                  { id: 'sms', name: 'SMS Notifications', description: 'Receive text messages for urgent updates' },
                ].map((notification) => (
                  <div key={notification.id} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={notification.id}
                        name={notification.id}
                        type="checkbox"
                        checked={notifications[notification.id as keyof typeof notifications]}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            [notification.id]: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={notification.id} className="font-medium text-gray-900">
                        {notification.name}
                      </label>
                      <p className="text-gray-500">{notification.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dashboard Customization */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dashboard Customization</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="default-view" className="block text-sm font-medium text-gray-700">
                    Default Dashboard View
                  </label>
                  <select
                    id="default-view"
                    name="default-view"
                    defaultValue="overview"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="overview">Overview</option>
                    <option value="sales">Sales Focus</option>
                    <option value="content">Content Focus</option>
                    <option value="analytics">Analytics Focus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Widget Display
                  </label>
                  <div className="space-y-2">
                    {[
                      'Performance Overview',
                      'Recent Activity',
                      'Quick Actions',
                      'System Status',
                    ].map((widget) => (
                      <label key={widget} className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-900">{widget}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
