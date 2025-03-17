'use client';

import React, { useState, useEffect } from 'react';
import { Facebook, ChevronDown, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAccounts, type Platform } from '../context/AccountsContext';
import { getMetaAuthUrl, getMetaBusinessManagers } from '../lib/meta';
import { getMetaUserAccounts } from '../lib/meta';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

interface AdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  timezone_name: string;
  business_id?: string;
  business_name?: string;
}

interface BusinessManager {
  id: string;
  name: string;
  business_id?: string;
  permitted_tasks?: string[];
  ad_accounts: {
    id: string;
    name: string;
    account_id: string;
    currency: string;
    timezone_name: string;
    business_id?: string;
    permitted_tasks?: string[];
  }[];
}

interface MetaAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  timezone_name: string;
  business_id?: string;
  business_name?: string;
  permitted_tasks?: string[];
}

interface BusinessGroup {
  id: string;
  name: string;
  accounts: Array<{
    id: string;
    account_id: string;
    name: string;
    currency: string;
    timezone_name: string;
    permitted_tasks?: string[];
  }>;
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

function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    try {
      return decodeURIComponent(cookieValue || '');
    } catch {
      return cookieValue;
    }
  }
  return undefined;
}

export default function DataSources() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const { platforms, connectPlatform, updatePlatformToken } = useAccounts();
  const searchParams = useSearchParams();
  const connectedPlatformIds = platforms.map(p => p.id);
  const [expandedManagers, setExpandedManagers] = useState(false);
  const [expandedDirect, setExpandedDirect] = useState(false);

  const loadMetaBusinessManagers = async () => {
    setIsLoadingAccounts(true);
    console.log('Loading Meta business managers...');
    
    try {
      // Log all available cookies for debugging
      console.log('All cookies:', document.cookie);
      
      // Get business managers from cookie
      const businessManagersJson = getCookie('meta_business_managers');
      console.log('Raw business managers cookie value:', businessManagersJson);

      // Get other Meta cookies for debugging
      const accessToken = getCookie('meta_access_token');
      const selectedBusinessId = getCookie('meta_selected_business_id');
      const selectedAccountId = getCookie('meta_selected_account_id');
      
      console.log('Debug cookies:', {
        accessToken: accessToken ? 'exists' : 'missing',
        selectedBusinessId,
        selectedAccountId
      });
      
      if (!businessManagersJson) {
        console.log('No business managers found in cookies');
        
        // If we have an access token but no business managers, try fetching them
        if (accessToken) {
          console.log('Access token exists, attempting to fetch business managers...');
          try {
            const managers = await getMetaBusinessManagers(accessToken);
            console.log('Fetched business managers:', managers);
            if (managers && Array.isArray(managers)) {
              console.log('Setting business managers state with:', managers);
              setBusinessManagers(managers);
              return;
            }
          } catch (fetchError) {
            console.error('Error fetching business managers:', fetchError);
          }
        }
        return;
      }

      let managers;
      try {
        managers = JSON.parse(businessManagersJson);
        console.log('Successfully parsed business managers:', managers);
      } catch (parseError) {
        console.error('Error parsing business managers JSON:', parseError);
        console.log('Invalid JSON:', businessManagersJson);
        return;
      }

      if (!Array.isArray(managers)) {
        console.error('Business managers data is not an array:', managers);
        return;
      }

      console.log('Setting business managers state with:', managers);
      setBusinessManagers(managers);

      // Get the platform from URL parameters
      const platform = searchParams.get('platform');
      const status = searchParams.get('status');
      
      // If we're coming from OAuth callback and have business managers
      if (platform === 'facebook' && status === 'connected' && managers.length > 0) {
        console.log('Setting up platform after OAuth callback');
        
        // Get selected business and account from cookies
        const selectedBusinessName = getCookie('meta_selected_business_name');
        const selectedAccountName = getCookie('meta_selected_account_name');

        if (selectedAccountId && selectedAccountName && accessToken) {
          console.log('Setting up Facebook platform with selected account');
          const facebookPlatform: Platform = {
            id: 'facebook',
            name: 'Facebook Ads',
            description: 'Connect your Facebook Ads account to analyze ad performance',
            icon: Facebook,
            status: 'connected',
            accountId: selectedAccountId,
            accountName: `${selectedBusinessName} - ${selectedAccountName}`,
            accessToken
          };
          setSelectedPlatform(facebookPlatform);
          updatePlatformToken(
            'facebook',
            accessToken,
            selectedAccountId,
            `${selectedBusinessName} - ${selectedAccountName}`
          );
        }
      }
    } catch (error) {
      console.error('Error in loadMetaBusinessManagers:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Load business managers on mount and when platforms change
  useEffect(() => {
    console.log('Platforms changed:', platforms);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    
    // Load on OAuth callback or when Facebook is connected
    if ((platform === 'facebook' && status === 'connected') || 
        platforms.some(p => p.id === 'facebook' && p.status === 'connected')) {
      console.log('Triggering business managers load');
      loadMetaBusinessManagers();
    }
  }, [searchParams, platforms]);

  // Load business managers when dropdown opens
  useEffect(() => {
    if (isOpen) {
      console.log('Dropdown opened, checking Facebook connection');
      if (platforms.some(p => p.id === 'facebook' && p.status === 'connected')) {
        console.log('Facebook is connected, loading business managers');
        loadMetaBusinessManagers();
      }
    }
  }, [isOpen]);

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

  const handleAccountSelect = (platform: Platform, account: AdAccount, businessName?: string) => {
    console.log('Selecting account:', account);
    const accessToken = getCookie('meta_access_token');
    if (!accessToken) {
      console.log('No access token available');
      return;
    }
    
    updatePlatformToken(
      platform.id,
      accessToken,
      account.account_id,
      businessName ? `${businessName} - ${account.name}` : account.name
    );
    setSelectedPlatform(platform);
    setIsOpen(false);
  };

  const getButtonText = () => {
    const facebookPlatform = platforms.find(p => p.id === 'facebook');
    if (facebookPlatform?.status === 'connected' && facebookPlatform.accountName) {
      return `Facebook Ads - ${facebookPlatform.accountName}`;
    }
    return 'Connect Data Sources';
  };

  return (
    <div className="relative inline-block text-left w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-full justify-between items-center gap-x-1.5 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 rounded-md"
      >
        <span className="truncate">{getButtonText()}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10 bg-black bg-opacity-5"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-[400px] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Available Platforms</h3>
              <p className="mt-1 text-sm text-gray-500">Connect your ad accounts to start tracking performance</p>
            </div>

            <div className="py-2">
              {availablePlatforms.map((platform) => {
                const connectedPlatform = platforms.find(p => p.id === platform.id);
                const isConnected = connectedPlatform?.status === 'connected';

                return (
                  <div key={platform.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-x-3">
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-gray-50">
                          {typeof platform.icon === 'function' ? (
                            <platform.icon className="h-6 w-6 text-gray-600" />
                          ) : (
                            <Image
                              src={platform.icon as string}
                              alt={platform.name}
                              width={24}
                              height={24}
                              className="text-gray-600"
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{platform.name}</h4>
                          <p className="text-sm text-gray-500">{platform.description}</p>
                        </div>
                      </div>

                      {!isConnected ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnect(platform);
                          }}
                          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                          Connect
                          <ArrowRight className="ml-2 -mr-0.5 h-4 w-4" aria-hidden="true" />
                        </button>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-green-600 mr-2">Connected</span>
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                        </div>
                      )}
                    </div>

                    {/* Show business managers and their ad accounts for connected platforms */}
                    {isConnected && platform.id === 'facebook' && (
                      <div className="mt-4 ml-13 border-l-2 border-gray-100 pl-6">
                        {isLoadingAccounts ? (
                          <div className="py-3 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            <span className="ml-2 text-sm text-gray-500">Loading accounts...</span>
                          </div>
                        ) : businessManagers.length === 0 ? (
                          <div className="py-3 text-sm text-gray-500 text-center">
                            No business managers found
                          </div>
                        ) : (
                          <>
                            {/* Business Managers Section */}
                            <div className="mb-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedManagers(prev => !prev);
                                }}
                                className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                              >
                                <span className="text-sm font-medium text-gray-900">Business Managers</span>
                                <ChevronDown
                                  className={`h-4 w-4 text-gray-400 transition-transform ${
                                    expandedManagers ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                              {expandedManagers && businessManagers
                                .filter(manager => manager.name !== "Direct Accounts" && manager.id !== "0")
                                .map((manager) => (
                                <div key={manager.id} className="ml-4 mb-4 last:mb-0">
                                  <div className="flex items-center mb-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2" />
                                    <span className="text-sm font-medium text-gray-900">{manager.name}</span>
                                  </div>
                                  <div className="space-y-1">
                                    {manager.ad_accounts.map((account) => (
                                      <button
                                        key={account.account_id}
                                        onClick={() => handleAccountSelect(platform, account, manager.name)}
                                        className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{account.name}</div>
                                            <div className="text-xs text-gray-500">ID: {account.account_id}</div>
                                          </div>
                                          {connectedPlatform?.accountId === account.account_id && (
                                            <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Direct Accounts Section */}
                            <div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDirect(prev => !prev);
                                  // Debug log when expanding direct accounts
                                  if (!expandedDirect) {
                                    console.log('All business managers:', businessManagers);
                                    const directAccounts = businessManagers.filter(manager => 
                                      manager.name === "Direct Accounts" || manager.id === "0"
                                    );
                                    console.log('Direct accounts found:', directAccounts);
                                  }
                                }}
                                className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                              >
                                <span className="text-sm font-medium text-gray-900">Direct Accounts</span>
                                <ChevronDown
                                  className={`h-4 w-4 text-gray-400 transition-transform ${
                                    expandedDirect ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                              {expandedDirect && (
                                <div className="ml-4 space-y-1 mt-2">
                                  {businessManagers
                                    .filter(manager => manager.name === "Direct Accounts" || manager.id === "0")
                                    .flatMap(manager => manager.ad_accounts)
                                    .map((account) => (
                                      <button
                                        key={account.account_id}
                                        onClick={() => handleAccountSelect(platform, account)}
                                        className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{account.name}</div>
                                            <div className="text-xs text-gray-500">ID: {account.account_id}</div>
                                          </div>
                                          {connectedPlatform?.accountId === account.account_id && (
                                            <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
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