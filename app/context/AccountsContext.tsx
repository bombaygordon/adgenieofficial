'use client';

import React, { createContext, useContext, useState, useEffect, Suspense } from 'react';
import { Facebook } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { getMetaUserAccounts } from '../lib/meta';

export interface Platform {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  accountId: string;
  accountName: string;
  icon: React.ElementType;
  description: string;
  accessToken?: string;
}

interface AccountsContextType {
  platforms: Platform[];
  connectPlatform: (platform: Platform) => void;
  disconnectPlatform: (platformId: string) => void;
  updatePlatformToken: (platformId: string, accessToken: string, accountId: string, accountName: string) => void;
  getPlatformToken: (platformId: string) => string | undefined;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

function AccountsProviderInner({ children }: { children: React.ReactNode }) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const searchParams = useSearchParams();

  // Initialize platforms from cookies and URL parameters
  useEffect(() => {
    const initializePlatforms = async () => {
      console.log('Initializing platforms...');
      const platform = searchParams.get('platform');
      const status = searchParams.get('status');

      console.log('URL params:', { platform, status });

      if (platform === 'facebook' && status === 'connected') {
        // Get cookies
        const accessToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('meta_access_token='))
          ?.split('=')[1];

        const accountId = document.cookie
          .split('; ')
          .find(row => row.startsWith('meta_account_id='))
          ?.split('=')[1];

        const accountName = document.cookie
          .split('; ')
          .find(row => row.startsWith('meta_account_name='))
          ?.split('=')[1];

        console.log('Cookie values:', { 
          hasAccessToken: !!accessToken,
          accountId,
          accountName
        });

        if (accessToken) {
          // Initialize Facebook platform
          const facebookPlatform: Platform = {
            id: 'facebook',
            name: 'Facebook Ads',
            description: 'Connect your Facebook Ads account to analyze ad performance',
            icon: Facebook,
            status: 'connected',
            accountId: accountId || '',
            accountName: accountName || '',
            accessToken
          };

          console.log('Setting up Facebook platform:', facebookPlatform);

          setPlatforms(prev => {
            // Replace existing Facebook platform or add new one
            const exists = prev.some(p => p.id === 'facebook');
            if (exists) {
              console.log('Updating existing Facebook platform');
              return prev.map(p => p.id === 'facebook' ? facebookPlatform : p);
            }
            console.log('Adding new Facebook platform');
            return [...prev, facebookPlatform];
          });
        }
      }
    };

    initializePlatforms();
  }, [searchParams]);

  const connectPlatform = (platform: Platform) => {
    console.log('Connecting platform:', platform);
    setPlatforms(prev => [...prev, { ...platform, status: 'connected' }]);
  };

  const disconnectPlatform = (platformId: string) => {
    console.log('Disconnecting platform:', platformId);
    setPlatforms(prev => prev.filter(p => p.id !== platformId));
  };

  const updatePlatformToken = (platformId: string, accessToken: string, accountId: string, accountName: string) => {
    console.log('Updating platform token:', { platformId, accountId, accountName });
    setPlatforms(prev => prev.map(p => 
      p.id === platformId 
        ? { ...p, accessToken, accountId, accountName, status: 'connected' }
        : p
    ));
  };

  const getPlatformToken = (platformId: string) => {
    const token = platforms.find(p => p.id === platformId)?.accessToken;
    console.log('Getting platform token:', { platformId, hasToken: !!token });
    return token;
  };

  return (
    <AccountsContext.Provider value={{ 
      platforms, 
      connectPlatform, 
      disconnectPlatform,
      updatePlatformToken,
      getPlatformToken
    }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AccountsProviderInner>{children}</AccountsProviderInner>
    </Suspense>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
} 