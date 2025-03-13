'use client';

import React from 'react';
import SideNav from '../components/SideNav';
import { useState } from 'react';
import { Bell, Users, CreditCard, HelpCircle, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const router = useRouter();

  const settingsSections = [
    {
      title: 'Data Sources',
      icon: Database,
      description: 'Connect and manage your ad platform accounts',
      path: '/settings/data-sources'
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Choose what updates you want to hear about',
      path: '/settings/notifications'
    },
    {
      title: 'Team Members',
      icon: Users,
      description: 'Manage your team and access permissions',
      path: '/settings/team'
    },
    {
      title: 'Billing',
      icon: CreditCard,
      description: 'Manage your subscription and billing details',
      path: '/settings/billing'
    },
    {
      title: 'Help & Support',
      icon: HelpCircle,
      description: 'Get help with using AdGenie',
      path: '/settings/help'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SideNav isOpen={isSideNavOpen} onToggle={() => setIsSideNavOpen(!isSideNavOpen)} />
      
      <div className="lg:ml-64">
        <div className="bg-white p-4 shadow-sm flex justify-between items-center border-b">
          <h1 className="text-2xl font-bold ml-12 lg:ml-0">Settings</h1>
        </div>

        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              return (
                <div 
                  key={section.title}
                  onClick={() => router.push(section.path)}
                  className="bg-white rounded-lg shadow-sm p-6 border hover:border-blue-200 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Icon className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{section.title}</h3>
                      <p className="text-sm text-gray-500">{section.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 