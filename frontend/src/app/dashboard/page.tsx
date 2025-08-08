'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import QuickAccessCards from '@/components/dashboard/QuickAccessCards';
import DashboardWidgets from '@/components/dashboard/DashboardWidgets';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your car sales AI assistant.
          </p>
        </div>

        {/* Quick access cards */}
        <QuickAccessCards />

        {/* Dashboard widgets */}
        <DashboardWidgets />
      </div>
    </DashboardLayout>
  );
}
