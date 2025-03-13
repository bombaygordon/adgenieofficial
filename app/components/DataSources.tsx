'use client';

import React, { useState, useEffect } from 'react';
import { Facebook, ChevronDown, ArrowRight, Check } from 'lucide-react';
import { useAccounts, type Platform } from '../context/AccountsContext';
import { getMetaAuthUrl } from '../lib/meta';
import { getMetaUserAccounts } from '../lib/meta';
import Image from 'next/image';

interface AdAccount {
  account_id: string;
  name: string;
  currency: string;
  timezone_name: string;
}

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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const { platforms, connectPlatform, updatePlatformToken } = useAccounts();
  const connectedPlatformIds = platforms.map(p => p.id);

  // Load Meta ad accounts when component mounts
  useEffect(() => {
    const loadMetaAccounts = async () => {
      const metaPlatform = platforms.find(p => p.id === 'facebook');
      if (!metaPlatform?.accessToken) return;

      try {
        const accounts = await getMetaUserAccounts(metaPlatform.accessToken);
        setAdAccounts(accounts.data || []);
      } catch (error) {
        console.error('Error loading Meta accounts:', error);
      }
    };

    loadMetaAccounts();
  }, [platforms]);

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

  const handleAccountSelect = (platform: Platform, account: AdAccount) => {
    if (!platform.accessToken) return;
    
    updatePlatformToken(
      platform.id,
      platform.accessToken,
      account.account_id,
      account.name
    );
    setSelectedPlatform(platform);
    setIsOpen(false);
  };

  const getButtonText = () => {
    if (selectedPlatform) {
      return selectedPlatform.accountName || 'Select Account';
    }
    return 'Connect Data Sources';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border rounded-lg px-4 py-2 flex items-center space-x-2 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium">{getButtonText()}</span>
        <ChevronDown size={16} className={`text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-20">
            <div className="p-4">
              {availablePlatforms.map((platform) => {
                const connectedPlatform = platforms.find(p => p.id === platform.id);
                const isConnected = connectedPlatformIds.includes(platform.id);
                
                return (
                  <div key={platform.id}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          {typeof platform.icon === 'function' ? (
                            <platform.icon />
                          ) : (
                            <Image
                              src={platform.icon}
                              alt={platform.name}
                              width={20}
                              height={20}
                              className="text-gray-600"
                            />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{platform.name}</h3>
                          <p className="text-xs text-gray-500">{platform.description}</p>
                        </div>
                      </div>
                      {!isConnected ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnect(platform);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                          Connect
                          <ArrowRight size={12} className="ml-1" />
                        </button>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-xs text-green-600 font-medium mr-2">Connected</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </div>
                      )}
                    </div>

                    {/* Show ad accounts for connected platforms */}
                    {isConnected && platform.id === 'facebook' && (
                      <div className="ml-11 border-l border-gray-200 pl-4 mb-3">
                        {adAccounts.map((account) => (
                          <button
                            key={account.account_id}
                            onClick={() => handleAccountSelect(connectedPlatform!, account)}
                            className="w-full text-left py-2 px-3 hover:bg-gray-50 rounded-md flex items-center justify-between group"
                          >
                            <div>
                              <div className="text-sm font-medium text-gray-900">{account.name}</div>
                              <div className="text-xs text-gray-500">ID: {account.account_id}</div>
                            </div>
                            {connectedPlatform?.accountId === account.account_id && (
                              <Check size={16} className="text-green-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 