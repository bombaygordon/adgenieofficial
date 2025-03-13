'use client';

import React, { useState } from 'react';
import SideNav from '../components/SideNav';
import { ChevronRight, Sparkles } from 'lucide-react';
import { topAds } from '../lib/mockData';

export default function TopAdsPage() {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <SideNav isOpen={isSideNavOpen} onToggle={() => setIsSideNavOpen(!isSideNavOpen)} />
      
      <div className="lg:ml-64">
        <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b">
          <h1 className="text-2xl font-bold ml-12 lg:ml-0">Top Performing Ads</h1>
        </div>

        <div className="p-6">
          <div className="grid gap-4">
            {topAds.map((ad) => (
              <div key={ad.id} className="bg-white rounded-lg shadow-sm p-4 border hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{ad.name}</h3>
                    <p className="text-sm text-gray-500">{ad.platform}</p>
                  </div>
                  <button className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors flex items-center">
                    <Sparkles size={14} className="mr-1.5" />
                    Analyze with AI
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500">CTR</p>
                    <p className="font-medium text-gray-900">{ad.ctr}%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500">Conversions</p>
                    <p className="font-medium text-gray-900">{ad.conversions}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500">ROI</p>
                    <p className="font-medium text-green-600">{ad.roi}%</p>
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