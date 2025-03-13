'use client';

import React, { useState } from 'react';
import SideNav from '../components/SideNav';
import { Sparkles } from 'lucide-react';
import { headlines } from '../lib/mockData';

export default function BestHeadlinesPage() {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <SideNav isOpen={isSideNavOpen} onToggle={() => setIsSideNavOpen(!isSideNavOpen)} />
      
      <div className="lg:ml-64">
        <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b">
          <h1 className="text-2xl font-bold ml-12 lg:ml-0">Best Headlines</h1>
        </div>

        <div className="p-6">
          <div className="grid gap-4">
            {headlines.map((headline) => (
              <div key={headline.id} className="bg-white rounded-lg shadow-sm p-4 border hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">"{headline.text}"</p>
                  </div>
                  <button className="ml-4 text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors flex items-center whitespace-nowrap">
                    <Sparkles size={14} className="mr-1.5" />
                    Analyze with AI
                  </button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-4 text-sm">
                    <div className="bg-gray-50 px-3 py-1.5 rounded-lg">
                      <span className="text-gray-500">CTR: </span>
                      <span className="font-medium text-green-600">{headline.ctr}%</span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                    Use Again
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 