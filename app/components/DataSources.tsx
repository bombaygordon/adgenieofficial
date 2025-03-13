import React from 'react';
import { Facebook, ArrowRight } from 'lucide-react';
import { useAccounts, type Platform } from '../context/AccountsContext';
import { getMetaAuthUrl } from '../lib/meta';
import Image from 'next/image';

const availablePlatforms: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook Ads',
    description: 'Connect your Facebook Ads account to analyze ad performance',
    icon: Facebook,
    status: 'disconnected',
    accountId: '',
    accountName: ''
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'Connect your TikTok Ads account to track campaign metrics',
    icon: () => (
      <Image
        src="/tiktok-icon.svg"
        alt="TikTok"
        width={24}
        height={24}
        className="text-gray-600"
      />
    ),
    status: 'disconnected',
    accountId: '',
    accountName: ''
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Connect your Google Ads account to monitor ad spend and ROI',
    icon: () => (
      <Image
        src="/google-ads-icon.svg"
        alt="Google Ads"
        width={24}
        height={24}
        className="text-gray-600"
      />
    ),
    status: 'disconnected',
    accountId: '',
    accountName: ''
  }
];

export default function DataSources() {
  const { platforms, connectPlatform } = useAccounts();
  const connectedPlatformIds = platforms.map(p => p.id);

  const handleConnect = (platform: Platform) => {
    switch (platform.id) {
      case 'facebook':
        window.location.href = getMetaAuthUrl();
        break;
      case 'tiktok':
        // TODO: Implement TikTok OAuth flow
        console.log('TikTok connection not implemented yet');
        break;
      case 'google':
        // TODO: Implement Google OAuth flow
        console.log('Google Ads connection not implemented yet');
        break;
      default:
        connectPlatform(platform);
    }
  };

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
                    handleConnect(platform);
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