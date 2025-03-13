import React from 'react';
import { Facebook, Instagram, Youtube, ArrowRight } from 'lucide-react';
import { useAccounts, type Platform } from '../context/AccountsContext';

const availablePlatforms: Platform[] = [
  {
    id: 'facebook1',
    name: 'Facebook',
    description: 'Connect your Facebook Ads account',
    icon: Facebook,
    status: 'disconnected',
    accountId: '',
    accountName: 'Facebook Ads Account'
  },
  {
    id: 'instagram1',
    name: 'Instagram',
    description: 'Connect your Instagram Business account',
    icon: Instagram,
    status: 'disconnected',
    accountId: '',
    accountName: 'Instagram Business Account'
  },
  {
    id: 'youtube1',
    name: 'YouTube',
    description: 'Connect your YouTube channel',
    icon: Youtube,
    status: 'disconnected',
    accountId: '',
    accountName: 'YouTube Channel'
  }
];

export default function DataSources() {
  const { platforms, connectPlatform } = useAccounts();
  const connectedPlatformIds = platforms.map(p => p.id);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Connect Data Sources</h1>
      <div className="grid gap-6">
        {availablePlatforms.map((platform) => {
          const isConnected = connectedPlatformIds.includes(platform.id);
          
          return (
            <div
              key={platform.id}
              className="bg-white rounded-lg border p-6 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <platform.icon size={24} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{platform.name}</h3>
                  <p className="text-sm text-gray-500">{platform.description}</p>
                </div>
              </div>
              
              {!isConnected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    connectPlatform(platform);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  Connect
                  <ArrowRight size={16} className="ml-2" />
                </button>
              )}
              
              {isConnected && (
                <div className="flex items-center">
                  <span className="text-sm text-green-600 font-medium mr-2">Connected</span>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 