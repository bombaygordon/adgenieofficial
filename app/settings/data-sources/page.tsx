'use client';

import React from 'react';
import SideNav from '../../components/SideNav';
import DataSources from '../../components/DataSources';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DataSourcesPage() {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <SideNav isOpen={isSideNavOpen} onToggle={() => setIsSideNavOpen(!isSideNavOpen)} />
      
      <div className="lg:ml-64">
        <div className="bg-white p-4 shadow-sm flex items-center border-b">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold">Data Sources</h1>
        </div>

        <div className="p-6">
          <DataSources />
        </div>
      </div>
    </div>
  );
} 