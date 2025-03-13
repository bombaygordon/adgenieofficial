import React, { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { useAccounts } from '../context/AccountsContext';

export default function DataSources() {
  const { platforms, connectPlatform, disconnectPlatform } = useAccounts();
  const [expandedPlatforms, setExpandedPlatforms] = useState<string[]>([]);

  const togglePlatform = (platformId: string) => {
    setExpandedPlatforms(current =>
      current.includes(platformId)
        ? current.filter(id => id !== platformId)
        : [...current, platformId]
    );
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data sources</h1>
        <p className="text-gray-500 mt-1">
          Connect and manage your ad data sources to unlock insights into your ads data.
        </p>
      </div>

      <div className="space-y-4">
        {platforms.map((platform) => (
          <div key={platform.id} className="border rounded-lg bg-white overflow-hidden">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => togglePlatform(platform.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <platform.icon size={24} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{platform.name}</h3>
                  {platform.status === 'connected' ? (
                    <p className="text-sm text-green-600">Connected</p>
                  ) : (
                    <p className="text-sm text-gray-500">Not connected</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {platform.status === 'disconnected' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      connectPlatform(platform.id);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Add account
                  </button>
                )}
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 transition-transform ${
                    expandedPlatforms.includes(platform.id) ? 'rotate-180' : ''
                  }`} 
                />
              </div>
            </div>

            {/* Expanded content */}
            {expandedPlatforms.includes(platform.id) && (
              <div className="border-t px-4 py-3 bg-gray-50">
                {platform.status === 'connected' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{platform.accountName}</p>
                        <p className="text-sm text-gray-500">
                          {platform.id === 'meta' && 'Business Manager Account'}
                          {platform.id === 'google' && 'Google Ads Account'}
                          {platform.id === 'tiktok' && 'TikTok Ads Account'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-green-600">Synced</span>
                        <button
                          onClick={() => disconnectPlatform(platform.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                    <button
                      className="w-full p-3 border border-dashed rounded-lg text-sm text-gray-500 hover:bg-white transition-colors flex items-center justify-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Add another account
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">
                    No accounts connected. Click "Add account" to get started.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 