'use client';

import React, { useState } from 'react';
import SideNav from '../components/SideNav';
import { Sparkles, ExternalLink } from 'lucide-react';
import { landingPages } from '../lib/mockData';

export default function BestLandingPagesPage() {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <SideNav isOpen={isSideNavOpen} onToggle={() => setIsSideNavOpen(!isSideNavOpen)} />
      
      <div className="lg:ml-64">
        <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b">
          <h1 className="text-2xl font-bold ml-12 lg:ml-0">Best Landing Pages</h1>
        </div>

        <div className="p-6">
          <div className="grid gap-4">
            {landingPages.map((page) => (
              <div key={page.id} className="bg-white rounded-lg shadow-sm p-4 border hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="font-medium text-gray-900">{page.url}</p>
                      <ExternalLink size={14} className="ml-1 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {page.visitors.toLocaleString()} visitors
                    </p>
                  </div>
                  <button className="ml-4 text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors flex items-center whitespace-nowrap">
                    <Sparkles size={14} className="mr-1.5" />
                    Analyze with AI
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                    <p className="font-medium text-green-600">{page.convRate}%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Avg. Time on Page</p>
                    <p className="font-medium text-gray-900">2:45</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Bounce Rate</p>
                    <p className="font-medium text-gray-900">32%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 